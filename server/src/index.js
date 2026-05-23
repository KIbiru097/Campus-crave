const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const typeDefs = require('./schema/typeDefs');
const { resolvers, getUserFromToken } = require('./schema/resolvers');
require('dotenv').config();

// Import mock payment service
const MockPaymentService = require('./services/mockPaymentService');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'https://ver-camp.vercel.app', 'https://*.vercel.app', 'https://*.onrender.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        app: process.env.APP_NAME || 'Campus Crave API',
        timestamp: new Date().toISOString()
    });
});

// ==================== MOCK PAYMENT ENDPOINTS ====================

// Mock Payment Endpoints
app.post('/api/payment/initiate', express.json(), async (req, res) => {
    const { orderId, amount, email, firstName, lastName } = req.body;
    
    const txRef = MockPaymentService.generateTxRef(orderId);
    
    const result = await MockPaymentService.initializePayment({
        amount, email, firstName, lastName, txRef, orderId
    });
    
    res.json(result);
});

app.get('/api/payment/verify/:txRef', async (req, res) => {
    const { txRef } = req.params;
    const result = await MockPaymentService.verifyPayment(txRef);
    res.json(result);
});

app.post('/api/payment/refund', express.json(), async (req, res) => {
    const { txRef, amount, reason } = req.body;
    const result = await MockPaymentService.refundPayment(txRef, amount, reason);
    res.json(result);
});

// Payment callback endpoint
app.get('/api/payment/callback', (req, res) => {
    const { tx_ref, status, order_id } = req.query;
    console.log(`📞 Payment Callback: ${tx_ref} - ${status}`);
    
    // Redirect to frontend success page
    res.redirect(`https://ver-camp.vercel.app/payment/success?tx_ref=${tx_ref}&status=${status}&order_id=${order_id}`);
});

// ==================== GRAPHQL SETUP ====================

// Create Apollo Server with detailed errors
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    formatError: (err) => {
        console.error('GraphQL Error:', err);
        // Return full error details for debugging
        return {
            message: err.message,
            code: err.extensions?.code || 'INTERNAL_SERVER_ERROR',
            path: err.path,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        };
    },
});

// Start server function
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
                return { user };
            },
        })
    );

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🍕 Campus Crave GraphQL API`);
        console.log(`${'='.repeat(50)}`);
        console.log(`📍 GraphQL: http://localhost:${PORT}/graphql`);
        console.log(`💚 Health:  http://localhost:${PORT}/health`);
        console.log(`🔧 Mock Payment: http://localhost:${PORT}/api/payment/initiate`);
        console.log(`${'='.repeat(50)}\n`);
    });
}

startServer().catch(console.error);