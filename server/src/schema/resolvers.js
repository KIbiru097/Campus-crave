const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// PubSub for subscriptions (with fallback if module is not installed)
let PubSub;
try {
    PubSub = require('graphql-subscriptions').PubSub;
} catch (e) {
    PubSub = class { publish() {} asyncIterator() {} };
}
const pubsub = new PubSub();

// Subscription event names
const EVENTS = {
    ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
    NEW_ORDER: 'NEW_ORDER',
    NEW_DELIVERY_ASSIGNED: 'NEW_DELIVERY_ASSIGNED',
    DELIVERY_STATUS_CHANGED: 'DELIVERY_STATUS_CHANGED',
};

// Rate limiting store (in-memory)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);
    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
        rateLimitStore.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return false;
    return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) rateLimitStore.delete(ip);
    }
}, 60000).unref();

// Audit logging helper
async function logAudit(userId, action, entityType, entityId, details, ipAddress) {
    try {
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress || null]
        );
    } catch (err) {
        console.error('Audit log error:', err);
    }
}

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'campus_crave_secret_2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Helper function to generate refresh token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, type: 'refresh' },
        process.env.JWT_SECRET || 'campus_crave_secret_2024',
        { expiresIn: '30d' }
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
        
        cafes: async (_, { active_only } = {}) => {
            try {
                let query = 'SELECT * FROM cafes WHERE deleted_at IS NULL';
                const values = [];
                if (active_only) {
                    query += ' AND is_active = true';
                }
                query += ' ORDER BY name';
                const result = await pool.query(query, values);
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
                    `SELECT ci.*, mi.name, mi.price as current_price, mi.category, mi.description, mi.image_url, mi.cafe_id
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

                const order = result.rows[0];
                if (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'owner') {
                    const studentResult = await pool.query(
                        'SELECT id FROM students WHERE user_id = $1',
                        [user.id]
                    );
                    if (studentResult.rows.length === 0 || studentResult.rows[0].id !== order.student_id) {
                        throw new Error('Not authorized to view this order');
                    }
                }

                return order;
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

        cafeOrders: async (_, { cafe_id, status, limit = 50 }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'staff' && user.role !== 'owner' && user.role !== 'admin') {
                throw new Error('Not authorized');
            }
            
            try {
                let query = `
                    SELECT o.*, c.name as cafe_name, c.location as cafe_location
                    FROM orders o
                    JOIN cafes c ON o.cafe_id = c.id
                    WHERE o.deleted_at IS NULL
                `;
                const values = [];
                
                if (cafe_id) {
                    values.push(cafe_id);
                    query += ` AND o.cafe_id = $${values.length}`;
                } else if (user.role !== 'admin') {
                    const cafeUserResult = await pool.query(
                        'SELECT cafe_id FROM cafe_users WHERE user_id = $1',
                        [user.id]
                    );
                    const cafeIds = cafeUserResult.rows.map(r => r.cafe_id);
                    if (cafeIds.length > 0) {
                        values.push(cafeIds);
                        query += ` AND o.cafe_id = ANY($${values.length}::int[])`;
                    } else {
                        return [];
                    }
                }
                
                if (status) {
                    values.push(status);
                    query += ` AND o.order_status = $${values.length}`;
                }
                
                values.push(limit);
                query += ` ORDER BY o.created_at DESC LIMIT $${values.length}`;
                
                const result = await pool.query(query, values);
                return result.rows;
            } catch (error) {
                console.error('Error fetching cafe orders:', error);
                throw new Error('Failed to fetch cafe orders');
            }
        },

        student: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin' && user.role !== 'staff') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    `SELECT s.*, u.username, u.email
                     FROM students s
                     JOIN users u ON s.user_id = u.id
                     WHERE s.id = $1 AND u.deleted_at IS NULL`,
                    [id]
                );
                if (result.rows.length === 0) throw new Error('Student not found');
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching student:', error);
                throw new Error('Failed to fetch student');
            }
        },

        students: async (_, { limit = 100, offset = 0 }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin' && user.role !== 'staff') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    `SELECT s.*, u.username, u.email
                     FROM students s
                     JOIN users u ON s.user_id = u.id
                     WHERE u.deleted_at IS NULL
                     ORDER BY s.created_at DESC
                     LIMIT $1 OFFSET $2`,
                    [limit, offset]
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching students:', error);
                throw new Error('Failed to fetch students');
            }
        },

        // ============== REVIEW QUERIES ==============
        
        cafeReviews: async (_, { cafe_id }) => {
            try {
                const result = await pool.query(
                    `SELECT r.*, s.full_name as student_name
                     FROM reviews r
                     JOIN students s ON r.student_id = s.id
                     WHERE r.cafe_id = $1 AND r.deleted_at IS NULL
                     ORDER BY r.created_at DESC`,
                    [cafe_id]
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching cafe reviews:', error);
                return [];
            }
        },
        
        menuItemReviews: async (_, { menu_item_id }) => {
            try {
                const result = await pool.query(
                    `SELECT r.*, s.full_name as student_name
                     FROM reviews r
                     JOIN students s ON r.student_id = s.id
                     WHERE r.menu_item_id = $1 AND r.deleted_at IS NULL
                     ORDER BY r.created_at DESC`,
                    [menu_item_id]
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching menu item reviews:', error);
                return [];
            }
        },
        
        myReviews: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            try {
                const studentResult = await pool.query('SELECT id FROM students WHERE user_id = $1', [user.id]);
                if (studentResult.rows.length === 0) return [];
                const studentId = studentResult.rows[0].id;
                const result = await pool.query(
                    `SELECT r.* FROM reviews r
                     WHERE r.student_id = $1 AND r.deleted_at IS NULL
                     ORDER BY r.created_at DESC`,
                    [studentId]
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching my reviews:', error);
                return [];
            }
        },
        
        // ============== LOYALTY QUERIES ==============
        
        myLoyaltyPoints: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            try {
                const studentResult = await pool.query('SELECT id FROM students WHERE user_id = $1', [user.id]);
                if (studentResult.rows.length === 0) return null;
                const studentId = studentResult.rows[0].id;
                const result = await pool.query('SELECT * FROM loyalty_points WHERE student_id = $1', [studentId]);
                if (result.rows.length === 0) {
                    const newPoints = await pool.query(
                        'INSERT INTO loyalty_points (student_id) VALUES ($1) RETURNING *',
                        [studentId]
                    );
                    return newPoints.rows[0];
                }
                return result.rows[0];
            } catch (error) {
                console.error('Error fetching loyalty points:', error);
                return null;
            }
        },
        
        myLoyaltyTransactions: async (_, { limit = 20 }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            try {
                const studentResult = await pool.query('SELECT id FROM students WHERE user_id = $1', [user.id]);
                if (studentResult.rows.length === 0) return [];
                const studentId = studentResult.rows[0].id;
                const result = await pool.query(
                    'SELECT * FROM loyalty_transactions WHERE student_id = $1 ORDER BY created_at DESC LIMIT $2',
                    [studentId, limit]
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching loyalty transactions:', error);
                return [];
            }
        },
        
        myRedemptions: async (_, __, { user }) => {
            if (!user) throw new Error('Not authenticated');
            try {
                const studentResult = await pool.query('SELECT id FROM students WHERE user_id = $1', [user.id]);
                if (studentResult.rows.length === 0) return [];
                const studentId = studentResult.rows[0].id;
                const result = await pool.query(
                    'SELECT * FROM reward_redemptions WHERE student_id = $1 ORDER BY created_at DESC',
                    [studentId]
                );
                return result.rows;
            } catch (error) {
                console.error('Error fetching redemptions:', error);
                return [];
            }
        },
        
        // ============== ANALYTICS QUERIES ==============
        
        analytics: async (_, { days = 30 }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const revenueResult = await pool.query(
                    `SELECT COALESCE(SUM(total_amount), 0) as total_revenue,
                            COUNT(*) as total_orders,
                            COALESCE(AVG(total_amount), 0) as avg_order_value
                     FROM orders WHERE deleted_at IS NULL AND created_at > NOW() - INTERVAL '1 day' * $1`,
                    [days]
                );
                
                const dailyRevenue = await pool.query(
                    `SELECT DATE(created_at) as date,
                            SUM(total_amount) as revenue,
                            COUNT(*) as order_count
                     FROM orders WHERE deleted_at IS NULL AND created_at > NOW() - INTERVAL '1 day' * $1
                     GROUP BY DATE(created_at) ORDER BY date DESC`,
                    [days]
                );
                
                const topSelling = await pool.query(
                    `SELECT mi.name, c.name as cafe_name, SUM(oi.quantity) as total_quantity,
                            SUM(oi.subtotal) as total_revenue
                     FROM order_items oi
                     JOIN menu_items mi ON oi.menu_item_id = mi.id
                     JOIN orders o ON oi.order_id = o.id
                     JOIN cafes c ON o.cafe_id = c.id
                     WHERE o.deleted_at IS NULL AND o.created_at > NOW() - INTERVAL '1 day' * $1
                     GROUP BY mi.name, c.name
                     ORDER BY total_quantity DESC LIMIT 10`,
                    [days]
                );
                
                const cafePerf = await pool.query(
                    `SELECT c.name as cafe_name, COUNT(*) as order_count,
                            SUM(o.total_amount) as revenue,
                            AVG(EXTRACT(EPOCH FROM (d.delivered_time - o.created_at))/60) as avg_delivery_time
                     FROM orders o
                     JOIN cafes c ON o.cafe_id = c.id
                     LEFT JOIN deliveries d ON d.order_id = o.id
                     WHERE o.deleted_at IS NULL AND o.created_at > NOW() - INTERVAL '1 day' * $1
                     GROUP BY c.name ORDER BY revenue DESC`,
                    [days]
                );
                
                const orderTrend = await pool.query(
                    `SELECT DATE(created_at) as date, COUNT(*) as count
                     FROM orders WHERE deleted_at IS NULL AND created_at > NOW() - INTERVAL '1 day' * $1
                     GROUP BY DATE(created_at) ORDER BY date DESC`,
                    [days]
                );
                
                const avgDeliveryTime = await pool.query(
                    `SELECT AVG(EXTRACT(EPOCH FROM (delivered_time - o.created_at))/60) as avg_minutes
                     FROM deliveries d
                     JOIN orders o ON d.order_id = o.id
                     WHERE d.delivered_time IS NOT NULL
                     AND d.created_at > NOW() - INTERVAL '1 day' * $1`,
                    [days]
                );
                
                const rv = revenueResult.rows[0];
                return {
                    total_revenue: parseFloat(rv.total_revenue) || 0,
                    total_orders: parseInt(rv.total_orders) || 0,
                    avg_order_value: parseFloat(rv.avg_order_value) || 0,
                    avg_delivery_time: parseFloat(avgDeliveryTime.rows[0]?.avg_minutes) || null,
                    daily_revenue: dailyRevenue.rows.map(r => ({
                        date: r.date,
                        revenue: parseFloat(r.revenue),
                        order_count: parseInt(r.order_count)
                    })),
                    top_selling_items: topSelling.rows.map(r => ({
                        name: r.name,
                        cafe_name: r.cafe_name,
                        total_quantity: parseInt(r.total_quantity),
                        total_revenue: parseFloat(r.total_revenue)
                    })),
                    cafe_performance: cafePerf.rows.map(r => ({
                        cafe_name: r.cafe_name,
                        order_count: parseInt(r.order_count),
                        revenue: parseFloat(r.revenue),
                        avg_delivery_time: r.avg_delivery_time ? parseFloat(r.avg_delivery_time) : null
                    })),
                    order_volume_trend: orderTrend.rows.map(r => ({
                        date: r.date,
                        count: parseInt(r.count)
                    }))
                };
            } catch (error) {
                console.error('Analytics error:', error);
                throw new Error('Failed to fetch analytics');
            }
        },
        
        // ============== RECOMMENDATIONS ==============
        
        recommendations: async (_, { cafe_id, limit = 6 }, { user }) => {
            try {
                let studentId = null;
                if (user) {
                    const studentResult = await pool.query('SELECT id FROM students WHERE user_id = $1', [user.id]);
                    if (studentResult.rows.length > 0) studentId = studentResult.rows[0].id;
                }
                
                let items;
                if (studentId) {
                    items = await pool.query(
                        `SELECT mi.*, c.name as cafe_name,
                                (SELECT COUNT(*) FROM order_items oi2
                                 JOIN orders o2 ON oi2.order_id = o2.id
                                 WHERE o2.student_id = $2 AND oi2.menu_item_id = mi.id) as order_count
                         FROM menu_items mi
                         JOIN cafes c ON mi.cafe_id = c.id
                         WHERE mi.deleted_at IS NULL AND mi.status = 'Available'
                         ${cafe_id ? 'AND mi.cafe_id = $3' : ''}
                         ORDER BY order_count DESC, RANDOM()
                         LIMIT $1`,
                        [limit, studentId, ...(cafe_id ? [cafe_id] : [])]
                    );
                } else {
                    items = await pool.query(
                        `SELECT mi.*, c.name as cafe_name,
                                (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.menu_item_id = mi.id) as order_count
                         FROM menu_items mi
                         JOIN cafes c ON mi.cafe_id = c.id
                         WHERE mi.deleted_at IS NULL AND mi.status = 'Available'
                         ${cafe_id ? 'AND mi.cafe_id = $2' : ''}
                         ORDER BY order_count DESC NULLS LAST, RANDOM()
                         LIMIT $1`,
                        [limit, ...(cafe_id ? [cafe_id] : [])]
                    );
                }
                
                return items.rows.map((item, idx) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    category: item.category,
                    cafe_id: item.cafe_id,
                    cafe_name: item.cafe_name,
                    score: item.order_count > 0 ? 1.0 - (idx * 0.1) : 0.5,
                    reason: item.order_count > 0 ? 'Ordered before' : 'Popular item'
                }));
            } catch (error) {
                console.error('Recommendations error:', error);
                return [];
            }
        },
        
        // ============== DELIVERY ROUTE ==============
        
        optimizedDeliveryRoute: async (_, __, { user }) => {
            if (!user || user.role !== 'delivery') throw new Error('Not authorized');
            
            try {
                const deliveries = await pool.query(
                    `SELECT d.*, o.order_number, o.delivery_address, o.total_amount,
                            c.name as cafe_name, c.location as cafe_location,
                            s.full_name as student_name
                     FROM deliveries d
                     JOIN orders o ON d.order_id = o.id
                     JOIN cafes c ON o.cafe_id = c.id
                     JOIN students s ON o.student_id = s.id
                     WHERE d.delivery_person_id = $1
                     AND d.status IN ('ASSIGNED', 'PICKED_UP')
                     AND d.deleted_at IS NULL
                     ORDER BY d.created_at ASC`,
                    [user.id]
                );
                
                if (deliveries.rows.length === 0) {
                    return { pickup: null, dropoffs: [], optimized_order: [] };
                }
                
                const stops = deliveries.rows.map((d, idx) => ({
                    order_id: d.order_id,
                    order_number: d.order_number,
                    address: d.delivery_address || d.cafe_location,
                    cafe_name: d.cafe_name,
                    student_name: d.student_name,
                    priority: d.status === 'PICKED_UP' ? 0 : 1
                }));
                
                stops.sort((a, b) => a.priority - b.priority || a.order_id - b.order_id);
                
                const pickup = stops.find(s => s.priority === 1) || stops[0];
                const dropoffs = stops.filter(s => s.order_id !== pickup?.order_id);
                
                return {
                    pickup,
                    dropoffs,
                    optimized_order: stops
                };
            } catch (error) {
                console.error('Delivery route error:', error);
                return { pickup: null, dropoffs: [], optimized_order: [] };
            }
        },
        
        // ============== AUDIT LOGS ==============
        
        auditLogs: async (_, { limit = 50, offset = 0, action }, { user }) => {
            if (!user || user.role !== 'admin') throw new Error('Not authorized');
            try {
                let query = 'SELECT * FROM audit_logs';
                const values = [];
                if (action) {
                    values.push(action);
                    query += ` WHERE action = $${values.length}`;
                }
                values.push(limit, offset);
                query += ` ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;
                const result = await pool.query(query, values);
                return result.rows;
            } catch (error) {
                console.error('Error fetching audit logs:', error);
                return [];
            }
        },
    },
    
    // ============== BATCH LOADER / REQUEST-SCOPED CACHE HELPERS ==============
    // ⚡ PERF OPTIMIZATION: Request-scoped batching utility to eliminate N+1 queries in GraphQL field resolvers.
    // Batches multiple lookups in the same execution tick into a single SQL query using `WHERE id = ANY(...)`.

    // Creates a lightweight batch loader function with request-scoped promise caching
    // batchFn receives unique keys and returns a Promise<Map<key, result>>
    createBatchLoader: (batchFn) => {
        const cache = new Map();
        let queue = [];
        let scheduled = false;

        return (key) => {
            if (cache.has(key)) {
                return cache.get(key);
            }

            const promise = new Promise((resolve, reject) => {
                queue.push({ key, resolve, reject });
                if (!scheduled) {
                    scheduled = true;
                    process.nextTick(async () => {
                        const currentQueue = queue;
                        queue = [];
                        scheduled = false;

                        // Deduplicate keys for the single batched SQL query
                        const uniqueKeys = [...new Set(currentQueue.map(q => q.key))];
                        try {
                            const resultMap = await batchFn(uniqueKeys);
                            currentQueue.forEach(item => {
                                item.resolve(resultMap.get(item.key));
                            });
                        } catch (err) {
                            currentQueue.forEach(item => item.reject(err));
                        }
                    });
                }
            });

            cache.set(key, promise);
            return promise;
        };
    },

    // Gets or initializes request-scoped loaders attached to GraphQL context
    getLoaders: function(context) {
        if (!context) context = {};
        if (!context._loaders) {
            context._loaders = {
                // Batch fetch menu items for multiple cafes in 1 query instead of N queries
                cafeMenuItems: resolvers.createBatchLoader(async (cafeIds) => {
                    const result = await pool.query(
                        'SELECT * FROM menu_items WHERE cafe_id = ANY($1) AND deleted_at IS NULL AND status = $2 ORDER BY category, name',
                        [cafeIds, 'Available']
                    );
                    const map = new Map();
                    cafeIds.forEach(id => map.set(id, []));
                    result.rows.forEach(row => {
                        if (map.has(row.cafe_id)) {
                            map.get(row.cafe_id).push(row);
                        }
                    });
                    return map;
                }),

                // Batch fetch average ratings and review counts for multiple cafes in 1 query
                cafeReviewsStats: resolvers.createBatchLoader(async (cafeIds) => {
                    const result = await pool.query(
                        'SELECT cafe_id, AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE cafe_id = ANY($1) AND deleted_at IS NULL GROUP BY cafe_id',
                        [cafeIds]
                    );
                    const map = new Map();
                    cafeIds.forEach(id => map.set(id, { avg_rating: null, count: 0 }));
                    result.rows.forEach(row => {
                        map.set(row.cafe_id, {
                            avg_rating: row.avg_rating ? parseFloat(parseFloat(row.avg_rating).toFixed(1)) : null,
                            count: parseInt(row.count) || 0
                        });
                    });
                    return map;
                }),

                // Batch fetch average ratings and review counts for multiple menu items in 1 query
                menuItemReviewsStats: resolvers.createBatchLoader(async (menuItemIds) => {
                    const result = await pool.query(
                        'SELECT menu_item_id, AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE menu_item_id = ANY($1) AND deleted_at IS NULL GROUP BY menu_item_id',
                        [menuItemIds]
                    );
                    const map = new Map();
                    menuItemIds.forEach(id => map.set(id, { avg_rating: null, count: 0 }));
                    result.rows.forEach(row => {
                        map.set(row.menu_item_id, {
                            avg_rating: row.avg_rating ? parseFloat(parseFloat(row.avg_rating).toFixed(1)) : null,
                            count: parseInt(row.count) || 0
                        });
                    });
                    return map;
                })
            };
        }
        return context._loaders;
    },

    // ============== FIELD RESOLVERS ==============
    
    Cafe: {
        menu_items: async (cafe, _, context) => {
            try {
                const loaders = resolvers.getLoaders(context);
                return await loaders.cafeMenuItems(cafe.id);
            } catch (error) {
                return [];
            }
        },
        average_rating: async (cafe, _, context) => {
            try {
                const loaders = resolvers.getLoaders(context);
                const stats = await loaders.cafeReviewsStats(cafe.id);
                return stats?.avg_rating ?? null;
            } catch (error) {
                return null;
            }
        },
        review_count: async (cafe, _, context) => {
            try {
                const loaders = resolvers.getLoaders(context);
                const stats = await loaders.cafeReviewsStats(cafe.id);
                return stats?.count ?? 0;
            } catch (error) {
                return 0;
            }
        },
    },
    
    MenuItem: {
        average_rating: async (menuItem, _, context) => {
            try {
                const loaders = resolvers.getLoaders(context);
                const stats = await loaders.menuItemReviewsStats(menuItem.id);
                return stats?.avg_rating ?? null;
            } catch (error) {
                return null;
            }
        },
        review_count: async (menuItem, _, context) => {
            try {
                const loaders = resolvers.getLoaders(context);
                const stats = await loaders.menuItemReviewsStats(menuItem.id);
                return stats?.count ?? 0;
            } catch (error) {
                return 0;
            }
        },
    },
    
    CartItem: {
        menu_item: (cartItem) => ({
            id: cartItem.menu_item_id,
            name: cartItem.name,
            price: cartItem.current_price,
            category: cartItem.category,
            description: cartItem.description,
            image_url: cartItem.image_url,
            cafe_id: cartItem.cafe_id,
        }),
    },
    
    OrderItem: {
        menu_item: (orderItem) => ({
            id: orderItem.menu_item_id,
            name: orderItem.name,
            price: orderItem.current_price,
            category: orderItem.category,
        }),
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
        student: async (order) => {
            try {
                const result = await pool.query(
                    `SELECT s.*, u.username, u.email
                     FROM students s
                     JOIN users u ON s.user_id = u.id
                     WHERE s.id = $1 AND u.deleted_at IS NULL`,
                    [order.student_id]
                );
                return result.rows[0] || null;
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

    Delivery: {
        order: async (delivery) => {
            try {
                const result = await pool.query(
                    `SELECT o.*, c.name as cafe_name, c.location as cafe_location
                     FROM orders o
                     JOIN cafes c ON o.cafe_id = c.id
                     WHERE o.id = $1 AND o.deleted_at IS NULL`,
                    [delivery.order_id]
                );
                return result.rows[0] || null;
            } catch (error) {
                return null;
            }
        },
        delivery_person: async (delivery) => {
            try {
                const result = await pool.query(
                    'SELECT id, username, email, phone, role FROM users WHERE id = $1',
                    [delivery.delivery_person_id]
                );
                return result.rows[0] || null;
            } catch (error) {
                return null;
            }
        },
        assigner: async (delivery) => {
            try {
                const result = await pool.query(
                    'SELECT id, username, email, phone, role FROM users WHERE id = $1',
                    [delivery.assigned_by]
                );
                return result.rows[0] || null;
            } catch (error) {
                return null;
            }
        },
    },

    AuditLog: {
        user: async (log) => {
            try {
                if (!log.user_id) return null;
                const result = await pool.query(
                    'SELECT id, username, email, role FROM users WHERE id = $1',
                    [log.user_id]
                );
                return result.rows[0] || null;
            } catch (error) {
                return null;
            }
        },
    },

    Review: {
        student: async (review) => {
            try {
                const result = await pool.query(
                    `SELECT s.*, u.username, u.email FROM students s
                     JOIN users u ON s.user_id = u.id WHERE s.id = $1`,
                    [review.student_id]
                );
                return result.rows[0] || null;
            } catch (error) {
                return null;
            }
        },
        cafe: async (review) => {
            if (!review.cafe_id) return null;
            try {
                const result = await pool.query('SELECT * FROM cafes WHERE id = $1', [review.cafe_id]);
                return result.rows[0] || null;
            } catch (error) {
                return null;
            }
        },
        menu_item: async (review) => {
            if (!review.menu_item_id) return null;
            try {
                const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [review.menu_item_id]);
                return result.rows[0] || null;
            } catch (error) {
                return null;
            }
        },
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
                    `INSERT INTO students (user_id, full_name, reg_no, institution, department, year_of_study, phone_number, verification_status) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')`,
                    [user.id, input.full_name, input.reg_no, input.institution, input.department, input.year_of_study || null, input.phone]
                );
                
                const token = generateToken(user);
                const refreshToken = generateRefreshToken(user);
                
                await pool.query(
                    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
                    [user.id, refreshToken]
                );
                
                return { token, refreshToken, user };
            } catch (error) {
                console.error('Registration error:', error);
                throw new Error(error.message || 'Registration failed');
            }
        },
        
        login: async (_, { input }, { req }) => {
            try {
                const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';
                if (!checkRateLimit(ip)) {
                    throw new Error('Too many login attempts. Please try again later.');
                }
                
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
                const refreshToken = generateRefreshToken(user);
                
                // Store refresh token
                await pool.query(
                    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
                    [user.id, refreshToken]
                );
                
                delete user.password_hash;
                
                return { token, refreshToken, user };
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
                    `SELECT ci.*, mi.name, mi.price as current_price, mi.category, mi.cafe_id
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
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                if (studentResult.rows.length === 0) throw new Error('Student profile not found');
                const studentId = studentResult.rows[0].id;

                const cartItemCheck = await pool.query(
                    `SELECT ci.cart_id FROM cart_items ci
                     JOIN carts c ON ci.cart_id = c.id
                     WHERE ci.id = $1 AND c.student_id = $2`,
                    [cart_item_id, studentId]
                );
                if (cartItemCheck.rows.length === 0) throw new Error('Cart item not found or unauthorized');

                const cartId = cartItemCheck.rows[0].cart_id;

                if (quantity <= 0) {
                    await pool.query('DELETE FROM cart_items WHERE id = $1', [cart_item_id]);
                } else {
                    await pool.query(
                        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
                        [quantity, cart_item_id]
                    );
                }

                const cartResult = await pool.query('SELECT * FROM carts WHERE id = $1', [cartId]);
                const cart = cartResult.rows[0];

                const itemsResult = await pool.query(
                    `SELECT ci.*, mi.name, mi.price as current_price, mi.category, mi.cafe_id
                     FROM cart_items ci
                     JOIN menu_items mi ON ci.menu_item_id = mi.id
                     WHERE ci.cart_id = $1 AND mi.deleted_at IS NULL`,
                    [cartId]
                );
                const items = itemsResult.rows;
                const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

                return { ...cart, items, total, item_count: itemCount };
            } catch (error) {
                console.error('Update cart item error:', error);
                throw new Error('Failed to update cart');
            }
        },
        
        removeFromCart: async (_, { cart_item_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const studentResult = await pool.query(
                    'SELECT id FROM students WHERE user_id = $1',
                    [user.id]
                );
                if (studentResult.rows.length === 0) throw new Error('Student profile not found');
                const studentId = studentResult.rows[0].id;

                const cartItemCheck = await pool.query(
                    `SELECT ci.cart_id FROM cart_items ci
                     JOIN carts c ON ci.cart_id = c.id
                     WHERE ci.id = $1 AND c.student_id = $2`,
                    [cart_item_id, studentId]
                );
                if (cartItemCheck.rows.length === 0) throw new Error('Cart item not found or unauthorized');

                const cartId = cartItemCheck.rows[0].cart_id;
                await pool.query('DELETE FROM cart_items WHERE id = $1', [cart_item_id]);

                const cartResult = await pool.query('SELECT * FROM carts WHERE id = $1', [cartId]);
                const cart = cartResult.rows[0];

                const itemsResult = await pool.query(
                    `SELECT ci.*, mi.name, mi.price as current_price, mi.category, mi.cafe_id
                     FROM cart_items ci
                     JOIN menu_items mi ON ci.menu_item_id = mi.id
                     WHERE ci.cart_id = $1 AND mi.deleted_at IS NULL`,
                    [cartId]
                );
                const items = itemsResult.rows;
                const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

                return { ...cart, items, total, item_count: itemCount };
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
        
        // ============== ORDER MUTATIONS ==============
        
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
                
                // 🔧 FIXED: Generate shorter order number
                // Get today's order count
                const countResult = await pool.query(
                    "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE"
                );
                const todayCount = parseInt(countResult.rows[0].count) + 1;
                const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
                const orderNumber = `ORD-${dateStr}-${String(todayCount).padStart(3, '0')}`;
                // Example: ORD-20260721-001 (17 characters - well under 20!)
                
                const orderResult = await pool.query(
                    `INSERT INTO orders (student_id, cafe_id, total_amount, item_count, payment_type, special_instructions, order_status, order_number) 
                     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7) 
                     RETURNING *`,
                    [studentId, input.cafe_id, totalAmount, itemCount, paymentType, input.special_instructions || null, orderNumber]
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
                
                // Publish new order event
                pubsub.publish(EVENTS.NEW_ORDER, { newOrder: order });
                
                // Award loyalty points (1 point per ETB 10 spent)
                const pointsEarned = Math.floor(totalAmount / 10);
                if (pointsEarned > 0) {
                    try {
                        await pool.query(
                            `INSERT INTO loyalty_points (student_id, points, total_earned)
                             VALUES ($1, $2, $2)
                             ON CONFLICT (student_id) DO UPDATE SET
                             points = loyalty_points.points + $2,
                             total_earned = loyalty_points.total_earned + $2`,
                            [studentId, pointsEarned]
                        );
                        await pool.query(
                            `INSERT INTO loyalty_transactions (student_id, points, type, description, order_id)
                             VALUES ($1, $2, 'EARNED', $3, $4)`,
                            [studentId, pointsEarned, `Earned ${pointsEarned} points for order #${orderNumber}`, order.id]
                        );
                    } catch (e) {
                        console.error('Loyalty points error:', e);
                    }
                }
                
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
                
                const order = result.rows[0];
                pubsub.publish(EVENTS.ORDER_STATUS_CHANGED, { orderStatusChanged: order });
                
                return order;
            } catch (error) {
                console.error('Update order status error:', error);
                throw new Error('Failed to update order status');
            }
        },
        
        cancelOrder: async (_, { order_id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const orderResult = await pool.query(
                    'SELECT order_status, student_id FROM orders WHERE id = $1 AND deleted_at IS NULL',
                    [order_id]
                );
                
                if (orderResult.rows.length === 0) throw new Error('Order not found');
                const orderData = orderResult.rows[0];

                if (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'owner') {
                    const studentResult = await pool.query(
                        'SELECT id FROM students WHERE user_id = $1',
                        [user.id]
                    );
                    if (studentResult.rows.length === 0 || studentResult.rows[0].id !== orderData.student_id) {
                        throw new Error('Not authorized to cancel this order');
                    }
                }

                const status = orderData.order_status;
                
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
        
        registerCafe: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Only admin can register cafes');
            
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
                console.error('Register cafe error:', error);
                throw new Error('Failed to register cafe');
            }
        },
        
        softDeleteCafe: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    `UPDATE cafes SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
                    [id]
                );
                if (result.rows.length === 0) throw new Error('Cafe not found');
                return result.rows[0];
            } catch (error) {
                console.error('Soft delete cafe error:', error);
                throw new Error('Failed to soft delete cafe');
            }
        },
        
        restoreCafe: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                const result = await pool.query(
                    `UPDATE cafes SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
                    [id]
                );
                if (result.rows.length === 0) throw new Error('Cafe not found or not deleted');
                return result.rows[0];
            } catch (error) {
                console.error('Restore cafe error:', error);
                throw new Error('Failed to restore cafe');
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
        
        // ============== MENU ITEM MUTATIONS ==============
        
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
        
        softDeleteMenuItem: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const menuResult = await pool.query(
                    'SELECT cafe_id FROM menu_items WHERE id = $1 AND deleted_at IS NULL',
                    [id]
                );
                if (menuResult.rows.length === 0) throw new Error('Menu item not found');
                const cafeId = menuResult.rows[0].cafe_id;
                
                const ownsCafe = await checkUserOwnsCafe(user.id, cafeId);
                if (user.role !== 'admin' && !ownsCafe) {
                    throw new Error('Not authorized');
                }
                
                const result = await pool.query(
                    `UPDATE menu_items SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
                    [id]
                );
                if (result.rows.length === 0) throw new Error('Menu item not found');
                return result.rows[0];
            } catch (error) {
                console.error('Soft delete menu item error:', error);
                throw new Error('Failed to soft delete menu item');
            }
        },
        
        restoreMenuItem: async (_, { id }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            try {
                const menuResult = await pool.query(
                    'SELECT cafe_id FROM menu_items WHERE id = $1 AND deleted_at IS NOT NULL',
                    [id]
                );
                if (menuResult.rows.length === 0) throw new Error('Menu item not found or not deleted');
                const cafeId = menuResult.rows[0].cafe_id;
                
                const ownsCafe = await checkUserOwnsCafe(user.id, cafeId);
                if (user.role !== 'admin' && !ownsCafe) {
                    throw new Error('Not authorized');
                }
                
                const result = await pool.query(
                    `UPDATE menu_items SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
                    [id]
                );
                if (result.rows.length === 0) throw new Error('Menu item not found');
                return result.rows[0];
            } catch (error) {
                console.error('Restore menu item error:', error);
                throw new Error('Failed to restore menu item');
            }
        },
        
        createStaff: async (_, { input }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'admin') throw new Error('Only admin can create staff');
            
            try {
                const existingEmail = await pool.query(
                    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
                    [input.email]
                );
                if (existingEmail.rows.length > 0) {
                    throw new Error('Email already registered');
                }
                
                const hashedPassword = await bcrypt.hash(input.password, 10);
                
                const userResult = await pool.query(
                    `INSERT INTO users (username, email, password_hash, phone, role) 
                     VALUES ($1, $2, $3, $4, $5) 
                     RETURNING id, username, email, phone, role, created_at`,
                    [input.username, input.email, hashedPassword, input.phone || null, input.role || 'staff']
                );
                
                const newUser = userResult.rows[0];
                
                if (input.cafe_id) {
                    await pool.query(
                        `INSERT INTO cafe_users (user_id, cafe_id, position, hired_date) 
                         VALUES ($1, $2, $3, CURRENT_DATE)`,
                        [newUser.id, input.cafe_id, input.role || 'Staff']
                    );
                }
                
                return newUser;
            } catch (error) {
                console.error('Create staff error:', error);
                throw new Error(error.message || 'Failed to create staff');
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
                
                const delivery = result.rows[0];
                pubsub.publish(EVENTS.NEW_DELIVERY_ASSIGNED, { newDeliveryAssigned: delivery });
                
                return delivery;
            } catch (error) {
                console.error('Assign delivery error:', error);
                throw new Error('Failed to assign delivery');
            }
        },
        
        updateDeliveryStatus: async (_, { delivery_id, status }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            if (user.role !== 'delivery' && user.role !== 'admin') throw new Error('Not authorized');
            
            try {
                if (user.role === 'delivery') {
                    const ownershipCheck = await pool.query(
                        'SELECT id FROM deliveries WHERE id = $1 AND delivery_person_id = $2',
                        [delivery_id, user.id]
                    );
                    if (ownershipCheck.rows.length === 0) throw new Error('Not authorized to update this delivery');
                }
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
                
                const updatedDelivery = result.rows[0];
                pubsub.publish(EVENTS.DELIVERY_STATUS_CHANGED, { deliveryStatusChanged: updatedDelivery });
                
                return updatedDelivery;
            } catch (error) {
                console.error('Update delivery status error:', error);
                throw new Error('Failed to update delivery status');
            }
        },
    }
};

module.exports = { resolvers, getUserFromToken };