const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
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

// Helper function for OCR simulation
const performOCR = async (imageBase64, providedName) => {
    // In production, integrate with actual OCR service like Tesseract
    // For now, simulate OCR processing
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock extraction - in real implementation, extract from image
            const extractedName = providedName;
            const confidence = 95.5;
            resolve({ extractedName, confidence });
        }, 1500);
    });
};

// Helper function to save base64 image
const saveBase64Image = async (base64String, userId, type = 'id') => {
    if (!base64String) return null;
    
    // Remove data:image prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Determine file extension
    let ext = 'jpg';
    if (base64String.includes('data:image/png')) ext = 'png';
    if (base64String.includes('data:image/jpeg')) ext = 'jpg';
    
    const filename = `${type}_${userId}_${Date.now()}.${ext}`;
    const uploadDir = path.join(__dirname, '../../uploads/', type === 'id' ? 'ids' : 'temp');
    const filePath = path.join(uploadDir, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, imageBuffer);
    return `/uploads/${type === 'id' ? 'ids' : 'temp'}/${filename}`;
};

const resolvers = {
    // ============== QUERY RESOLVERS ==============
    
    Query: {
        hello: () => 'Welcome to Campus Crave Digital Ordering System!',
        
        me: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            return user;
        },
        
        user: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            const result = await pool.query(
                'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = $1',
                [id]
            );
            if (result.rows.length === 0) throw new Error('User not found');
            return result.rows[0];
        },
        
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
        
        cafes: async () => {
            try {
                const result = await pool.query('SELECT * FROM cafes WHERE is_active = true ORDER BY name');
                return result.rows;
            } catch (error) {
                console.error('Error fetching cafes:', error);
                throw new Error('Failed to fetch cafes');
            }
        },
        
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
        
        menuItems: async (_, { cafe_id, category }) => {
            try {
                let query = 'SELECT * FROM menu_items WHERE status = $1';
                const values = ['Available'];
                
                if (cafe_id) {
                    query += ' AND cafe_id = $2';
                    values.push(cafe_id);
                }
                
                if (category) {
                    query += ' AND category = $3';
                    values.push(category);
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
                const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
                if (result.rows.length === 0) throw new Error('Menu item not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching menu item:', error);
                throw new Error('Failed to fetch menu item');
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
                
                let query = `SELECT o.*, c.name as cafe_name
                             FROM orders o
                             JOIN cafes c ON o.cafe_id = c.id
                             WHERE o.student_id = $1`;
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
        
        cafeOrders: async (_, { cafe_id, status, limit = 100 }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'staff' && user.role !== 'owner' && user.role !== 'admin') {
                throw new Error('Not authorized');
            }
            
            try {
                let query = 'SELECT * FROM orders WHERE cafe_id = $1';
                const values = [cafe_id];
                
                if (status) {
                    query += ' AND order_status = $2';
                    values.push(status);
                }
                
                query += ' ORDER BY created_at DESC LIMIT $3';
                values.push(limit);
                
                const result = await pool.query(query, values);
                return result.rows;
            } catch (error) {
                console.error('Error fetching cafe orders:', error);
                throw new Error('Failed to fetch orders');
            }
        },
        
        order: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
                if (result.rows.length === 0) throw new Error('Order not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching order:', error);
                throw new Error('Failed to fetch order');
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
                console.error('Error fetching deliveries:', error);
                throw new Error('Failed to fetch deliveries');
            }
        },
        
        deliveries: async (_, { limit = 100 }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    'SELECT * FROM deliveries ORDER BY created_at DESC LIMIT $1',
                    [limit]
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching all deliveries:', error);
                throw new Error('Failed to fetch deliveries');
            }
        }
    },
    
    // ============== MUTATION RESOLVERS ==============
    
    Mutation: {
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
                
                // Save ID image if provided
                let idImagePath = null;
                let extractedName = null;
                let ocrConfidence = 0;
                let verificationStatus = 'Pending';
                let isVerified = false;
                
                if (input.id_image_base64) {
                    // Save image
                    idImagePath = await saveBase64Image(input.id_image_base64, user.id, 'id');
                    
                    // Perform OCR
                    const ocrResult = await performOCR(input.id_image_base64, input.full_name);
                    extractedName = ocrResult.extractedName;
                    ocrConfidence = ocrResult.confidence;
                    
                    // Check if OCR matches provided name
                    if (extractedName && extractedName.toLowerCase() === input.full_name.toLowerCase() && ocrConfidence > 80) {
                        verificationStatus = 'Approved';
                        isVerified = true;
                    }
                }
                
                // Insert student profile
                await pool.query(
                    `INSERT INTO students (user_id, full_name, reg_no, institution, department, phone_number, verification_status, is_verified, id_photo_path, ocr_extracted_name, ocr_confidence) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [user.id, input.full_name, input.reg_no, input.institution, input.department, input.phone, verificationStatus, isVerified, idImagePath, extractedName, ocrConfidence]
                );
                
                // Store OCR validation record
                if (input.id_image_base64) {
                    const studentIdResult = await pool.query(
                        'SELECT id FROM students WHERE user_id = $1',
                        [user.id]
                    );
                    const studentId = studentIdResult.rows[0].id;
                    
                    await pool.query(
                        `INSERT INTO ocr_validations (student_id, image_path, extracted_name, confidence_score, status) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [studentId, idImagePath, extractedName, ocrConfidence, verificationStatus]
                    );
                }
                
                // Generate token
                const token = generateToken(user);
                
                return { 
                    token, 
                    user
                };
            } catch (error) {
                console.error('Registration error:', error);
                throw new Error(error.message || 'Registration failed');
            }
        },
        
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
        
        verifyStudentWithOCR: async (_, { id_image_base64, full_name }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                // Perform OCR
                const { extractedName, confidence } = await performOCR(id_image_base64, full_name);
                
                // Compare extracted name with provided name
                const isMatch = extractedName.toLowerCase() === full_name.toLowerCase();
                
                if (isMatch && confidence > 80) {
                    // Update student verification status
                    await pool.query(
                        `UPDATE students 
                         SET verification_status = 'Approved', 
                             is_verified = true,
                             verified_at = CURRENT_TIMESTAMP
                         WHERE user_id = $1`,
                        [user.id]
                    );
                    
                    // Get student id
                    const studentResult = await pool.query(
                        'SELECT id FROM students WHERE user_id = $1',
                        [user.id]
                    );
                    const studentId = studentResult.rows[0].id;
                    
                    // Save image
                    const imagePath = await saveBase64Image(id_image_base64, studentId, 'id');
                    
                    // Store OCR result
                    await pool.query(
                        `INSERT INTO ocr_validations (student_id, image_path, extracted_name, confidence_score, status) 
                         VALUES ($1, $2, $3, $4, 'Verified')`,
                        [studentId, imagePath, extractedName, confidence]
                    );
                    
                    return {
                        success: true,
                        extracted_name: extractedName,
                        confidence: confidence,
                        message: 'Student ID verified successfully'
                    };
                } else {
                    return {
                        success: false,
                        extracted_name: extractedName,
                        confidence: confidence,
                        message: 'Name mismatch or low confidence. Please try again.'
                    };
                }
            } catch (error) {
                console.error('OCR verification error:', error);
                throw new Error('Failed to verify student ID');
            }
        },
        
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
                
                if (user.role === 'owner') {
                    await pool.query(
                        `INSERT INTO cafe_users (user_id, cafe_id, position) 
                         VALUES ($1, $2, 'Owner')`,
                        [user.id, result.rows[0].id]
                    );
                }
                
                return result.rows[0];
            } catch (error) {
                console.error('Create cafe error:', error);
                throw new Error('Failed to create cafe');
            }
        },
        
        updateCafe: async (_, { id, input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                if (user.role !== 'admin') {
                    const userCafe = await pool.query(
                        'SELECT cafe_id FROM cafe_users WHERE user_id = $1 AND cafe_id = $2',
                        [user.id, id]
                    );
                    if (userCafe.rows.length === 0) {
                        throw new Error('Not authorized to update this cafe');
                    }
                }
                
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
            } catch (error) {
                console.error('Update cafe error:', error);
                throw new Error('Failed to update cafe');
            }
        },
        
        deleteCafe: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Only admins can delete cafes');
            
            try {
                const ordersCheck = await pool.query(
                    'SELECT COUNT(*) FROM orders WHERE cafe_id = $1',
                    [id]
                );
                
                if (parseInt(ordersCheck.rows[0].count) > 0) {
                    throw new Error('Cannot delete cafe with existing orders. Use toggleCafeStatus to deactivate.');
                }
                
                const result = await pool.query('DELETE FROM cafes WHERE id = $1 RETURNING id', [id]);
                return result.rows.length > 0;
            } catch (error) {
                console.error('Delete cafe error:', error);
                throw new Error('Failed to delete cafe');
            }
        },
        
        toggleCafeStatus: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const result = await pool.query(
                    `UPDATE cafes 
                     SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1
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
        
        updateMenuItem: async (_, { id, input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
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
            } catch (error) {
                console.error('Update menu item error:', error);
                throw new Error('Failed to update menu item');
            }
        },
        
        deleteMenuItem: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);
                return result.rows.length > 0;
            } catch (error) {
                console.error('Delete menu item error:', error);
                throw new Error('Failed to delete menu item');
            }
        },
        
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
                    'SELECT price FROM menu_items WHERE id = $1',
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
            } catch (error) {
                console.error('Update cart item error:', error);
                throw new Error('Failed to update cart item');
            }
        },
        
        removeFromCart: async (_, { cart_item_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                await pool.query('DELETE FROM cart_items WHERE id = $1', [cart_item_id]);
                
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
                const studentId = studentResult.rows[0].id;
                
                const cartResult = await pool.query(
                    'SELECT id FROM carts WHERE student_id = $1',
                    [studentId]
                );
                
                if (cartResult.rows.length > 0) {
                    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartResult.rows[0].id]);
                }
                
                return true;
            } catch (error) {
                console.error('Clear cart error:', error);
                throw new Error('Failed to clear cart');
            }
        },
        
        createOrder: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                if (studentResult.rows.length === 0) throw new Error('Student profile not found');
                const studentId = studentResult.rows[0].id;
                
                // Check if student is verified
                const student = await pool.query(
                    'SELECT is_verified FROM students WHERE id = $1',
                    [studentId]
                );
                
                if (!student.rows[0].is_verified) {
                    throw new Error('Please verify your student ID before placing orders');
                }
                
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
                     WHERE ci.cart_id = $1`,
                    [cart.id]
                );
                
                const items = itemsResult.rows;
                if (items.length === 0) throw new Error('Cart is empty');
                
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                if (itemCount > 6) throw new Error('Maximum 6 items per order');
                
                const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                
                // Payment rule: orders over 1500 ETB must pay online
                let paymentType = input.payment_type;
                if (totalAmount > 1500 && paymentType !== 'ONLINE') {
                    throw new Error('Orders over 1500 ETB must pay online');
                }
                
                // Generate order number
                const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                
                const orderResult = await pool.query(
                    `INSERT INTO orders (order_number, student_id, cafe_id, total_amount, item_count, payment_type, special_instructions, order_status) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING') 
                     RETURNING *`,
                    [orderNumber, studentId, input.cafe_id, totalAmount, itemCount, paymentType, input.special_instructions || null]
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
                     WHERE id = $2
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
            } catch (error) {
                console.error('Cancel order error:', error);
                throw new Error('Failed to cancel order');
            }
        },
        
        verifyPayment: async (_, { orderId, paymentPassword }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const orderResult = await pool.query(
                    'SELECT * FROM orders WHERE id = $1 AND student_id = (SELECT id FROM students WHERE user_id = $2)',
                    [orderId, user.id]
                );
                
                if (orderResult.rows.length === 0) throw new Error('Order not found');
                const order = orderResult.rows[0];
                
                const expectedPassword = process.env.PAYMENT_PASSWORD || '123456';
                if (paymentPassword !== expectedPassword) {
                    throw new Error('Invalid payment password');
                }
                
                await pool.query(
                    `UPDATE payments 
                     SET payment_status = 'Paid', 
                         processed_at = CURRENT_TIMESTAMP
                     WHERE order_id = $1`,
                    [orderId]
                );
                
                await pool.query(
                    `UPDATE orders 
                     SET order_status = 'CONFIRMED'
                     WHERE id = $1`,
                    [orderId]
                );
                
                return { success: true, message: 'Payment successful' };
            } catch (error) {
                console.error('Payment verification error:', error);
                throw new Error(error.message || 'Payment failed');
            }
        },
        
        assignDelivery: async (_, { order_id, delivery_person_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin' && user.role !== 'owner') {
                throw new Error('Not authorized');
            }
            
            try {
                const result = await pool.query(
                    `INSERT INTO deliveries (order_id, delivery_person_id, assigned_by, status) 
                     VALUES ($1, $2, $3, 'ASSIGNED') 
                     RETURNING *`,
                    [order_id, delivery_person_id, user.id]
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
                return result.rows[0];
            } catch (error) {
                console.error('Update delivery status error:', error);
                throw new Error('Failed to update delivery status');
            }
        }
    },
    
    // ============== FIELD RESOLVERS ==============
    
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