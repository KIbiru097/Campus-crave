import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PaymentPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const paymentPercentage = searchParams.get('paymentPercentage');
    const totalAmount = searchParams.get('totalAmount');
    
    const [processing, setProcessing] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(5);
    const [showSuccess, setShowSuccess] = useState(false);

    const isPartial = paymentPercentage && parseInt(paymentPercentage) < 100;
    const remainingAmount = isPartial ? parseFloat(totalAmount) - parseFloat(amount) : 0;

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        
        if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
            setError('Please enter a valid 16-digit card number');
            return;
        }
        if (!expiry || expiry.length !== 5) {
            setError('Please enter valid expiry date (MM/YY)');
            return;
        }
        if (!cvv || cvv.length !== 3) {
            setError('Please enter valid CVV');
            return;
        }

        setProcessing(true);
        setError('');

        // Simulate payment processing
        setTimeout(() => {
            setProcessing(false);
            setShowSuccess(true);
            
            // Countdown to redirect
            const interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        navigate('/orders');
                    }
                    return prev - 1;
                });
            }, 1000);
        }, 2000);
    };

    if (showSuccess) {
        return (
            <div style={styles.container}>
                <div style={styles.successCard}>
                    <div style={styles.checkmark}>✓</div>
                    <h2 style={styles.successTitle}>Payment Successful!</h2>
                    <p>Your order has been confirmed.</p>
                    <div style={styles.details}>
                        <p><strong>Order ID:</strong> {orderId}</p>
                        <p><strong>Amount Paid:</strong> ETB {amount}</p>
                        {isPartial && (
                            <>
                                <p><strong>Payment Type:</strong> Partial Payment (50%)</p>
                                <p><strong>Remaining Balance:</strong> ETB {remainingAmount} (to be paid on delivery)</p>
                            </>
                        )}
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
                <h2 style={styles.title}>💳 Payment Details</h2>
                <p style={styles.subtitle}>Complete your payment to place the order</p>

                <div style={styles.orderInfo}>
                    <div style={styles.infoRow}>
                        <span>Order ID:</span>
                        <strong>{orderId}</strong>
                    </div>
                    <div style={styles.infoRow}>
                        <span>Total Amount:</span>
                        <strong>ETB {totalAmount}</strong>
                    </div>
                    {isPartial && (
                        <div style={styles.infoRow}>
                            <span>Pay Now:</span>
                            <strong style={styles.partialAmount}>ETB {amount}</strong>
                        </div>
                    )}
                    {isPartial && (
                        <div style={styles.infoRow}>
                            <span>Pay on Delivery:</span>
                            <strong>ETB {remainingAmount}</strong>
                        </div>
                    )}
                </div>

                <form onSubmit={handlePayment}>
                    <div style={styles.formGroup}>
                        <label>Card Number</label>
                        <input
                            type="text"
                            placeholder="4242 4242 4242 4242"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength="19"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.row}>
                        <div style={styles.formGroup}>
                            <label>Expiry Date</label>
                            <input
                                type="text"
                                placeholder="MM/YY"
                                value={expiry}
                                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                maxLength="5"
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label>CVV</label>
                            <input
                                type="password"
                                placeholder="123"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                                maxLength="3"
                                style={styles.input}
                            />
                        </div>
                    </div>

                    {error && <div style={styles.error}>{error}</div>}

                    <div style={styles.demoNote}>
                        <p>🎭 Demo Mode - Use any test card:</p>
                        <code>4242 4242 4242 4242 | 12/25 | 123</code>
                    </div>

                    <button type="submit" disabled={processing} style={styles.payButton}>
                        {processing ? 'Processing...' : `Pay ETB ${amount}`}
                    </button>
                </form>

                <button onClick={() => navigate('/checkout')} style={styles.backBtn}>
                    ← Back to Checkout
                </button>
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
        marginBottom: '10px',
        color: '#2c3e50',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: '30px',
    },
    orderInfo: {
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '25px',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
    },
    partialAmount: {
        color: '#f39c12',
    },
    formGroup: {
        marginBottom: '15px',
        flex: 1,
    },
    row: {
        display: 'flex',
        gap: '15px',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '14px',
    },
    demoNote: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e8f4fd',
        borderRadius: '10px',
        fontSize: '12px',
        textAlign: 'center',
    },
    payButton: {
        width: '100%',
        marginTop: '20px',
        padding: '14px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    backBtn: {
        width: '100%',
        marginTop: '10px',
        padding: '12px',
        backgroundColor: 'transparent',
        color: '#666',
        border: '1px solid #ddd',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    error: {
        color: '#e74c3c',
        marginTop: '10px',
        fontSize: '14px',
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
        textAlign: 'left',
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
        borderRadius: '8px',
        cursor: 'pointer',
    },
};

export default PaymentPage;