import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_CART } from '../graphql/queries';
import { UPDATE_CART_ITEM, REMOVE_FROM_CART, CLEAR_CART } from '../graphql/mutations';

const Cart = () => {
    const navigate = useNavigate();
    const [paymentRules, setPaymentRules] = useState(null);
    
    const { loading, error, data, refetch } = useQuery(GET_CART);
    const [updateCartItem] = useMutation(UPDATE_CART_ITEM);
    const [removeFromCart] = useMutation(REMOVE_FROM_CART);
    const [clearCart] = useMutation(CLEAR_CART);

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

    const handleProceedToCheckout = () => {
        if (!items.length) {
            alert('Your cart is empty');
            return;
        }
        navigate('/checkout');
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

    const deliveryFee = total > 150 ? 0 : 30;
    const serviceFee = 10;
    const grandTotal = total + deliveryFee + serviceFee;

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
                    <span>ETB {deliveryFee} {deliveryFee === 0 && '(Free)'}</span>
                </div>
                <div style={styles.summaryRow}>
                    <span>Service Fee:</span>
                    <span>ETB {serviceFee}</span>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.summaryRowTotal}>
                    <span>Total:</span>
                    <span>ETB {grandTotal}</span>
                </div>
            </div>

            {/* Payment Rules Info */}
            {paymentRules && (
                <div style={styles.rulesCard}>
                    <h4>📋 Payment Rules</h4>
                    <p>{paymentRules.message}</p>
                    {itemCount >= 4 && (
                        <p style={styles.warning}>⚠️ Online payment required for 4+ items</p>
                    )}
                    {itemCount <= 3 && (
                        <p style={styles.info}>ℹ️ You can pay 50% now and 50% on delivery</p>
                    )}
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
                >
                    Proceed to Checkout →
                </button>
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
    rulesCard: {
        backgroundColor: '#f0f7ff',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '20px',
    },
    warning: {
        color: '#e74c3c',
        fontWeight: 'bold',
        marginTop: '5px',
        fontSize: '12px',
    },
    info: {
        color: '#27ae60',
        marginTop: '5px',
        fontSize: '12px',
    },
    actionButtons: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'flex-end',
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