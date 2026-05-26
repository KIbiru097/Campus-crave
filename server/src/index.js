require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const typeDefs = require('./schema/typeDefs');
const { resolvers, getUserFromToken } = require('./schema/resolvers');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration for production
const corsOptions = {
    origin: ['http://localhost:3000', 'https://*.vercel.app', 'https://*.onrender.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock Payment endpoints
const MockPaymentService = require('./services/mockPaymentService');

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

app.get('/api/payment/callback', (req, res) => {
    const { tx_ref, status, order_id } = req.query;
    console.log(`📞 Payment Callback: ${tx_ref} - ${status}`);
    res.redirect(`https://campus-crave.vercel.app/payment/success?tx_ref=${tx_ref}&status=${status}&order_id=${order_id}`);
});

// GraphQL Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    formatError: (err) => {
        console.error('GraphQL Error:', err.message);
        return { message: err.message, code: err.extensions?.code || 'INTERNAL_SERVER_ERROR' };
    },
});

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
        console.log(`💚 Health: http://localhost:${PORT}/health`);
        console.log(`${'='.repeat(50)}\n`);
    });
}

startServer().catch(console.error);
