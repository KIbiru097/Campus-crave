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
        
        // Get all cafes
        cafes: async () => {
            try {
                const result = await pool.query('SELECT * FROM cafes WHERE is_active = true ORDER BY name');
                return result.rows;
            } catch (error) {
                console.error('Error fetching cafes:', error);
                throw new Error('Failed to fetch cafes');
            }
        },
        
        // Get single cafe
        cafe: async (_, { id }) => {
            try {
                const result = await pool.query('SELECT * FROM cafes WHERE id = $1', [id]);
                if (result.rows.length === 0) throw new Error('Cafe not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching cafe:', error);
                throw new Error('Failed to fetch cafe');
            }
        },
        
        // Get menu items
        menuItems: async (_, { cafe_id }) => {
            try {
                let query = 'SELECT * FROM menu_items WHERE status = $1';
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
        
        // Get single menu item
        menuItem: async (_, { id }) => {
            try {
                const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
                if (result.rows.length === 0) throw new Error('Menu item not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching menu item:', error);
                throw new Error('Failed to fetch menu item');
            }
        },
        
        // Get my orders
        myOrders: async (_, { limit = 50 }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                
                if (studentResult.rows.length === 0) return [];
                const studentId = studentResult.rows[0].id;
                
                const result = await pool.query(
                    `SELECT o.*, c.name as cafe_name
                     FROM orders o
                     JOIN cafes c ON o.cafe_id = c.id
                     WHERE o.student_id = $1
                     ORDER BY o.created_at DESC
                     LIMIT $2`,
                    [studentId, limit]
                );
                
                return result.rows;
            } catch (error) {
                console.error('Error fetching orders:', error);
                throw new Error('Failed to fetch orders');
            }
        },
        
        // Get cart
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
            } catch (error) {
                console.error('Error fetching cart:', error);
                throw new Error('Failed to fetch cart');
            }
        }
    },
    
    // ============== MUTATION RESOLVERS ==============
    
    Mutation: {
        // Register new user
        register: async (_, { input }) => {
            try {
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
                    `INSERT INTO students (user_id, full_name, reg_no, institution, department, phone_number, verification_status) 
                     VALUES ($1, $2, $3, $4, $5, $6, 'Pending')`,
                    [user.id, input.full_name, input.reg_no, input.institution, input.department, input.phone]
                );
                
                // Generate token
                const token = generateToken(user);
                
                return { token, user };
            } catch (error) {
                console.error('Registration error:', error);
                throw new Error(error.message || 'Registration failed');
            }
        },
        
        // Login user
        login: async (_, { input }) => {
            try {
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
            } catch (error) {
                console.error('Login error:', error);
                throw new Error(error.message || 'Login failed');
            }
        },
        
        // Create cafe
        createCafe: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin' && user.role !== 'owner') {
                throw new Error('Not authorized');
            }
            
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
        
        // Create menu item
        createMenuItem: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const { cafe_id, name, description, price, category, preparation_time, image_url } = input;
                
                const result = await pool.query(
                    `INSERT INTO menu_items (cafe_id, name, description, price, category, preparation_time, image_url, status) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'Available') 
                     RETURNING *`,
                    [cafe_id, name, description || null, price, category || null, preparation_time || null, image_url || null]
                );
                
                return result.rows[0];
            } catch (error) {
                console.error('Create menu item error:', error);
                throw new Error('Failed to create menu item');
            }
        },
        
        // Add to cart
        addToCart: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
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
            } catch (error) {
                console.error('Add to cart error:', error);
                throw new Error('Failed to add to cart');
            }
        },
        
        // Create order
        createOrder: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
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
                
                // Create order
                const orderResult = await pool.query(
                    `INSERT INTO orders (student_id, cafe_id, total_amount, item_count, payment_type, special_instructions, order_status) 
                     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') 
                     RETURNING *`,
                    [studentId, input.cafe_id, totalAmount, itemCount, input.payment_type, input.special_instructions || null]
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
                    [order.id, totalAmount, input.payment_type]
                );
                
                // Clear cart
                await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
                
                return order;
            } catch (error) {
                console.error('Create order error:', error);
                throw new Error('Failed to create order');
            }
        }
    }
};

module.exports = { resolvers, getUserFromToken };