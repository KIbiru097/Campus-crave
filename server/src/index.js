require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const typeDefs = require('./schema/typeDefs');
const { resolvers, getUserFromToken } = require('./schema/resolvers');
const MockPaymentService = require('./services/mockPaymentService');

const app = express();
const PORT = process.env.PORT || 4000;

// ==================== CORS CONFIGURATION ====================

// Manual CORS headers - This WORKS for Vercel frontend
app.use((req, res, next) => {
    // Allow your Vercel frontend
    const allowedOrigin = 'https://kb-campus-web.vercel.app';
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    next();
});

// Additional cors middleware as backup
app.use(cors({
    origin: 'https://kb-campus-web.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.post('/api/payment/initiate', async (req, res) => {
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
        res.json(result);
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Process refund
app.post('/api/payment/refund', async (req, res) => {
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
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://kb-campus-web.vercel.app';
    res.redirect(`${frontendUrl}/payment/success?tx_ref=${tx_ref}&status=${status}&order_id=${order_id}`);
});

// ==================== GRAPHQL SETUP ====================

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
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
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => {
                const token = req.headers.authorization || '';
                const user = await getUserFromToken(token);
                return { user };
            },
        })
    );

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
${'='.repeat(50)}
🍕 Campus Crave GraphQL API
${'='.repeat(50)}
📍 GraphQL:      http://localhost:${PORT}/graphql
💚 Health:       http://localhost:${PORT}/health
🔧 Mock Payment: http://localhost:${PORT}/api/payment/initiate
🌐 Environment:  ${process.env.NODE_ENV || 'development'}
🔗 CORS Origin:  https://kb-campus-web.vercel.app
${'='.repeat(50)}
        `);
    });
}

startServer().catch(console.error);