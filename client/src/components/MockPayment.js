import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MockPayment = () => {
    const IP_ADDRESS = '192.168.1.15';
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const txRef = searchParams.get('tx_ref');
    const amount = searchParams.get('amount');
    const orderId = searchParams.get('order_id');
    
    const [processing, setProcessing] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleMockPayment = async () => {
        setProcessing(true);
        
        // Simulate payment processing
        setTimeout(async () => {
            try {
                // Verify payment with backend
               const response = await fetch(`http://${IP_ADDRESS}:4000/api/payment/verify/${txRef}`);
                const result = await response.json();
                
                if (result.success) {
                    setShowSuccess(true);
                    // Start countdown to redirect
                    const interval = setInterval(() => {
                        setCountdown(prev => {
                            if (prev <= 1) {
                                clearInterval(interval);
                                navigate('/orders');
                            }
                            return prev - 1;
                        });
                    }, 1000);
                } else {
                    alert('Payment verification failed');
                    navigate('/cart');
                }
            } catch (error) {
                console.error('Verification error:', error);
                // Demo mode - still succeed
                setShowSuccess(true);
                setTimeout(() => navigate('/orders'), 3000);
            }
        }, 2000);
    };

    useEffect(() => {
        if (txRef && amount) {
            setTimeout(() => handleMockPayment(), 1000);
        }
    }, [txRef, amount]);

    if (showSuccess) {
        return (
            <div style={styles.container}>
                <div style={styles.successCard}>
                    <div style={styles.checkmark}>✓</div>
                    <h2 style={styles.successTitle}>Payment Successful!</h2>
                    <p>Your payment has been processed successfully.</p>
                    <div style={styles.details}>
                        <p><strong>Transaction ID:</strong> {txRef}</p>
                        <p><strong>Amount Paid:</strong> ETB {amount}</p>
                        <p><strong>Status:</strong> <span style={styles.paidStatus}>Completed</span></p>
                    </div>
                    <p>Redirecting to orders in {countdown} seconds...</p>
                    <button onClick={() => navigate('/orders')} style={styles.button}>
                        Go to My Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>💳 Mock Payment Demo</h2>
                <p>This is a simulation for demonstration purposes.</p>
                
                <div style={styles.orderDetails}>
                    <h3>Order Summary</h3>
                    <p><strong>Order ID:</strong> {orderId}</p>
                    <p><strong>Amount:</strong> ETB {amount}</p>
                    <p><strong>Transaction:</strong> {txRef}</p>
                    <p><strong>Customer:</strong> {user?.username || 'Guest'}</p>
                </div>

                <div style={styles.demoCard}>
                    <p><strong>🎭 Demo Mode</strong></p>
                    <p>This is a simulated payment. No real money will be charged.</p>
                    <div>
                        <p>Mock Card Details:</p>
                        <code>4242 4242 4242 4242 | 12/25 | 123</code>
                    </div>
                </div>

                {processing ? (
                    <div style={styles.processing}>
                        <div style={styles.spinner}></div>
                        <p>Processing payment...</p>
                    </div>
                ) : (
                    <button onClick={handleMockPayment} style={styles.payButton}>
                        Pay ETB {amount}
                    </button>
                )}

                <p style={styles.note}>⚡ Demo Mode: No real payment will be charged</p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '20px',
        backgroundColor: '#f5f5f5',
    },
    card: {
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center',
    },
    successCard: {
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center',
    },
    checkmark: {
        width: '80px',
        height: '80px',
        backgroundColor: '#27ae60',
        color: 'white',
        borderRadius: '50%',
        fontSize: '50px',
        lineHeight: '80px',
        margin: '0 auto 20px',
    },
    successTitle: {
        color: '#27ae60',
        marginBottom: '15px',
    },
    details: {
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
    },
    paidStatus: {
        color: '#27ae60',
        fontWeight: 'bold',
    },
    button: {
        marginTop: '20px',
        padding: '12px 30px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    orderDetails: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'left',
    },
    demoCard: {
        backgroundColor: '#e8f4fd',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
    },
    processing: {
        padding: '20px',
    },
    spinner: {
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 15px',
    },
    payButton: {
        width: '100%',
        padding: '15px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    note: {
        marginTop: '20px',
        fontSize: '12px',
        color: '#888',
    },
};

export default MockPayment;