const pool = require('../config/database');

/**
 * Creates a lightweight batch loader to batch and cache requests within a single tick.
 * Eliminates N+1 database queries in GraphQL field resolvers without external dependencies.
 *
 * @param {Function} batchFn - Function accepting an array of keys and returning a Map of key -> value.
 * @returns {Object} Loader instance with a `.load(key)` method.
 */
function createBatchLoader(batchFn) {
    let pendingKeys = [];
    let pendingPromises = [];
    let scheduled = false;

    return {
        load: (key) => {
            if (key === null || key === undefined) return Promise.resolve(null);

            return new Promise((resolve, reject) => {
                pendingKeys.push(key);
                pendingPromises.push({ resolve, reject });

                if (!scheduled) {
                    scheduled = true;
                    process.nextTick(async () => {
                        const keys = pendingKeys;
                        const promises = pendingPromises;
                        pendingKeys = [];
                        pendingPromises = [];
                        scheduled = false;

                        try {
                            const resultMap = await batchFn(keys);
                            promises.forEach(({ resolve }, idx) => {
                                const k = keys[idx];
                                resolve(resultMap.get(k) ?? null);
                            });
                        } catch (err) {
                            promises.forEach(({ reject }) => reject(err));
                        }
                    });
                }
            });
        }
    };
}

/**
 * Creates fresh, request-scoped batch loaders.
 * Must be instantiated per GraphQL request to avoid cross-request data leaks.
 */
function createLoaders() {
    return {
        // Cafe Loader: batches SELECT * FROM cafes WHERE id = ANY($1)
        cafeLoader: createBatchLoader(async (ids) => {
            const uniqueIds = Array.from(new Set(ids));
            const result = await pool.query(
                'SELECT * FROM cafes WHERE id = ANY($1) AND deleted_at IS NULL',
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => map.set(row.id, row));
            return map;
        }),

        // User Loader: batches SELECT FROM users WHERE id = ANY($1)
        userLoader: createBatchLoader(async (ids) => {
            const uniqueIds = Array.from(new Set(ids));
            const result = await pool.query(
                'SELECT id, username, email, phone, role, created_at, last_login FROM users WHERE id = ANY($1) AND deleted_at IS NULL',
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => map.set(row.id, row));
            return map;
        }),

        // Student by Student ID Loader
        studentByIdLoader: createBatchLoader(async (ids) => {
            const uniqueIds = Array.from(new Set(ids));
            const result = await pool.query(
                `SELECT s.*, u.username, u.email
                 FROM students s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.id = ANY($1) AND u.deleted_at IS NULL`,
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => map.set(row.id, row));
            return map;
        }),

        // Order Items by Order ID Loader: batches SELECT FROM order_items WHERE order_id = ANY($1)
        orderItemsByOrderIdLoader: createBatchLoader(async (orderIds) => {
            const uniqueIds = Array.from(new Set(orderIds));
            const result = await pool.query(
                `SELECT oi.*, mi.name, mi.price as current_price, mi.category
                 FROM order_items oi
                 JOIN menu_items mi ON oi.menu_item_id = mi.id
                 WHERE oi.order_id = ANY($1) AND mi.deleted_at IS NULL`,
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => {
                if (!map.has(row.order_id)) map.set(row.order_id, []);
                map.get(row.order_id).push(row);
            });
            return map;
        }),

        // Payment by Order ID Loader
        paymentByOrderIdLoader: createBatchLoader(async (orderIds) => {
            const uniqueIds = Array.from(new Set(orderIds));
            const result = await pool.query(
                'SELECT * FROM payments WHERE order_id = ANY($1)',
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => map.set(row.order_id, row));
            return map;
        }),

        // Delivery by Order ID Loader
        deliveryByOrderIdLoader: createBatchLoader(async (orderIds) => {
            const uniqueIds = Array.from(new Set(orderIds));
            const result = await pool.query(
                'SELECT * FROM deliveries WHERE order_id = ANY($1)',
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => map.set(row.order_id, row));
            return map;
        }),

        // Order by ID Loader
        orderByIdLoader: createBatchLoader(async (ids) => {
            const uniqueIds = Array.from(new Set(ids));
            const result = await pool.query(
                `SELECT o.*, c.name as cafe_name, c.location as cafe_location
                 FROM orders o
                 JOIN cafes c ON o.cafe_id = c.id
                 WHERE o.id = ANY($1) AND o.deleted_at IS NULL`,
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => map.set(row.id, row));
            return map;
        }),

        // Cafe Stats Loader (AVG rating & review count grouped by cafe_id)
        cafeStatsLoader: createBatchLoader(async (cafeIds) => {
            const uniqueIds = Array.from(new Set(cafeIds));
            const result = await pool.query(
                `SELECT cafe_id, AVG(rating) as avg_rating, COUNT(*) as count
                 FROM reviews
                 WHERE cafe_id = ANY($1) AND deleted_at IS NULL
                 GROUP BY cafe_id`,
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => {
                map.set(row.cafe_id, {
                    avg_rating: row.avg_rating ? parseFloat(parseFloat(row.avg_rating).toFixed(1)) : null,
                    count: parseInt(row.count) || 0
                });
            });
            return map;
        }),

        // MenuItem Stats Loader (AVG rating & review count grouped by menu_item_id)
        menuItemStatsLoader: createBatchLoader(async (itemIds) => {
            const uniqueIds = Array.from(new Set(itemIds));
            const result = await pool.query(
                `SELECT menu_item_id, AVG(rating) as avg_rating, COUNT(*) as count
                 FROM reviews
                 WHERE menu_item_id = ANY($1) AND deleted_at IS NULL
                 GROUP BY menu_item_id`,
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => {
                map.set(row.menu_item_id, {
                    avg_rating: row.avg_rating ? parseFloat(parseFloat(row.avg_rating).toFixed(1)) : null,
                    count: parseInt(row.count) || 0
                });
            });
            return map;
        }),

        // Menu Items by Cafe ID Loader
        menuItemsByCafeIdLoader: createBatchLoader(async (cafeIds) => {
            const uniqueIds = Array.from(new Set(cafeIds));
            const result = await pool.query(
                `SELECT * FROM menu_items
                 WHERE cafe_id = ANY($1) AND deleted_at IS NULL AND status = 'Available'
                 ORDER BY category, name`,
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => {
                if (!map.has(row.cafe_id)) map.set(row.cafe_id, []);
                map.get(row.cafe_id).push(row);
            });
            return map;
        }),

        // Menu Item by ID Loader
        menuItemByIdLoader: createBatchLoader(async (ids) => {
            const uniqueIds = Array.from(new Set(ids));
            const result = await pool.query(
                'SELECT * FROM menu_items WHERE id = ANY($1) AND deleted_at IS NULL',
                [uniqueIds]
            );
            const map = new Map();
            result.rows.forEach(row => map.set(row.id, row));
            return map;
        })
    };
}

module.exports = { createBatchLoader, createLoaders };
