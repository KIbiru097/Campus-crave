import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_CART } from '../graphql/queries';
import { UPDATE_CART_ITEM, REMOVE_FROM_CART, CLEAR_CART, CREATE_ORDER } from '../graphql/mutations';

const Cart = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [paymentError, setPaymentError] = useState('');
    const [paymentRules, setPaymentRules] = useState(null);
    const [processing, setProcessing] = useState(false);
    
    const { loading, error, data, refetch } = useQuery(GET_CART);
    const [updateCartItem] = useMutation(UPDATE_CART_ITEM);
    const [removeFromCart] = useMutation(REMOVE_FROM_CART);
    const [clearCart] = useMutation(CLEAR_CART);
    const [createOrder] = useMutation(CREATE_ORDER);

    // Get payment rules based on item count (from documentation)
    const getPaymentRules = (count) => {
        if (count >= 4 && count <= 6) {
            return {
                allowedMethods: ['Online'],
                requiredOnline: true,
                message: 'Orders with 4-6 items require full online payment. Cash on delivery is not allowed.',
                partialAllowed: false,
                amountDue: 'Full'
            };
        } else if (count >= 1 && count <= 3) {
            return {
                allowedMethods: ['Online', 'COD'],
                requiredOnline: false,
                message: 'You can choose between online payment or cash on delivery',
                partialAllowed: true,
                partialPercentage: 50,
                amountDue: 'Full or 50% partial'
            };
        } else {
            return {
                allowedMethods: [],
                requiredOnline: false,
                message: 'Invalid order quantity. Maximum 6 items per order.',
                partialAllowed: false,
                amountDue: 'N/A'
            };
        }
    };

    const cart = data?.myCart;
    const items = cart?.items || [];
    const total = cart?.total || 0;
    const itemCount = cart?.item_count || 0;

    // Update payment rules when cart changes
    useEffect(() => {
        const rules = getPaymentRules(itemCount);
        setPaymentRules(rules);
        // If only online is allowed, force set to Online
        if (rules.allowedMethods.length === 1 && rules.allowedMethods[0] === 'Online') {
            setPaymentMethod('Online');
        }
    }, [itemCount]);

    const handleUpdateQuantity = async (cartItemId, currentQty, change) => {
        const newQty = currentQty + change;
        if (newQty < 1) return;
        
        try {
            await updateCartItem({
                variables: { cartItemId, quantity: newQty }
            });
            refetch();
        } catch (err) {
            console.error('Error updating quantity:', err);
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
            console.error('Error removing item:', err);
            alert('Failed to remove item');
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Are you sure you want to clear your entire cart?')) {
            try {
                await clearCart();
                refetch();
            } catch (err) {
                console.error('Error clearing cart:', err);
                alert('Failed to clear cart');
            }
        }
    };

    const handleProceedToCheckout = async () => {
        if (!items.length) {
            alert('Your cart is empty');
            return;
        }

        // Validate payment method against business rules
        if (paymentRules?.requiredOnline && paymentMethod !== 'Online') {
            setPaymentError('This order requires online payment. Cash on delivery is not available for 4+ items.');
            return;
        }

        if (!paymentRules?.allowedMethods.includes(paymentMethod)) {
            setPaymentError(`Payment method ${paymentMethod} is not available for this order.`);
            return;
        }

        setPaymentError('');
        setProcessing(true);

        try {
            // Get cafe ID from first item
            const cafeId = items[0]?.menu_item?.cafe_id || 1;

            const { data: orderData } = await createOrder({
                variables: {
                    input: {
                        cafe_id: cafeId,
                        payment_type: paymentMethod === 'COD' ? 'COD' : 'Online',
                        special_instructions: null
                    }
                }
            });
            
            if (orderData?.createOrder) {
                const order = orderData.createOrder;
                
                if (paymentMethod === 'COD') {
                    // For COD: order placed, pay on delivery
                    alert(`✅ Order placed successfully!\n\nOrder #: ${order.order_number}\nTotal: ETB ${cart.total}\nPayment: Cash on Delivery\n\nPlease have exact change ready.`);
                    refetch();
                    navigate('/orders');
                } else {
                    // For Online payment: go to payment page
                    let paymentAmount = cart.total;
                    let paymentPercentage = 100;
                    
                    // Check if partial payment is allowed (1-3 items)
                    if (itemCount <= 3 && paymentRules?.partialAllowed) {
                        paymentAmount = cart.total * 0.5;
                        paymentPercentage = 50;
                    }
                    
                    // Redirect to mock payment page
                    window.location.href = `http://localhost:3000/mock-payment?tx_ref=MOCK-${order.id}-${Date.now()}&amount=${paymentAmount}&order_id=${order.id}&item_count=${itemCount}&payment_percentage=${paymentPercentage}&total_amount=${cart.total}`;
                }
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Failed to create order: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="loading">Loading cart...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    if (items.length === 0) {
        return (
            <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>🛒</div>
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
            
            <div style={styles.itemsContainer}>
                {items.map((item) => (
                    <div key={item.id} style={styles.cartItem}>
                        <div style={styles.itemDetails}>
                            <h4>{item.menu_item?.name}</h4>
                            <p style={styles.itemPrice}>ETB {item.unit_price} each</p>
                            {item.customizations && (
                                <p style={styles.customizations}>Note: {item.customizations}</p>
                            )}
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
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Summary */}
            <div style={styles.summaryCard}>
                <h3>Order Summary</h3>
                <div style={styles.summaryRow}>
                    <span>Subtotal ({itemCount} items):</span>
                    <span>ETB {total}</span>
                </div>
                <div style={styles.summaryRow}>
                    <span>Delivery Fee:</span>
                    <span>ETB {total > 150 ? 0 : 30}</span>
                </div>
                <div style={styles.summaryRow}>
                    <span>Service Fee:</span>
                    <span>ETB 10</span>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.summaryRowTotal}>
                    <span>Total:</span>
                    <span>ETB {total + (total > 150 ? 10 : 40)}</span>
                </div>
            </div>

            {/* Payment Selection Section */}
            {paymentRules && (
                <div style={styles.paymentSection}>
                    <h4>Select Payment Method</h4>
                    <div style={styles.paymentOptions}>
                        {paymentRules.allowedMethods.includes('Online') && (
                            <label style={styles.paymentOption}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="Online"
                                    checked={paymentMethod === 'Online'}
                                    onChange={() => setPaymentMethod('Online')}
                                />
                                <span>💳 Online Payment</span>
                                {paymentRules.partialAllowed && (
                                    <small style={styles.partialNote}>(50% now, 50% on delivery)</small>
                                )}
                            </label>
                        )}
                        {paymentRules.allowedMethods.includes('COD') && (
                            <label style={styles.paymentOption}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={() => setPaymentMethod('COD')}
                                />
                                <span>💵 Cash on Delivery</span>
                            </label>
                        )}
                    </div>
                    
                    {paymentError && <div style={styles.paymentError}>{paymentError}</div>}
                    
                    <div style={styles.rulesInfo}>
                        <small>📋 {paymentRules.message}</small>
                        {itemCount >= 4 && (
                            <small style={styles.warning}>⚠️ Online payment required for 4+ items</small>
                        )}
                        {itemCount <= 3 && (
                            <small style={styles.info}>ℹ️ You can pay 50% now and 50% on delivery</small>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={styles.actionButtons}>
                <button onClick={handleClearCart} style={styles.clearBtn}>
                    Clear Cart
                </button>
                <button 
                    onClick={handleProceedToCheckout} 
                    style={styles.checkoutBtn}
                    disabled={processing}
                >
                    {processing ? 'Processing...' : 'Proceed to Checkout'}
                </button>
            </div>

            {/* Business Rules Notice */}
            <div style={styles.rulesNotice}>
                <p>📋 <strong>Payment Rules:</strong></p>
                <ul>
                    <li>✓ Maximum 6 items per order</li>
                    <li>✓ 1-3 items: Choose Online or Cash on Delivery</li>
                    <li>✓ 4-6 items: Online payment only</li>
                    <li>✓ 1-3 items: 50% partial payment available</li>
                    <li>✓ Free delivery on orders above ETB 150</li>
                </ul>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
    },
    title: {
        marginBottom: '30px',
        color: '#2c3e50',
        fontSize: '28px',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px',
    },
    itemsContainer: {
        border: '1px solid #ddd',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '20px',
    },
    cartItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #eee',
        backgroundColor: 'white',
        flexWrap: 'wrap',
        gap: '15px',
    },
    itemDetails: {
        flex: 2,
    },
    itemPrice: {
        fontSize: '12px',
        color: '#666',
        marginTop: '4px',
    },
    customizations: {
        fontSize: '11px',
        color: '#888',
        marginTop: '4px',
        fontStyle: 'italic',
    },
    itemActions: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    qtyBtn: {
        width: '32px',
        height: '32px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    quantity: {
        minWidth: '30px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
    },
    itemTotal: {
        minWidth: '80px',
        fontWeight: 'bold',
        color: '#27ae60',
        fontSize: '16px',
    },
    removeBtn: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        fontSize: '14px',
        color: '#555',
    },
    summaryRowTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    divider: {
        height: '1px',
        backgroundColor: '#eee',
        margin: '10px 0',
    },
    paymentSection: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    paymentOptions: {
        display: 'flex',
        gap: '30px',
        marginTop: '15px',
        flexWrap: 'wrap',
    },
    paymentOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    partialNote: {
        fontSize: '11px',
        color: '#f39c12',
        marginLeft: '5px',
    },
    paymentError: {
        color: '#e74c3c',
        marginTop: '10px',
        fontSize: '14px',
        padding: '8px',
        backgroundColor: '#fdecea',
        borderRadius: '6px',
    },
    rulesInfo: {
        marginTop: '15px',
        paddingTop: '10px',
        borderTop: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    warning: {
        color: '#e74c3c',
        fontWeight: 'bold',
        fontSize: '12px',
    },
    info: {
        color: '#27ae60',
        fontSize: '12px',
    },
    actionButtons: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'flex-end',
        marginTop: '20px',
    },
    clearBtn: {
        padding: '12px 24px',
        backgroundColor: '#95a5a6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    checkoutBtn: {
        padding: '12px 32px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    rulesNotice: {
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f0f7ff',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#555',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '60px',
    },
    emptyIcon: {
        fontSize: '60px',
        marginBottom: '20px',
    },
    browseBtn: {
        marginTop: '20px',
        padding: '12px 30px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
    },
};

export default Cart;