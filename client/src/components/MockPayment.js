import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MockPayment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const txRef = searchParams.get('tx_ref');
    const amount = searchParams.get('amount');
    const orderId = searchParams.get('order_id');
    const itemCount = searchParams.get('item_count');
    const paymentPercentage = searchParams.get('payment_percentage');
    
    const [processing, setProcessing] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPartialWarning, setShowPartialWarning] = useState(false);

    const handleMockPayment = async () => {
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
    };

    useEffect(() => {
        if (txRef && amount) {
            // Check if this is a partial payment
            if (paymentPercentage && parseInt(paymentPercentage) < 100) {
                setShowPartialWarning(true);
            }
            setTimeout(() => handleMockPayment(), 1000);
        }
    }, [txRef, amount]);

    if (showSuccess) {
        const isPartial = paymentPercentage && parseInt(paymentPercentage) < 100;
        const remainingAmount = isPartial ? parseFloat(amount) * (100 / parseInt(paymentPercentage) - 1) : 0;
        
        return (
            <div style={styles.container}>
                <div style={styles.successCard}>
                    <div style={styles.checkmark}>✓</div>
                    <h2 style={styles.successTitle}>Order Placed Successfully!</h2>
                    <div style={styles.details}>
                        <p><strong>Order ID:</strong> {orderId}</p>
                        <p><strong>Transaction ID:</strong> {txRef}</p>
                        <p><strong>Items:</strong> {itemCount}</p>
                        <p><strong>Amount Paid:</strong> ETB {amount}</p>
                        {isPartial && (
                            <>
                                <p><strong>Payment Type:</strong> Partial Payment (50%)</p>
                                <p><strong>Remaining Balance:</strong> ETB {remainingAmount} (to be paid on delivery)</p>
                            </>
                        )}
                        <p><strong>Status:</strong> <span style={styles.paidStatus}>Confirmed</span></p>
                    </div>
                    {isPartial && (
                        <div style={styles.partialNote}>
                            ⚠️ You have made a 50% partial payment. The remaining ETB {remainingAmount} will be collected upon delivery.
                        </div>
                    )}
                    <p>Redirecting to orders in {countdown} seconds...</p>
                    <button onClick={() => navigate('/orders')} style={styles.button}>
                        Go to My Orders
                    </button>
                </div>
            </div>
        );
    }

    const isPartialPayment = paymentPercentage && parseInt(paymentPercentage) < 100;

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>💳 Complete Payment</h2>
                
                {showPartialWarning && (
                    <div style={styles.warningCard}>
                        <p>⚠️ This is a <strong>50% partial payment</strong> for your order.</p>
                        <p>The remaining 50% will be paid when you receive your order.</p>
                    </div>
                )}
                
                <div style={styles.orderDetails}>
                    <h3>Order Summary</h3>
                    <div style={styles.detailRow}>
                        <span>Order ID:</span>
                        <strong>{orderId}</strong>
                    </div>
                    <div style={styles.detailRow}>
                        <span>Items:</span>
                        <strong>{itemCount} items</strong>
                    </div>
                    {isPartialPayment ? (
                        <>
                            <div style={styles.detailRow}>
                                <span>Total Amount:</span>
                                <strong style={styles.amount}>ETB {parseFloat(amount) * 2}</strong>
                            </div>
                            <div style={styles.detailRow}>
                                <span>Pay Now (50%):</span>
                                <strong style={styles.partialAmount}>ETB {amount}</strong>
                            </div>
                            <div style={styles.detailRow}>
                                <span>Pay on Delivery (50%):</span>
                                <strong>ETB {parseFloat(amount)}</strong>
                            </div>
                        </>
                    ) : (
                        <div style={styles.detailRow}>
                            <span>Total Amount:</span>
                            <strong style={styles.amount}>ETB {amount}</strong>
                        </div>
                    )}
                </div>

                <div style={styles.paymentInfo}>
                    <h4>Payment Details</h4>
                    <div style={styles.mockCardDetails}>
                        <p>Test Card Information:</p>
                        <code>4242 4242 4242 4242</code>
                        <code>Expiry: 12/25 | CVV: 123</code>
                        <p style={styles.demoNote}>* This is a mock payment. No real charge will be applied.</p>
                    </div>
                </div>

                {processing ? (
                    <div style={styles.processing}>
                        <div style={styles.spinner}></div>
                        <p>Processing payment...</p>
                    </div>
                ) : (
                    <button onClick={handleMockPayment} style={styles.payButton}>
                        {isPartialPayment ? `Pay 50% (ETB ${amount}) Now` : `Pay ETB ${amount} Now`}
                    </button>
                )}
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
    },
    title: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#2c3e50',
    },
    warningCard: {
        backgroundColor: '#fef3c7',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #f59e0b',
    },
    orderDetails: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #e9ecef',
    },
    amount: {
        color: '#27ae60',
        fontWeight: 'bold',
        fontSize: '18px',
    },
    partialAmount: {
        color: '#f39c12',
        fontWeight: 'bold',
    },
    paymentInfo: {
        marginBottom: '20px',
    },
    mockCardDetails: {
        backgroundColor: '#e8f4fd',
        padding: '15px',
        borderRadius: '10px',
        marginTop: '10px',
    },
    demoNote: {
        fontSize: '12px',
        color: '#666',
        marginTop: '10px',
    },
    code: {
        display: 'block',
        fontFamily: 'monospace',
        padding: '8px',
        margin: '5px 0',
        backgroundColor: 'white',
        borderRadius: '4px',
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
        transition: 'all 0.3s',
    },
    processing: {
        textAlign: 'center',
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
        marginBottom: '20px',
    },
    details: {
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        textAlign: 'left',
    },
    paidStatus: {
        color: '#27ae60',
        fontWeight: 'bold',
    },
    partialNote: {
        backgroundColor: '#fef3c7',
        padding: '10px',
        borderRadius: '8px',
        marginTop: '10px',
        fontSize: '14px',
    },
    button: {
        marginTop: '20px',
        padding: '12px 30px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
};

// Add keyframe animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default MockPayment;