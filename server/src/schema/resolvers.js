const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'campus_crave_secret_2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Helper function to get user from token
const getUserFromToken = async (token) => {
    if (!token) return null;
    
    try {
        const cleanedToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(cleanedToken, process.env.JWT_SECRET || 'campus_crave_secret_2024');
        
        const result = await pool.query(
            'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1 AND deleted_at IS NULL',
            [decoded.id]
        );
        
        return result.rows[0] || null;
    } catch (error) {
        return null;
    }
};

// Helper to check if user owns a cafe
const checkUserOwnsCafe = async (userId, cafeId) => {
    const result = await pool.query(
        'SELECT * FROM cafe_users WHERE user_id = $1 AND cafe_id = $2',
        [userId, cafeId]
    );
    return result.rows.length > 0;
};

const resolvers = {
    // ============== QUERY RESOLVERS ==============
    
    Query: {
        hello: () => 'Welcome to Campus Crave Digital Ordering System!',
        
        me: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            return user;
        },
        
        cafes: async () => {
            try {
                const result = await pool.query(
                    'SELECT * FROM cafes WHERE deleted_at IS NULL ORDER BY name'
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching cafes:', error);
                throw new Error('Failed to fetch cafes');
            }
        },
        
        cafe: async (_, { id }) => {
            try {
                const result = await pool.query(
                    'SELECT * FROM cafes WHERE id = $1 AND deleted_at IS NULL',
                    [id]
                );
                if (result.rows.length === 0) throw new Error('Cafe not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching cafe:', error);
                throw new Error('Failed to fetch cafe');
            }
        },
        
        menuItems: async (_, { cafe_id }) => {
            try {
                let query = 'SELECT * FROM menu_items WHERE deleted_at IS NULL AND status = $1';
                const values = ['Available'];
                
                if (cafe_id) {
                    query += ' AND cafe_id = $2';
                    values.push(cafe_id);
                }
                
                query += ' ORDER BY category, name';
                
                const result = await pool.query(query, values);
                return result.rows;
            } catch (error) {
                console.error('Error fetching menu items:', error);
                throw new Error('Failed to fetch menu items');
            }
        },
        
        menuItem: async (_, { id }) => {
            try {
                const result = await pool.query(
                    'SELECT * FROM menu_items WHERE id = $1 AND deleted_at IS NULL',
                    [id]
                );
                if (result.rows.length === 0) throw new Error('Menu item not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching menu item:', error);
                throw new Error('Failed to fetch menu item');
            }
        },
        
        myCart: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                
                if (studentResult.rows.length === 0) {
                    return { items: [], total: 0, item_count: 0 };
                }
                
                const studentId = studentResult.rows[0].id;
                
                let cartResult = await pool.query(
                    'SELECT * FROM carts WHERE student_id = $1',
                    [studentId]
                );
                
                let cart = cartResult.rows[0];
                
                if (!cart) {
                    const newCart = await pool.query(
                        'INSERT INTO carts (student_id) VALUES ($1) RETURNING *',
                        [studentId]
                    );
                    cart = newCart.rows[0];
                }
                
                const itemsResult = await pool.query(
                    `SELECT ci.*, mi.name, mi.price as current_price, mi.category, mi.description, mi.image_url
                     FROM cart_items ci
                     JOIN menu_items mi ON ci.menu_item_id = mi.id
                     WHERE ci.cart_id = $1 AND mi.deleted_at IS NULL`,
                    [cart.id]
                );
                
                const items = itemsResult.rows;
                const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                
                return {
                    ...cart,
                    items,
                    total,
                    item_count: itemCount
                };
            } catch (error) {
                console.error('Error fetching cart:', error);
                throw new Error('Failed to fetch cart');
            }
        },
        
        myOrders: async (_, { limit = 50, status }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                
                if (studentResult.rows.length === 0) return [];
                const studentId = studentResult.rows[0].id;
                
                let query = `
                    SELECT o.*, c.name as cafe_name, c.location as cafe_location
                    FROM orders o
                    JOIN cafes c ON o.cafe_id = c.id
                    WHERE o.student_id = $1 AND o.deleted_at IS NULL
                `;
                const values = [studentId];
                
                if (status) {
                    query += ` AND o.order_status = $2`;
                    values.push(status);
                }
                
                query += ` ORDER BY o.created_at DESC LIMIT $${values.length + 1}`;
                values.push(limit);
                
                const result = await pool.query(query, values);
                return result.rows;
            } catch (error) {
                console.error('Error fetching orders:', error);
                throw new Error('Failed to fetch orders');
            }
        },
        
        order: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const result = await pool.query(
                    `SELECT o.*, c.name as cafe_name, c.location as cafe_location
                     FROM orders o
                     JOIN cafes c ON o.cafe_id = c.id
                     WHERE o.id = $1 AND o.deleted_at IS NULL`,
                    [id]
                );
                
                if (result.rows.length === 0) throw new Error('Order not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching order:', error);
                throw new Error('Failed to fetch order');
            }
        },
        
        myProfile: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const result = await pool.query(
                    `SELECT s.*, u.username, u.email
                     FROM students s
                     JOIN users u ON s.user_id = u.id
                     WHERE s.user_id = $1 AND u.deleted_at IS NULL`,
                    [user.id]
                );
                
                if (result.rows.length === 0) return null;
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching profile:', error);
                throw new Error('Failed to fetch profile');
            }
        },
        
        users: async (_, { role, limit = 100, offset = 0 }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                let query = 'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE deleted_at IS NULL';
                const values = [];
                
                if (role) {
                    query += ' AND role = $1';
                    values.push(role);
                    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
                    values.push(limit, offset);
                } else {
                    query += ` LIMIT $1 OFFSET $2`;
                    values.push(limit, offset);
                }
                
                const result = await pool.query(query, values);
                return result.rows;
            } catch (error) {
                console.error('Error fetching users:', error);
                throw new Error('Failed to fetch users');
            }
        },
        
        user: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const result = await pool.query(
                    'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1 AND deleted_at IS NULL',
                    [id]
                );
                
                if (result.rows.length === 0) throw new Error('User not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching user:', error);
                throw new Error('Failed to fetch user');
            }
        },
        
        getMyCafes: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'owner' && user.role !== 'staff' && user.role !== 'admin') {
                throw new Error('Not authorized');
            }
            
            try {
                let query;
                let values;
                
                if (user.role === 'admin') {
                    query = 'SELECT * FROM cafes WHERE deleted_at IS NULL ORDER BY name';
                    values = [];
                } else {
                    query = `
                        SELECT c.* FROM cafes c
                        JOIN cafe_users cu ON c.id = cu.cafe_id
                        WHERE cu.user_id = $1 AND c.deleted_at IS NULL
                        ORDER BY c.name
                    `;
                    values = [user.id];
                }
                
                const result = await pool.query(query, values);
                return result.rows;
            } catch (error) {
                console.error('Error fetching my cafes:', error);
                throw new Error('Failed to fetch cafes');
            }
        },
        
        myDeliveries: async (_, { status }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'delivery') throw new Error('Not authorized');
            
            try {
                let query = 'SELECT * FROM deliveries WHERE delivery_person_id = $1';
                const values = [user.id];
                
                if (status) {
                    query += ' AND status = $2';
                    values.push(status);
                }
                
                query += ' ORDER BY created_at DESC';
                
                const result = await pool.query(query, values);
                return result.rows;
            } catch (error) {
                console.error('Error fetching my deliveries:', error);
                throw new Error('Failed to fetch deliveries');
            }
        },
        
        deliveries: async (_, { limit = 100 }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    `SELECT d.*, u.username as delivery_person_name
                     FROM deliveries d
                     JOIN users u ON d.delivery_person_id = u.id
                     ORDER BY d.created_at DESC
                     LIMIT $1`,
                    [limit]
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching deliveries:', error);
                throw new Error('Failed to fetch deliveries');
            }
        },
    },
    
    // ============== FIELD RESOLVERS ==============
    
    Cafe: {
        menu_items: async (cafe) => {
            try {
                const result = await pool.query(
                    'SELECT * FROM menu_items WHERE cafe_id = $1 AND deleted_at IS NULL AND status = $2 ORDER BY category, name',
                    [cafe.id, 'Available']
                );
                return result.rows;
            } catch (error) {
                return [];
            }
        }
    },
    
    Order: {
        cafe: async (order) => {
            try {
                const result = await pool.query('SELECT * FROM cafes WHERE id = $1 AND deleted_at IS NULL', [order.cafe_id]);
                return result.rows[0];
            } catch (error) {
                return null;
            }
        },
        items: async (order) => {
            try {
                const result = await pool.query(
                    `SELECT oi.*, mi.name, mi.price as current_price, mi.category
                     FROM order_items oi
                     JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE oi.order_id = $1 AND mi.deleted_at IS NULL`,
                    [order.id]
                );
                return result.rows;
            } catch (error) {
                return [];
            }
        },
        payment: async (order) => {
            try {
                const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [order.id]);
                return result.rows[0];
            } catch (error) {
                return null;
            }
        },
        delivery: async (order) => {
            try {
                const result = await pool.query('SELECT * FROM deliveries WHERE order_id = $1', [order.id]);
                return result.rows[0];
            } catch (error) {
                return null;
            }
        }
    },
    
    // ============== MUTATION RESOLVERS ==============
    
    Mutation: {
        // Auth Mutations
        register: async (_, { input }) => {
            try {
                const existingEmail = await pool.query(
                    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
                    [input.email]
                );
                if (existingEmail.rows.length > 0) {
                    throw new Error('Email already registered');
                }
                
                const existingUsername = await pool.query(
                    'SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL',
                    [input.username]
                );
                if (existingUsername.rows.length > 0) {
                    throw new Error('Username already taken');
                }
                
                const hashedPassword = await bcrypt.hash(input.password, 10);
                
                const userResult = await pool.query(
                    `INSERT INTO users (username, email, password_hash, phone, role) 
                     VALUES ($1, $2, $3, $4, 'student') 
                     RETURNING id, username, email, phone, role, created_at`,
                    [input.username, input.email, hashedPassword, input.phone]
                );
                
                const user = userResult.rows[0];
                
                await pool.query(
                    `INSERT INTO students (user_id, full_name, reg_no, institution, department, phone_number, verification_status) 
                     VALUES ($1, $2, $3, $4, $5, $6, 'Pending')`,
                    [user.id, input.full_name, input.reg_no, input.institution, input.department, input.phone]
                );
                
                const token = generateToken(user);
                
                return { token, user };
            } catch (error) {
                console.error('Registration error:', error);
                throw new Error(error.message || 'Registration failed');
            }
        },
        
        login: async (_, { input }) => {
            try {
                const userResult = await pool.query(
                    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
                    [input.email]
                );
                
                if (userResult.rows.length === 0) {
                    throw new Error('Invalid email or password');
                }
                
                const user = userResult.rows[0];
                const validPassword = await bcrypt.compare(input.password, user.password_hash);
                
                if (!validPassword) {
                    throw new Error('Invalid email or password');
                }
                
                await pool.query(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );
                
                const token = generateToken(user);
                
                delete user.password_hash;
                
                return { token, user };
            } catch (error) {
                console.error('Login error:', error);
                throw new Error(error.message || 'Login failed');
            }
        },
        
        // Cart Mutations
        addToCart: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                
                if (studentResult.rows.length === 0) throw new Error('Student profile not found');
                const studentId = studentResult.rows[0].id;
                
                let cartResult = await pool.query(
                    'SELECT * FROM carts WHERE student_id = $1',
                    [studentId]
                );
                let cart = cartResult.rows[0];
                
                if (!cart) {
                    const newCart = await pool.query(
                        'INSERT INTO carts (student_id) VALUES ($1) RETURNING *',
                        [studentId]
                    );
                    cart = newCart.rows[0];
                }
                
                const menuResult = await pool.query(
                    'SELECT price FROM menu_items WHERE id = $1 AND deleted_at IS NULL',
                    [input.menu_item_id]
                );
                if (menuResult.rows.length === 0) throw new Error('Menu item not found');
                const price = menuResult.rows[0].price;
                
                const existingItem = await pool.query(
                    'SELECT * FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2',
                    [cart.id, input.menu_item_id]
                );
                
                if (existingItem.rows.length > 0) {
                    await pool.query(
                        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
                        [input.quantity, existingItem.rows[0].id]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO cart_items (cart_id, menu_item_id, quantity, unit_price, customizations) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [cart.id, input.menu_item_id, input.quantity, price, input.customizations || null]
                    );
                }
                
                const itemsResult = await pool.query(
                    `SELECT ci.*, mi.name, mi.price as current_price, mi.category
                     FROM cart_items ci
                     JOIN menu_items mi ON ci.menu_item_id = mi.id
                     WHERE ci.cart_id = $1 AND mi.deleted_at IS NULL`,
                    [cart.id]
                );
                
                const items = itemsResult.rows;
                const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                
                return {
                    ...cart,
                    items,
                    total,
                    item_count: itemCount
                };
            } catch (error) {
                console.error('Add to cart error:', error);
                throw new Error('Failed to add to cart');
            }
        },
        
        updateCartItem: async (_, { cart_item_id, quantity }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                if (quantity <= 0) {
                    await pool.query('DELETE FROM cart_items WHERE id = $1', [cart_item_id]);
                } else {
                    await pool.query(
                        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
                        [quantity, cart_item_id]
                    );
                }
                
                return { success: true };
            } catch (error) {
                console.error('Update cart item error:', error);
                throw new Error('Failed to update cart');
            }
        },
        
        removeFromCart: async (_, { cart_item_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                await pool.query('DELETE FROM cart_items WHERE id = $1', [cart_item_id]);
                return { success: true };
            } catch (error) {
                console.error('Remove from cart error:', error);
                throw new Error('Failed to remove from cart');
            }
        },
        
        clearCart: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                
                if (studentResult.rows.length > 0) {
                    const studentId = studentResult.rows[0].id;
                    const cartResult = await pool.query(
                        'SELECT id FROM carts WHERE student_id = $1',
                        [studentId]
                    );
                    
                    if (cartResult.rows.length > 0) {
                        await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartResult.rows[0].id]);
                    }
                }
                
                return true;
            } catch (error) {
                console.error('Clear cart error:', error);
                throw new Error('Failed to clear cart');
            }
        },
        
        // Order Mutations
        createOrder: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                if (studentResult.rows.length === 0) throw new Error('Student profile not found');
                const studentId = studentResult.rows[0].id;
                
                const cartResult = await pool.query(
                    'SELECT * FROM carts WHERE student_id = $1',
                    [studentId]
                );
                if (cartResult.rows.length === 0) throw new Error('Cart not found');
                const cart = cartResult.rows[0];
                
                const itemsResult = await pool.query(
                    `SELECT ci.*, mi.price as current_price
                     FROM cart_items ci
                     JOIN menu_items mi ON ci.menu_item_id = mi.id
                     WHERE ci.cart_id = $1 AND mi.deleted_at IS NULL`,
                    [cart.id]
                );
                
                const items = itemsResult.rows;
                if (items.length === 0) throw new Error('Cart is empty');
                
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                if (itemCount > 6) throw new Error('Maximum 6 items per order');
                
                const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                
                let paymentType = input.payment_type;
                if (itemCount >= 4 && itemCount <= 6) {
                    if (paymentType !== 'Online' && paymentType !== 'ONLINE_FULL') {
                        throw new Error('Orders with 4-6 items require full online payment');
                    }
                    paymentType = 'Online';
                }
                
                const orderResult = await pool.query(
                    `INSERT INTO orders (student_id, cafe_id, total_amount, item_count, payment_type, special_instructions, order_status) 
                     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') 
                     RETURNING *`,
                    [studentId, input.cafe_id, totalAmount, itemCount, paymentType, input.special_instructions || null]
                );
                
                const order = orderResult.rows[0];
                
                for (const item of items) {
                    await pool.query(
                        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, customizations) 
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [order.id, item.menu_item_id, item.quantity, item.unit_price, item.unit_price * item.quantity, item.customizations]
                    );
                }
                
                await pool.query(
                    `INSERT INTO payments (order_id, amount, payment_method, payment_status) 
                     VALUES ($1, $2, $3, 'Pending')`,
                    [order.id, totalAmount, paymentType]
                );
                
                await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
                
                return order;
            } catch (error) {
                console.error('Create order error:', error);
                throw new Error(error.message || 'Failed to create order');
            }
        },
        
        updateOrderStatus: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'staff' && user.role !== 'owner' && user.role !== 'admin') {
                throw new Error('Not authorized');
            }
            
            try {
                const result = await pool.query(
                    `UPDATE orders 
                     SET order_status = $1, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $2 AND deleted_at IS NULL
                     RETURNING *`,
                    [input.status, input.order_id]
                );
                
                if (result.rows.length === 0) throw new Error('Order not found');
                return result.rows[0];
            } catch (error) {
                console.error('Update order status error:', error);
                throw new Error('Failed to update order status');
            }
        },
        
        cancelOrder: async (_, { order_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const orderResult = await pool.query(
                    'SELECT order_status FROM orders WHERE id = $1 AND deleted_at IS NULL',
                    [order_id]
                );
                
                if (orderResult.rows.length === 0) throw new Error('Order not found');
                const status = orderResult.rows[0].order_status;
                
                if (status !== 'PENDING' && status !== 'CONFIRMED') {
                    throw new Error('Order cannot be cancelled at this stage');
                }
                
                const result = await pool.query(
                    `UPDATE orders 
                     SET order_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1
                     RETURNING *`,
                    [order_id]
                );
                
                return result.rows[0];
            } catch (error) {
                console.error('Cancel order error:', error);
                throw new Error(error.message || 'Failed to cancel order');
            }
        },
        
        // Cafe Mutations (Admin only)
        createCafe: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Only admin can create cafes');
            
            try {
                const { name, description, location, contact_phone } = input;
                
                const result = await pool.query(
                    `INSERT INTO cafes (name, description, location, contact_phone, is_active) 
                     VALUES ($1, $2, $3, $4, true) 
                     RETURNING *`,
                    [name, description || null, location, contact_phone || null]
                );
                
                return result.rows[0];
            } catch (error) {
                console.error('Create cafe error:', error);
                throw new Error('Failed to create cafe');
            }
        },
        
        updateCafe: async (_, { id, input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const { name, description, location, contact_phone, is_active } = input;
                
                const updates = [];
                const values = [];
                let paramCount = 1;
                
                if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
                if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
                if (location !== undefined) { updates.push(`location = $${paramCount++}`); values.push(location); }
                if (contact_phone !== undefined) { updates.push(`contact_phone = $${paramCount++}`); values.push(contact_phone); }
                if (is_active !== undefined) { updates.push(`is_active = $${paramCount++}`); values.push(is_active); }
                
                if (updates.length === 0) throw new Error('No fields to update');
                
                updates.push(`updated_at = CURRENT_TIMESTAMP`);
                values.push(id);
                
                const query = `
                    UPDATE cafes 
                    SET ${updates.join(', ')}
                    WHERE id = $${paramCount} AND deleted_at IS NULL
                    RETURNING *
                `;
                
                const result = await pool.query(query, values);
                if (result.rows.length === 0) throw new Error('Cafe not found');
                return result.rows[0];
            } catch (error) {
                console.error('Update cafe error:', error);
                throw new Error('Failed to update cafe');
            }
        },
        
        deleteCafe: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    'UPDATE cafes SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
                    [id]
                );
                return result.rows.length > 0;
            } catch (error) {
                console.error('Delete cafe error:', error);
                throw new Error('Failed to delete cafe');
            }
        },
        
        toggleCafeStatus: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    `UPDATE cafes 
                     SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1 AND deleted_at IS NULL
                     RETURNING *`,
                    [id]
                );
                
                if (result.rows.length === 0) throw new Error('Cafe not found');
                return result.rows[0];
            } catch (error) {
                console.error('Toggle cafe status error:', error);
                throw new Error('Failed to toggle cafe status');
            }
        },
        
        assignCafeOwner: async (_, { cafe_id, user_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Only admin can assign owners');
            
            try {
                const result = await pool.query(
                    `INSERT INTO cafe_users (user_id, cafe_id, position, hired_date) 
                     VALUES ($1, $2, 'Owner', CURRENT_DATE) 
                     ON CONFLICT (user_id, cafe_id) DO UPDATE SET position = 'Owner'
                     RETURNING *`,
                    [user_id, cafe_id]
                );
                
                return result.rows[0];
            } catch (error) {
                console.error('Assign cafe owner error:', error);
                throw new Error('Failed to assign owner');
            }
        },
        
        // ============== MENU ITEM MUTATIONS (FIXED) ==============
        
        createMenuItem: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const { cafe_id, name, description, price, category, preparation_time, image_url } = input;
                
                // Check if user owns this cafe
                const ownsCafe = await checkUserOwnsCafe(user.id, cafe_id);
                if (user.role !== 'admin' && !ownsCafe) {
                    throw new Error('Not authorized to add items to this cafe');
                }
                
                const result = await pool.query(
                    `INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, image_url, status) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'Available') 
                     RETURNING id, name, description, price, category, status, image_url, created_at`,
                    [cafe_id, name, description || null, price, category || null, preparation_time || null, image_url || null]
                );
                
                return result.rows[0];
            } catch (error) {
                console.error('Create menu item error:', error);
                throw new Error(error.message || 'Failed to create menu item');
            }
        },
        
        updateMenuItem: async (_, { id, input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                // Get cafe_id from menu item
                const menuResult = await pool.query(
                    'SELECT cafe_id FROM menu_items WHERE id = $1 AND deleted_at IS NULL',
                    [id]
                );
                if (menuResult.rows.length === 0) throw new Error('Menu item not found');
                const cafeId = menuResult.rows[0].cafe_id;
                
                // Check if user owns this cafe
                const ownsCafe = await checkUserOwnsCafe(user.id, cafeId);
                if (user.role !== 'admin' && !ownsCafe) {
                    throw new Error('Not authorized to update items from this cafe');
                }
                
                const { name, description, price, category, status, preparation_time, image_url } = input;
                
                const updates = [];
                const values = [];
                let paramCount = 1;
                
                if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
                if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
                if (price !== undefined) { updates.push(`price = $${paramCount++}`); values.push(price); }
                if (category !== undefined) { updates.push(`category = $${paramCount++}`); values.push(category); }
                if (status !== undefined) { updates.push(`status = $${paramCount++}`); values.push(status); }
                if (preparation_time !== undefined) { updates.push(`preparation_time = $${paramCount++}`); values.push(preparation_time); }
                if (image_url !== undefined) { updates.push(`image_url = $${paramCount++}`); values.push(image_url); }
                
                if (updates.length === 0) throw new Error('No fields to update');
                
                values.push(id);
                
                const query = `
                    UPDATE menu_items 
                    SET ${updates.join(', ')}
                    WHERE id = $${paramCount} AND deleted_at IS NULL
                    RETURNING id, name, description, price, category, status, image_url, created_at
                `;
                
                const result = await pool.query(query, values);
                if (result.rows.length === 0) throw new Error('Menu item not found');
                return result.rows[0];
            } catch (error) {
                console.error('Update menu item error:', error);
                throw new Error(error.message || 'Failed to update menu item');
            }
        },
        
        deleteMenuItem: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                // Get cafe_id from menu item
                const menuResult = await pool.query(
                    'SELECT cafe_id FROM menu_items WHERE id = $1 AND deleted_at IS NULL',
                    [id]
                );
                
                if (menuResult.rows.length === 0) {
                    return false;
                }
                
                const cafeId = menuResult.rows[0].cafe_id;
                
                // Check if user owns this cafe
                const ownsCafe = await checkUserOwnsCafe(user.id, cafeId);
                if (user.role !== 'admin' && !ownsCafe) {
                    throw new Error('Not authorized to delete items from this cafe');
                }
                
                const result = await pool.query(
                    'UPDATE menu_items SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
                    [id]
                );
                
                return result.rows.length > 0;
            } catch (error) {
                console.error('Delete menu item error:', error);
                throw new Error(error.message || 'Failed to delete menu item');
            }
        },
        
        // Delivery Mutations
        assignDelivery: async (_, { order_id, delivery_person_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    `INSERT INTO deliveries (order_id, delivery_person_id, assigned_by, status) 
                     VALUES ($1, $2, $3, 'ASSIGNED') 
                     RETURNING *`,
                    [order_id, delivery_person_id, user.id]
                );
                
                await pool.query(
                    `UPDATE orders SET order_status = 'ON_THE_WAY' WHERE id = $1`,
                    [order_id]
                );
                
                return result.rows[0];
            } catch (error) {
                console.error('Assign delivery error:', error);
                throw new Error('Failed to assign delivery');
            }
        },
        
        updateDeliveryStatus: async (_, { delivery_id, status }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const result = await pool.query(
                    `UPDATE deliveries 
                     SET status = $1, 
                         pickup_time = CASE WHEN $1 = 'PICKED_UP' THEN CURRENT_TIMESTAMP ELSE pickup_time END,
                         delivered_time = CASE WHEN $1 = 'DELIVERED' THEN CURRENT_TIMESTAMP ELSE delivered_time END,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $2
                     RETURNING *`,
                    [status, delivery_id]
                );
                
                if (result.rows.length === 0) throw new Error('Delivery not found');
                
                if (status === 'DELIVERED') {
                    await pool.query(
                        `UPDATE orders SET order_status = 'DELIVERED', completed_at = CURRENT_TIMESTAMP 
                         WHERE id = (SELECT order_id FROM deliveries WHERE id = $1)`,
                        [delivery_id]
                    );
                }
                
                return result.rows[0];
            } catch (error) {
                console.error('Update delivery status error:', error);
                throw new Error('Failed to update delivery status');
            }
        },
    }
};

module.exports = { resolvers, getUserFromToken };