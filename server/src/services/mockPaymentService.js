// src/services/mockPaymentService.js
const crypto = require('crypto');

class MockPaymentService {
    // Generate secure transaction reference with HMAC signature
    static generateTxRef(orderId) {
        const timestamp = Date.now();
        const secret = process.env.JWT_SECRET || 'campus_crave_secret_2024';
        const signature = crypto.createHmac('sha256', secret)
            .update(`${orderId}:${timestamp}`)
            .digest('hex')
            .slice(0, 16);
        return `MOCK-${orderId}-${timestamp}-${signature}`;
    }

    // Verify HMAC signature of transaction reference
    static verifySignature(txRef) {
        if (!txRef || typeof txRef !== 'string') return false;
        const parts = txRef.split('-');
        if (parts.length !== 4 || parts[0] !== 'MOCK') return false;
        const [_, orderId, timestamp, signature] = parts;
        const secret = process.env.JWT_SECRET || 'campus_crave_secret_2024';
        const expected = crypto.createHmac('sha256', secret)
            .update(`${orderId}:${timestamp}`)
            .digest('hex')
            .slice(0, 16);
        if (signature.length !== expected.length) return false;
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }

    // Initialize mock payment
    static async initializePayment({ amount, email, firstName, lastName, txRef, orderId }) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`🎭 Mock Payment Initiated:`);
        console.log(`   Order: ${orderId}`);
        console.log(`   Amount: ETB ${amount}`);
        console.log(`   Email: ${email}`);
        console.log(`   Reference: ${txRef}`);
        
        const frontendUrl = process.env.FRONTEND_URL || 'https://cumcravestuorder.vercel.app';
        
        // Always return success for demo
        return {
            success: true,
            paymentUrl: `${frontendUrl}/mock-payment?tx_ref=${txRef}&amount=${amount}&order_id=${orderId}`,
            txRef: txRef,
            isMock: true
        };
    }

    // Verify mock payment
    static async verifyPayment(txRef) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`🎭 Mock Payment Verified: ${txRef}`);
        
        return {
            success: true,
            amount: 100,
            status: 'success',
            isMock: true,
            message: 'Mock payment successful - No real charge applied'
        };
    }

    // Process refund
    static async refundPayment(txRef, amount, reason) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`🎭 Mock Refund Processed:`);
        console.log(`   Transaction: ${txRef}`);
        console.log(`   Amount: ETB ${amount}`);
        console.log(`   Reason: ${reason}`);
        
        return {
            success: true,
            refundId: `REF-${Date.now()}`,
            message: 'Mock refund successful'
        };
    }
}

module.exports = MockPaymentService;
