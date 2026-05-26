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

// CORS configuration - LOCAL ONLY
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
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
        app: 'Campus Crave API',
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

// Payment callback endpoint - LOCAL ONLY
app.get('/api/payment/callback', (req, res) => {
    const { tx_ref, status, order_id } = req.query;
    console.log(`📞 Payment Callback: ${tx_ref} - ${status}`);
    
    // Redirect to local frontend
    res.redirect(`http://localhost:3000/payment/success?tx_ref=${tx_ref}&status=${status}&order_id=${order_id}`);
});

// ==================== GRAPHQL SETUP ====================

// Create Apollo Server
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

    app.listen(PORT, () => {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🍕 Campus Crave GraphQL API (LOCAL MODE)`);
        console.log(`${'='.repeat(50)}`);
        console.log(`📍 GraphQL: http://localhost:${PORT}/graphql`);
        console.log(`💚 Health:  http://localhost:${PORT}/health`);
        console.log(`🔧 Mock Payment: http://localhost:${PORT}/api/payment/initiate`);
        console.log(`🔗 Frontend should be on: http://localhost:3000`);
        console.log(`${'='.repeat(50)}\n`);
    });
}

startServer().catch(console.error);