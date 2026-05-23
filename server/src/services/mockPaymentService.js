// src/services/mockPaymentService.js
class MockPaymentService {
    // Generate transaction reference
    static generateTxRef(orderId) {
        return `MOCK-${orderId}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }

    // Initialize mock payment
    static async initializePayment({ amount, email, firstName, lastName, txRef, orderId }) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`\n🎭 Mock Payment Initiated:`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Amount: ETB ${amount}`);
        console.log(`   Email: ${email}`);
        console.log(`   Customer: ${firstName} ${lastName}`);
        console.log(`   Reference: ${txRef}`);
        
        // Always return success for demo
        return {
            success: true,
            paymentUrl: `http://localhost:3000/mock-payment?tx_ref=${txRef}&amount=${amount}&order_id=${orderId}`,
            txRef: txRef,
            isMock: true
        };
    }

    // Verify mock payment
    static async verifyPayment(txRef) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`\n🎭 Mock Payment Verified: ${txRef}`);
        
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
        
        console.log(`\n🎭 Mock Refund Processed:`);
        console.log(`   Transaction: ${txRef}`);
        console.log(`   Amount: ETB ${amount}`);
        console.log(`   Reason: ${reason}`);
        
        return {
            success: true,
            refundId: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            message: 'Mock refund successful'
        };
    }
}

module.exports = MockPaymentService;