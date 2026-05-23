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
            'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1',
            [decoded.id]
        );
        
        return result.rows[0] || null;
    } catch (error) {
        return null;
    }
};

const resolvers = {
    // ============== QUERY RESOLVERS ==============
    
    Query: {
        // Test query
        hello: () => 'Welcome to Campus Crave Digital Ordering System!',
        
        // Get current user
        me: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            return user;
        },
        
        // Get user by ID
        user: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            const result = await pool.query(
                'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1',
                [id]
            );
            if (result.rows.length === 0) throw new Error('User not found');
            return result.rows[0];
        },
        
        // Get all users (with filters)
        users: async (_, { role, limit = 100, offset = 0 }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            
            let query = 'SELECT id, username, email, phone, role, created_at, last_login FROM users';
            const values = [];
            
            if (role) {
                query += ' WHERE role = $1';
                values.push(role);
                query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
                values.push(limit, offset);
            } else {
                query += ` LIMIT $1 OFFSET $2`;
                values.push(limit, offset);
            }
            
            const result = await pool.query(query, values);
            return result.rows;
        },
        
        // Get my student profile
        myProfile: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const result = await pool.query(
                `SELECT s.*, u.username, u.email 
                 FROM students s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.user_id = $1`,
                [user.id]
            );
            
            if (result.rows.length === 0) throw new Error('Student profile not found');
            return result.rows[0];
        },
        
        // Get student by ID
        student: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const result = await pool.query(
                `SELECT s.*, u.username, u.email 
                 FROM students s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.id = $1`,
                [id]
            );
            
            if (result.rows.length === 0) throw new Error('Student not found');
            return result.rows[0];
        },
        
        // Get all students
        students: async (_, { limit = 100, offset = 0 }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            
            const result = await pool.query(
                `SELECT s.*, u.username, u.email 
                 FROM students s 
                 JOIN users u ON s.user_id = u.id 
                 ORDER BY s.created_at DESC 
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            
            return result.rows;
        },
        
        // Get all cafes
        cafes: async (_, { active_only = true }) => {
            let query = 'SELECT * FROM cafes';
            if (active_only) {
                query += ' WHERE is_active = true';
            }
            query += ' ORDER BY name';
            
            const result = await pool.query(query);
            return result.rows;
        },
        
        // Get single cafe
        cafe: async (_, { id }) => {
            const result = await pool.query('SELECT * FROM cafes WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new Error('Cafe not found');
            return result.rows[0];
        },
        
        // Get menu items
        menuItems: async (_, { cafe_id, category }) => {
            let query = 'SELECT * FROM menu_items WHERE status = $1';
            const values = ['Available'];
            
            if (cafe_id) {
                query += ' AND cafe_id = $' + (values.length + 1);
                values.push(cafe_id);
            }
            
            if (category) {
                query += ' AND category = $' + (values.length + 1);
                values.push(category);
            }
            
            query += ' ORDER BY category, name';
            
            const result = await pool.query(query, values);
            return result.rows;
        },
        
        // Get single menu item
        menuItem: async (_, { id }) => {
            const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new Error('Menu item not found');
            return result.rows[0];
        },
        
        // Get my orders
        myOrders: async (_, { limit = 50, status }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            // Get student ID
            const studentResult = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [user.id]
            );
            
            if (studentResult.rows.length === 0) throw new Error('Student profile not found');
            const studentId = studentResult.rows[0].id;
            
            let query = 'SELECT * FROM orders WHERE student_id = $1';
            const values = [studentId];
            
            if (status) {
                query += ' AND order_status = $2';
                values.push(status);
            }
            
            query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1);
            values.push(limit);
            
            const result = await pool.query(query, values);
            return result.rows;
        },
        
        // Get orders by cafe (for staff/owner)
        cafeOrders: async (_, { cafe_id, status, limit = 100 }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'staff' && user.role !== 'owner' && user.role !== 'admin') {
                throw new Error('Not authorized');
            }
            
            let query = 'SELECT * FROM orders WHERE cafe_id = $1';
            const values = [cafe_id];
            
            if (status) {
                query += ' AND order_status = $2';
                values.push(status);
            }
            
            query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1);
            values.push(limit);
            
            const result = await pool.query(query, values);
            return result.rows;
        },
        
        // Get single order
        order: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
            if (result.rows.length === 0) throw new Error('Order not found');
            return result.rows[0];
        },
        
        // Get my cart
        myCart: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            // Get student ID
            const studentResult = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [user.id]
            );
            
            if (studentResult.rows.length === 0) throw new Error('Student profile not found');
            const studentId = studentResult.rows[0].id;
            
            // Get or create cart
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
            
            // Get cart items
            const itemsResult = await pool.query(
                `SELECT ci.*, mi.name, mi.price as current_price, mi.category
                 FROM cart_items ci
                 JOIN menu_items mi ON ci.menu_item_id = mi.id
                 WHERE ci.cart_id = $1`,
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
        },
        
        // Get my deliveries (for delivery personnel)
        myDeliveries: async (_, { status }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'delivery') throw new Error('Not authorized');
            
            let query = 'SELECT * FROM deliveries WHERE delivery_person_id = $1';
            const values = [user.id];
            
            if (status) {
                query += ' AND status = $2';
                values.push(status);
            }
            
            query += ' ORDER BY created_at DESC';
            
            const result = await pool.query(query, values);
            return result.rows;
        },
        
        // Get all deliveries (admin only)
        deliveries: async (_, { limit = 100 }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            
            const result = await pool.query(
                'SELECT * FROM deliveries ORDER BY created_at DESC LIMIT $1',
                [limit]
            );
            return result.rows;
        }
    },
    
    // ============== MUTATION RESOLVERS ==============
    
    Mutation: {
        // Register new user
        register: async (_, { input }) => {
            // Check if email exists
            const existingEmail = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [input.email]
            );
            if (existingEmail.rows.length > 0) {
                throw new Error('Email already registered');
            }
            
            // Check if username exists
            const existingUsername = await pool.query(
                'SELECT * FROM users WHERE username = $1',
                [input.username]
            );
            if (existingUsername.rows.length > 0) {
                throw new Error('Username already taken');
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(input.password, 10);
            
            // Insert user
            const userResult = await pool.query(
                `INSERT INTO users (username, email, password_hash, phone, role) 
                 VALUES ($1, $2, $3, $4, 'student') 
                 RETURNING id, username, email, phone, role, created_at`,
                [input.username, input.email, hashedPassword, input.phone]
            );
            
            const user = userResult.rows[0];
            
            // Insert student profile
            await pool.query(
                `INSERT INTO students (user_id, full_name, reg_no, institution, department, year_of_study, phone_number, verification_status, id_image_path) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', $8)`,
                [user.id, input.full_name, input.reg_no, input.institution, input.department, input.year_of_study || null, input.phone, '/uploads/temp.jpg']
            );
            
            // Generate token
            const token = generateToken(user);
            
            return { token, user };
        },
        
        // Login user
        login: async (_, { input }) => {
            const userResult = await pool.query(
                'SELECT * FROM users WHERE email = $1',
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
            
            // Update last login
            await pool.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );
            
            const token = generateToken(user);
            
            // Remove password hash
            delete user.password_hash;
            
            return { token, user };
        },
        
        // Create cafe
        createCafe: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin' && user.role !== 'owner') {
                throw new Error('Not authorized');
            }
            
            const { name, description, location, contact_phone } = input;
            
            const result = await pool.query(
                `INSERT INTO cafes (name, description, location, contact_phone, is_active) 
                 VALUES ($1, $2, $3, $4, true) 
                 RETURNING *`,
                [name, description || null, location, contact_phone || null]
            );
            
            const newCafe = result.rows[0];
            
            // If user is owner, link them to the cafe
            if (user.role === 'owner') {
                await pool.query(
                    `INSERT INTO cafe_users (user_id, cafe_id, position) 
                     VALUES ($1, $2, 'Owner')`,
                    [user.id, newCafe.id]
                );
            }
            
            return newCafe;
        },
        
        // Update cafe
        updateCafe: async (_, { id, input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            // Check authorization
            if (user.role !== 'admin') {
                const userCafe = await pool.query(
                    'SELECT cafe_id FROM cafe_users WHERE user_id = $1 AND cafe_id = $2',
                    [user.id, id]
                );
                if (userCafe.rows.length === 0) {
                    throw new Error('Not authorized to update this cafe');
                }
            }
            
            // Check if cafe exists
            const cafeExists = await pool.query('SELECT id FROM cafes WHERE id = $1', [id]);
            if (cafeExists.rows.length === 0) throw new Error('Cafe not found');
            
            const { name, description, location, contact_phone, is_active } = input;
            
            const updates = [];
            const values = [];
            let paramCount = 1;
            
            if (name !== undefined) {
                updates.push(`name = $${paramCount++}`);
                values.push(name);
            }
            if (description !== undefined) {
                updates.push(`description = $${paramCount++}`);
                values.push(description);
            }
            if (location !== undefined) {
                updates.push(`location = $${paramCount++}`);
                values.push(location);
            }
            if (contact_phone !== undefined) {
                updates.push(`contact_phone = $${paramCount++}`);
                values.push(contact_phone);
            }
            if (is_active !== undefined) {
                updates.push(`is_active = $${paramCount++}`);
                values.push(is_active);
            }
            
            if (updates.length === 0) throw new Error('No fields to update');
            
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            
            const query = `
                UPDATE cafes 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;
            
            const result = await pool.query(query, values);
            return result.rows[0];
        },
        
        // Delete cafe
        deleteCafe: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Only admins can delete cafes');
            
            // Check if cafe has orders
            const ordersCheck = await pool.query(
                'SELECT COUNT(*) FROM orders WHERE cafe_id = $1',
                [id]
            );
            
            if (parseInt(ordersCheck.rows[0].count) > 0) {
                throw new Error('Cannot delete cafe with existing orders. Use toggleCafeStatus to deactivate.');
            }
            
            const result = await pool.query('DELETE FROM cafes WHERE id = $1 RETURNING id', [id]);
            return result.rows.length > 0;
        },
        
        // Toggle cafe status
        toggleCafeStatus: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const result = await pool.query(
                `UPDATE cafes 
                 SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [id]
            );
            
            if (result.rows.length === 0) throw new Error('Cafe not found');
            return result.rows[0];
        },
        
        // Create menu item
        createMenuItem: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const { cafe_id, name, description, price, category, preparation_time, image_url } = input;
            
            // Check authorization (owner of this cafe or admin)
            if (user.role !== 'admin') {
                const userCafe = await pool.query(
                    'SELECT cafe_id FROM cafe_users WHERE user_id = $1 AND cafe_id = $2',
                    [user.id, cafe_id]
                );
                if (userCafe.rows.length === 0) {
                    throw new Error('Not authorized to add items to this cafe');
                }
            }
            
            const result = await pool.query(
                `INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, image_url, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'Available') 
                 RETURNING *`,
                [cafe_id, name, description || null, price, category || null, preparation_time || null, image_url || null]
            );
            
            return result.rows[0];
        },
        
        // Update menu item
        updateMenuItem: async (_, { id, input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const { name, description, price, category, status, preparation_time, image_url } = input;
            
            const updates = [];
            const values = [];
            let paramCount = 1;
            
            if (name !== undefined) {
                updates.push(`name = $${paramCount++}`);
                values.push(name);
            }
            if (description !== undefined) {
                updates.push(`description = $${paramCount++}`);
                values.push(description);
            }
            if (price !== undefined) {
                updates.push(`price = $${paramCount++}`);
                values.push(price);
            }
            if (category !== undefined) {
                updates.push(`category = $${paramCount++}`);
                values.push(category);
            }
            if (status !== undefined) {
                updates.push(`status = $${paramCount++}`);
                values.push(status);
            }
            if (preparation_time !== undefined) {
                updates.push(`preparation_time = $${paramCount++}`);
                values.push(preparation_time);
            }
            if (image_url !== undefined) {
                updates.push(`image_url = $${paramCount++}`);
                values.push(image_url);
            }
            
            if (updates.length === 0) throw new Error('No fields to update');
            
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            
            const query = `
                UPDATE menu_items 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;
            
            const result = await pool.query(query, values);
            if (result.rows.length === 0) throw new Error('Menu item not found');
            return result.rows[0];
        },
        
        // Delete menu item
        deleteMenuItem: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);
            return result.rows.length > 0;
        },
        
        // Add to cart
        addToCart: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            // Get student ID
            const studentResult = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [user.id]
            );
            if (studentResult.rows.length === 0) throw new Error('Student profile not found');
            const studentId = studentResult.rows[0].id;
            
            // Get or create cart
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
            
            // Get menu item price
            const menuResult = await pool.query(
                'SELECT price FROM menu_items WHERE id = $1',
                [input.menu_item_id]
            );
            if (menuResult.rows.length === 0) throw new Error('Menu item not found');
            const price = menuResult.rows[0].price;
            
            // Check if item already in cart
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
            
            // Return updated cart
            const updatedCart = await pool.query(
                'SELECT * FROM carts WHERE id = $1',
                [cart.id]
            );
            
            const itemsResult = await pool.query(
                `SELECT ci.*, mi.name, mi.price as current_price, mi.category
                 FROM cart_items ci
                 JOIN menu_items mi ON ci.menu_item_id = mi.id
                 WHERE ci.cart_id = $1`,
                [cart.id]
            );
            
            const items = itemsResult.rows;
            const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
            const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
            
            return {
                ...updatedCart.rows[0],
                items,
                total,
                item_count: itemCount
            };
        },
        
        // Update cart item quantity
        updateCartItem: async (_, { cart_item_id, quantity }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            if (quantity <= 0) {
                await pool.query('DELETE FROM cart_items WHERE id = $1', [cart_item_id]);
            } else {
                await pool.query(
                    'UPDATE cart_items SET quantity = $1 WHERE id = $2',
                    [quantity, cart_item_id]
                );
            }
            
            // Get student ID
            const studentResult = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [user.id]
            );
            const studentId = studentResult.rows[0].id;
            
            const cartResult = await pool.query(
                'SELECT * FROM carts WHERE student_id = $1',
                [studentId]
            );
            const cart = cartResult.rows[0];
            
            const itemsResult = await pool.query(
                `SELECT ci.*, mi.name, mi.price as current_price
                 FROM cart_items ci
                 JOIN menu_items mi ON ci.menu_item_id = mi.id
                 WHERE ci.cart_id = $1`,
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
        },
        
        // Remove from cart
        removeFromCart: async (_, { cart_item_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            await pool.query('DELETE FROM cart_items WHERE id = $1', [cart_item_id]);
            
            // Get student ID
            const studentResult = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [user.id]
            );
            const studentId = studentResult.rows[0].id;
            
            const cartResult = await pool.query(
                'SELECT * FROM carts WHERE student_id = $1',
                [studentId]
            );
            const cart = cartResult.rows[0];
            
            const itemsResult = await pool.query(
                `SELECT ci.*, mi.name, mi.price as current_price
                 FROM cart_items ci
                 JOIN menu_items mi ON ci.menu_item_id = mi.id
                 WHERE ci.cart_id = $1`,
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
        },
        
        // Clear cart
        clearCart: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const studentResult = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [user.id]
            );
            const studentId = studentResult.rows[0].id;
            
            const cartResult = await pool.query(
                'SELECT id FROM carts WHERE student_id = $1',
                [studentId]
            );
            
            if (cartResult.rows.length > 0) {
                await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartResult.rows[0].id]);
            }
            
            return true;
        },
        
        // Create order
        createOrder: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            // Get student ID
            const studentResult = await pool.query(
                'SELECT id FROM students WHERE user_id = $1',
                [user.id]
            );
            if (studentResult.rows.length === 0) throw new Error('Student profile not found');
            const studentId = studentResult.rows[0].id;
            
            // Get cart
            const cartResult = await pool.query(
                'SELECT * FROM carts WHERE student_id = $1',
                [studentId]
            );
            if (cartResult.rows.length === 0) throw new Error('Cart not found');
            const cart = cartResult.rows[0];
            
            // Get cart items
            const itemsResult = await pool.query(
                `SELECT ci.*, mi.price as current_price
                 FROM cart_items ci
                 JOIN menu_items mi ON ci.menu_item_id = mi.id
                 WHERE ci.cart_id = $1`,
                [cart.id]
            );
            
            const items = itemsResult.rows;
            if (items.length === 0) throw new Error('Cart is empty');
            
            const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
            if (itemCount > 6) throw new Error('Maximum 6 items per order');
            
            const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
            
            // Check payment rules
            let paymentType = input.payment_type;
            if (itemCount >= 4 && paymentType !== 'Online') {
                throw new Error('Orders with 4+ items require online payment');
            }
            
            // Create order
            const orderResult = await pool.query(
                `INSERT INTO orders (order_number, student_id, cafe_id, total_amount, item_count, payment_type, special_instructions) 
                 VALUES (DEFAULT, $1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [studentId, input.cafe_id, totalAmount, itemCount, paymentType, input.special_instructions || null]
            );
            
            const order = orderResult.rows[0];
            
            // Create order items
            for (const item of items) {
                await pool.query(
                    `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, customizations) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [order.id, item.menu_item_id, item.quantity, item.unit_price, item.unit_price * item.quantity, item.customizations]
                );
            }
            
            // Create payment record
            await pool.query(
                `INSERT INTO payments (order_id, amount, payment_method, payment_status) 
                 VALUES ($1, $2, $3, 'Pending')`,
                [order.id, totalAmount, paymentType]
            );
            
            // Clear cart
            await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
            
            return order;
        },
        
        // Update order status
        updateOrderStatus: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'staff' && user.role !== 'owner' && user.role !== 'admin') {
                throw new Error('Not authorized');
            }
            
            const result = await pool.query(
                `UPDATE orders 
                 SET order_status = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
                [input.status, input.order_id]
            );
            
            if (result.rows.length === 0) throw new Error('Order not found');
            return result.rows[0];
        },
        
        // Cancel order
        cancelOrder: async (_, { order_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            // Check if order can be cancelled
            const orderResult = await pool.query(
                'SELECT order_status FROM orders WHERE id = $1',
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
        },
        
        // Assign delivery
        assignDelivery: async (_, { order_id, delivery_person_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin' && user.role !== 'owner') {
                throw new Error('Not authorized');
            }
            
            const result = await pool.query(
                `INSERT INTO deliveries (order_id, delivery_person_id, assigned_by, status) 
                 VALUES ($1, $2, $3, 'ASSIGNED') 
                 RETURNING *`,
                [order_id, delivery_person_id, user.id]
            );
            
            return result.rows[0];
        },
        
        // Update delivery status
        updateDeliveryStatus: async (_, { delivery_id, status }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
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
            return result.rows[0];
        },
        
        // Verify student with OCR
        verifyStudentWithOCR: async (_, { student_id, id_image_base64 }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            
            // Simulate OCR verification
            const mockExtractedText = `Student ID Verified - ${Date.now()}`;
            const mockConfidence = 95.5;
            
            await pool.query(
                `INSERT INTO ocr_validations (student_id, extracted_data, confidence_score, status) 
                 VALUES ($1, $2, $3, 'Verified')`,
                [student_id, mockExtractedText, mockConfidence]
            );
            
            const result = await pool.query(
                `UPDATE students 
                 SET verification_status = 'Approved', verified_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [student_id]
            );
            
            return result.rows[0];
        }
    },
    
    // ============== FIELD RESOLVERS (for relationships) ==============
    
    Student: {
        user: async (student) => {
            const result = await pool.query(
                'SELECT id, username, email, phone, role, created_at FROM users WHERE id = $1',
                [student.user_id]
            );
            return result.rows[0];
        }
    },
    
    Cafe: {
        menu_items: async (cafe) => {
            const result = await pool.query(
                'SELECT * FROM menu_items WHERE cafe_id = $1 AND status = $2 ORDER BY category, name',
                [cafe.id, 'Available']
            );
            return result.rows;
        },
        owner: async (cafe) => {
            const result = await pool.query(
                `SELECT u.id, u.username, u.email, u.phone
                 FROM users u
                 JOIN cafe_users cu ON u.id = cu.user_id
                 WHERE cu.cafe_id = $1 AND cu.position = 'Owner'`,
                [cafe.id]
            );
            return result.rows[0];
        },
        staff: async (cafe) => {
            const result = await pool.query(
                `SELECT u.id, u.username, u.email, u.phone, cu.position
                 FROM users u
                 JOIN cafe_users cu ON u.id = cu.user_id
                 WHERE cu.cafe_id = $1`,
                [cafe.id]
            );
            return result.rows;
        }
    },
    
    MenuItem: {
        cafe: async (menuItem) => {
            const result = await pool.query('SELECT * FROM cafes WHERE id = $1', [menuItem.cafe_id]);
            return result.rows[0];
        }
    },
    
    Order: {
        student: async (order) => {
            const result = await pool.query('SELECT * FROM students WHERE id = $1', [order.student_id]);
            return result.rows[0];
        },
        cafe: async (order) => {
            const result = await pool.query('SELECT * FROM cafes WHERE id = $1', [order.cafe_id]);
            return result.rows[0];
        },
        items: async (order) => {
            const result = await pool.query(
                `SELECT oi.*, mi.name, mi.category
                 FROM order_items oi
                 JOIN menu_items mi ON oi.menu_item_id = mi.id
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            return result.rows;
        },
        payment: async (order) => {
            const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [order.id]);
            return result.rows[0];
        },
        delivery: async (order) => {
            const result = await pool.query('SELECT * FROM deliveries WHERE order_id = $1', [order.id]);
            return result.rows[0];
        }
    },
    
    Payment: {
        order: async (payment) => {
            const result = await pool.query('SELECT * FROM orders WHERE id = $1', [payment.order_id]);
            return result.rows[0];
        }
    },
    
    Delivery: {
        delivery_person: async (delivery) => {
            const result = await pool.query(
                'SELECT id, username, email, phone FROM users WHERE id = $1',
                [delivery.delivery_person_id]
            );
            return result.rows[0];
        },
        assigner: async (delivery) => {
            const result = await pool.query(
                'SELECT id, username, email, phone FROM users WHERE id = $1',
                [delivery.assigned_by]
            );
            return result.rows[0];
        },
        order: async (delivery) => {
            const result = await pool.query('SELECT * FROM orders WHERE id = $1', [delivery.order_id]);
            return result.rows[0];
        }
    },
    
    CartItem: {
        menu_item: async (cartItem) => {
            const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [cartItem.menu_item_id]);
            return result.rows[0];
        }
    },
    
    OCRValidation: {
        student: async (ocr) => {
            const result = await pool.query('SELECT * FROM students WHERE id = $1', [ocr.student_id]);
            return result.rows[0];
        }
    }
};

module.exports = { resolvers, getUserFromToken };