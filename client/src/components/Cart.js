import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_CART } from '../graphql/queries';
import { UPDATE_CART_ITEM, REMOVE_FROM_CART, CLEAR_CART, CREATE_ORDER } from '../graphql/mutations';

const Cart = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentPassword, setPaymentPassword] = useState('');
    const [currentOrder, setCurrentOrder] = useState(null);
    const [paymentError, setPaymentError] = useState('');
    
    const { loading, error, data, refetch } = useQuery(GET_CART);
    const [updateCartItem] = useMutation(UPDATE_CART_ITEM);
    const [removeFromCart] = useMutation(REMOVE_FROM_CART);
    const [clearCart] = useMutation(CLEAR_CART);
    const [createOrder] = useMutation(CREATE_ORDER);

    const handleUpdateQuantity = async (cartItemId, currentQty, change) => {
        const newQty = currentQty + change;
        if (newQty < 1) return;
        
        try {
            await updateCartItem({
                variables: { cartItemId, quantity: newQty }
            });
            refetch();
        } catch (err) {
            alert('Failed to update quantity');
        }
    };

    const handleRemoveItem = async (cartItemId) => {
        try {
            await removeFromCart({
                variables: { cartItemId }
            });
            refetch();
        } catch (err) {
            alert('Failed to remove item');
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Are you sure you want to clear your entire cart?')) {
            try {
                await clearCart();
                refetch();
            } catch (err) {
                alert('Failed to clear cart');
            }
        }
    };

    const handleCheckout = async () => {
        const cart = data?.myCart;
        
        if (!cart?.items?.length) {
            alert('Your cart is empty');
            return;
        }

        const cafeId = cart.items[0]?.menu_item?.cafe_id || 1;
        
        // Check if total is over 1500 and force online payment
        if (cart.total > 1500 && paymentMethod === 'COD') {
            alert('Orders over 1500 ETB must pay online');
            setPaymentMethod('ONLINE');
            return;
        }

        try {
            const { data: orderData } = await createOrder({
                variables: {
                    input: {
                        cafe_id: cafeId,
                        payment_type: paymentMethod,
                        special_instructions: null
                    }
                }
            });
            
            if (orderData?.createOrder) {
                const order = orderData.createOrder;
                
                if (paymentMethod === 'COD') {
                    // Cash on Delivery - direct success
                    alert(`Order placed successfully! Order #: ${order.order_number}`);
                    refetch();
                    navigate('/orders');
                } else {
                    // Online payment - show password modal
                    setCurrentOrder(order);
                    setShowPaymentModal(true);
                }
            }
        } catch (err) {
            alert('Failed to create order: ' + err.message);
        }
    };

    const handlePaymentVerification = async () => {
        if (!paymentPassword) {
            setPaymentError('Please enter your payment password');
            return;
        }
        
        try {
            // Call your payment verification API
           const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
            const response = await fetch(`${BACKEND_URL}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    query: `
                        mutation VerifyPayment($orderId: ID!, $paymentPassword: String!) {
                            verifyPayment(orderId: $orderId, paymentPassword: $paymentPassword) {
                                success
                                message
                            }
                        }
                    `,
                    variables: {
                        orderId: currentOrder.id,
                        paymentPassword: paymentPassword
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.data?.verifyPayment?.success) {
                alert('Payment successful! Order confirmed.');
                setShowPaymentModal(false);
                setPaymentPassword('');
                window.location.href = '/orders';
            } else {
                setPaymentError(result.data?.verifyPayment?.message || 'Payment failed');
            }
        } catch (err) {
            setPaymentError('Payment verification failed');
        }
    };

    if (loading) return <div className="loading">Loading cart...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    const cart = data?.myCart;
    const items = cart?.items || [];
    const total = cart?.total || 0;

    if (items.length === 0) {
        return (
            <div style={styles.emptyContainer}>
                <h2>Your Cart is Empty</h2>
                <p>Add items from our cafes to get started!</p>
                <Link to="/">
                    <button style={styles.browseBtn}>Browse Cafes</button>
                </Link>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Shopping Cart</h2>
            
            {/* Payment Method Selection */}
            <div style={styles.paymentSection}>
                <h3>Payment Method</h3>
                <div style={styles.paymentOptions}>
                    <label style={styles.paymentOption}>
                        <input
                            type="radio"
                            value="COD"
                            checked={paymentMethod === 'COD'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={total > 1500}
                        />
                        <span>Cash on Delivery (COD)</span>
                    </label>
                    <label style={styles.paymentOption}>
                        <input
                            type="radio"
                            value="ONLINE"
                            checked={paymentMethod === 'ONLINE'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>Pay Online</span>
                    </label>
                </div>
                {total > 1500 && (
                    <p style={styles.warningMessage}>
                        ⚠️ Orders over 1500 ETB must pay online
                    </p>
                )}
            </div>
            
            <div style={styles.itemsContainer}>
                {items.map((item) => (
                    <div key={item.id} style={styles.cartItem}>
                        <div style={styles.itemDetails}>
                            <h4>{item.menu_item?.name}</h4>
                            <p>ETB {item.unit_price} each</p>
                        </div>
                        <div style={styles.itemActions}>
                            <button 
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                style={styles.qtyBtn}
                            >
                                -
                            </button>
                            <span style={styles.quantity}>{item.quantity}</span>
                            <button 
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                style={styles.qtyBtn}
                            >
                                +
                            </button>
                            <span style={styles.itemTotal}>
                                ETB {item.quantity * item.unit_price}
                            </span>
                            <button 
                                onClick={() => handleRemoveItem(item.id)}
                                style={styles.removeBtn}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div style={styles.summary}>
                <h3>Total: ETB {total}</h3>
                <div style={styles.summaryButtons}>
                    <button onClick={handleClearCart} style={styles.clearBtn}>
                        Clear Cart
                    </button>
                    <button onClick={handleCheckout} style={styles.checkoutBtn}>
                        Proceed to Checkout
                    </button>
                </div>
            </div>
            
            {/* Payment Password Modal */}
            {showPaymentModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Enter Payment Password</h3>
                        <p>Order Total: ETB {currentOrder?.total_amount}</p>
                        <input
                            type="password"
                            placeholder="Enter your payment password"
                            value={paymentPassword}
                            onChange={(e) => setPaymentPassword(e.target.value)}
                            style={styles.modalInput}
                        />
                        {paymentError && <p style={styles.errorText}>{paymentError}</p>}
                        <div style={styles.modalButtons}>
                            <button onClick={() => setShowPaymentModal(false)} style={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button onClick={handlePaymentVerification} style={styles.confirmBtn}>
                                Pay Now
                            </button>
                        </div>
                        <p style={styles.modalHint}>Default password: 123456</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
    },
    title: {
        marginBottom: '20px',
        color: '#2c3e50',
    },
    paymentSection: {
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
    },
    paymentOptions: {
        display: 'flex',
        gap: '20px',
        marginTop: '10px',
    },
    paymentOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
    },
    warningMessage: {
        color: '#e74c3c',
        fontSize: '14px',
        marginTop: '10px',
    },
    itemsContainer: {
        border: '1px solid #ddd',
        borderRadius: '10px',
        overflow: 'hidden',
    },
    cartItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        backgroundColor: 'white',
        flexWrap: 'wrap',
    },
    itemDetails: {
        flex: 2,
    },
    itemActions: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    qtyBtn: {
        width: '30px',
        height: '30px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    quantity: {
        minWidth: '30px',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    itemTotal: {
        minWidth: '80px',
        fontWeight: 'bold',
        color: '#27ae60',
    },
    removeBtn: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '5px 12px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    summary: {
        marginTop: '20px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        textAlign: 'right',
    },
    summaryButtons: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'flex-end',
        marginTop: '15px',
    },
    clearBtn: {
        padding: '10px 20px',
        backgroundColor: '#95a5a6',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    checkoutBtn: {
        padding: '10px 25px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    browseBtn: {
        marginTop: '20px',
        padding: '10px 25px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '60px',
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
    },
    modalInput: {
        width: '100%',
        padding: '10px',
        margin: '15px 0',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '16px',
    },
    modalButtons: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
    },
    cancelBtn: {
        padding: '10px 20px',
        backgroundColor: '#95a5a6',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    confirmBtn: {
        padding: '10px 20px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    errorText: {
        color: '#e74c3c',
        marginBottom: '10px',
    },
    modalHint: {
        marginTop: '15px',
        fontSize: '12px',
        color: '#888',
    },
};

export default Cart;