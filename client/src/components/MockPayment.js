import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MockPayment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const txRef = searchParams.get('tx_ref');
    const amount = searchParams.get('amount');
    const orderId = searchParams.get('order_id');
    
    const [processing, setProcessing] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleMockPayment = useCallback(async () => {
        setProcessing(true);
        
        setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:4000/api/payment/verify/${txRef}`);
                const result = await response.json();
                
                if (result.success) {
                    setShowSuccess(true);
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
                setShowSuccess(true);
                setTimeout(() => navigate('/orders'), 3000);
            }
        }, 2000);
    }, [txRef, navigate]);

    useEffect(() => {
        if (txRef && amount) {
            setTimeout(() => handleMockPayment(), 1000);
        }
    }, [txRef, amount, handleMockPayment]);

    // ... rest of your component (the JSX part)

    if (showSuccess) {
        return (
            <div style={styles.container}>
                <div style={styles.successCard}>
                    <div style={styles.checkmark}>✓</div>
                    <h2 style={styles.successTitle}>Payment Successful!</h2>
                    <p style={styles.successText}>Your payment has been processed successfully.</p>
                    <div style={styles.details}>
                        <p><strong>Transaction ID:</strong> {txRef}</p>
                        <p><strong>Amount Paid:</strong> ETB {amount}</p>
                        <p><strong>Status:</strong> <span style={styles.paidStatus}>Completed</span></p>
                    </div>
                    <p style={styles.redirectNote}>Redirecting to orders in {countdown} seconds...</p>
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
                <h2 style={styles.title}>💳 Mock Payment Demo</h2>
                <p style={styles.subtitle}>This is a simulation for demonstration purposes.</p>
                
                <div style={styles.orderDetails}>
                    <h3>Order Summary</h3>
                    <div style={styles.detailRow}>
                        <span>Order ID:</span>
                        <strong>{orderId}</strong>
                    </div>
                    <div style={styles.detailRow}>
                        <span>Amount:</span>
                        <strong style={styles.amount}>ETB {amount}</strong>
                    </div>
                    <div style={styles.detailRow}>
                        <span>Transaction:</span>
                        <strong>{txRef}</strong>
                    </div>
                    <div style={styles.detailRow}>
                        <span>Customer:</span>
                        <strong>{user?.username || 'Guest'}</strong>
                    </div>
                </div>

                <div style={styles.demoCard}>
                    <p style={styles.demoLabel}>🎭 Demo Mode Information</p>
                    <p style={styles.demoText}>
                        This is a simulated payment. No real money will be charged.
                        Click "Pay Now" to complete the demo transaction.
                    </p>
                    <div style={styles.mockCardDetails}>
                        <p>Mock Card Details (for display only):</p>
                        <code style={styles.code}>4242 4242 4242 4242</code>
                        <code style={styles.code}>Expiry: 12/25 | CVV: 123</code>
                    </div>
                </div>

                {processing ? (
                    <div style={styles.processing}>
                        <div style={styles.spinner}></div>
                        <p>Processing payment...</p>
                    </div>
                ) : (
                    <button 
                        onClick={handleMockPayment} 
                        style={styles.payButton}
                    >
                        💳 Pay ETB {amount}
                    </button>
                )}

                <p style={styles.note}>
                    ⚡ Demo Mode: No real payment will be charged. This is for demonstration only.
                </p>
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
        backgroundColor: '#f5f5f5'
    },
    card: {
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center'
    },
    title: {
        color: '#2c3e50',
        marginBottom: '10px'
    },
    subtitle: {
        color: '#666',
        marginBottom: '30px'
    },
    orderDetails: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'left',
        marginBottom: '20px'
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #e9ecef'
    },
    amount: {
        color: '#27ae60',
        fontSize: '18px'
    },
    demoCard: {
        backgroundColor: '#e8f4fd',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
    },
    demoLabel: {
        fontWeight: 'bold',
        color: '#0066cc',
        marginBottom: '10px'
    },
    demoText: {
        fontSize: '14px',
        color: '#555',
        marginBottom: '15px'
    },
    mockCardDetails: {
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '10px'
    },
    code: {
        display: 'block',
        fontFamily: 'monospace',
        padding: '5px',
        margin: '5px 0',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px'
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
        transition: 'background 0.3s'
    },
    processing: {
        textAlign: 'center',
        padding: '20px'
    },
    spinner: {
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 15px auto'
    },
    note: {
        marginTop: '20px',
        fontSize: '12px',
        color: '#888'
    },
    successCard: {
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center'
    },
    checkmark: {
        width: '80px',
        height: '80px',
        backgroundColor: '#27ae60',
        color: 'white',
        borderRadius: '50%',
        fontSize: '50px',
        lineHeight: '80px',
        margin: '0 auto 20px auto'
    },
    successTitle: {
        color: '#27ae60',
        marginBottom: '15px'
    },
    successText: {
        color: '#666',
        marginBottom: '20px'
    },
    paidStatus: {
        color: '#27ae60',
        fontWeight: 'bold'
    },
    redirectNote: {
        marginTop: '20px',
        color: '#888',
        fontSize: '14px'
    },
    button: {
        marginTop: '20px',
        padding: '12px 30px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
    }
};

// Add animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default MockPayment;