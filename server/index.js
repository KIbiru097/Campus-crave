// Hola Nebyu Updated this file haha
require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const typeDefs = require('./src/schema/typeDefs');
const { resolvers, getUserFromToken } = require('./src/schema/resolvers');
const MockPaymentService = require('./src/services/mockPaymentService');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

// ==================== CORS CONFIGURATION ====================

const allowedOrigins = [
    'https://cumcravestuorder.vercel.app',
    'https://kb-campus-web.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
];

// Strictly allow only this project's Vercel preview/branch deployments (preventing foreign .vercel.app origins)
const vercelPreviewRegex = /^https:\/\/(cumcravestuorder|kb-campus-web)(-[a-z0-9-]+)?\.vercel\.app$/;

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        
        // Allow defined origins and project-specific Vercel branch/preview domains
        const isAllowed = allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin);
        if (isAllowed) {
            return callback(null, origin);
        }
        
        // In local development, permit any origin
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, origin);
        }
        
        // For unlisted origins in production:
        // Gracefully disallow by passing (null, false).
        // The cors package omits Access-Control-Allow-Origin without throwing an unhandled exception or 500 error.
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length'],
    maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health and CORS preflight handled by middleware above

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        app: 'Campus Crave API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Campus Crave API is running',
        graphql: '/graphql',
        health: '/health',
        version: '1.0.0'
    });
});

// ==================== MOCK PAYMENT ENDPOINTS ====================

// Initialize payment
app.post('/api/payment/initiate', express.json(), async (req, res) => {
    try {
        const { orderId, amount, email, firstName, lastName } = req.body;
        
        if (!orderId || !amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: orderId and amount' 
            });
        }
        
        const txRef = MockPaymentService.generateTxRef(orderId);
        
        const result = await MockPaymentService.initializePayment({
            amount, 
            email, 
            firstName, 
            lastName, 
            txRef, 
            orderId
        });
        
        res.json(result);
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify payment
app.get('/api/payment/verify/:txRef', async (req, res) => {
    try {
        const { txRef } = req.params;
        const result = await MockPaymentService.verifyPayment(txRef);
        
        if (result && result.success) {
            const match = txRef.match(/^MOCK-(\d+)-/);
            if (match && match[1]) {
                const orderId = parseInt(match[1], 10);
                try {
                    const pool = require('./src/config/database');
                    await pool.query(
                        "UPDATE orders SET order_status = 'CONFIRMED', updated_at = NOW() WHERE id = $1 AND order_status = 'PENDING'",
                        [orderId]
                    );
                    await pool.query(
                        "UPDATE payments SET payment_status = 'Completed', transaction_id = $1, processed_at = NOW() WHERE order_id = $2",
                        [txRef, orderId]
                    );
                    console.log(`✅ Order #${orderId} confirmed and payment marked Completed for tx ${txRef}`);
                } catch (dbErr) {
                    console.error('Error updating order/payment state on verify:', dbErr);
                }
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Process refund
app.post('/api/payment/refund', express.json(), async (req, res) => {
    try {
        const { txRef, amount, reason } = req.body;
        
        if (!txRef || !amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: txRef and amount' 
            });
        }
        
        const result = await MockPaymentService.refundPayment(txRef, amount, reason);
        res.json(result);
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Payment callback (redirects to frontend)
app.get('/api/payment/callback', (req, res) => {
    const { tx_ref, status, order_id } = req.query;
    console.log(`📞 Payment Callback: ${tx_ref} - ${status}`);
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://cumcravestuorder.vercel.app';
    res.redirect(`${frontendUrl}/payment/success?tx_ref=${tx_ref}&status=${status}&order_id=${order_id}`);
});

// ==================== GRAPHQL SETUP ====================

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production' || process.env.GRAPHQL_INTROSPECTION === 'true',
    formatError: (err) => {
        console.error('GraphQL Error:', err.message);
        return {
            message: err.message,
            code: err.extensions?.code || 'INTERNAL_SERVER_ERROR'
        };
    },
});

// ==================== START SERVER ====================

async function startServer() {
    await server.start();

    app.use(
        '/graphql',
        cors(corsOptions),
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => {
                const token = req.headers.authorization || '';
                const user = await getUserFromToken(token);
                return { user, req };
            },
        })
    );

    // Fallback JSON error handler to prevent raw HTML stack traces
    app.use((err, req, res, next) => {
        console.error('Unhandled server error:', err.message);
        res.status(err.status || 500).json({
            success: false,
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
        });
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
${'='.repeat(50)}
🍕 Campus Crave GraphQL API
${'='.repeat(50)}
📍 GraphQL:      http://localhost:${PORT}/graphql
💚 Health:       http://localhost:${PORT}/health
🔧 Mock Payment: http://localhost:${PORT}/api/payment/initiate
🌐 Environment:  ${process.env.NODE_ENV || 'development'}
🔗 CORS:  ${allowedOrigins.join(', ')} + preview branches
${'='.repeat(50)}
        `);
    });
}

startServer().catch(console.error);