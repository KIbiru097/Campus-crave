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

    const getPaymentRules = (count) => {
        if (count >= 4 && count <= 6) {
            return {
                allowedMethods: ['Online'],
                requiredOnline: true,
                message: 'Orders with 4-6 items require full online payment.',
                partialAllowed: false,
            };
        } else if (count >= 1 && count <= 3) {
            return {
                allowedMethods: ['Online', 'COD'],
                requiredOnline: false,
                message: 'You can choose online payment or cash on delivery',
                partialAllowed: true,
                partialPercentage: 50,
            };
        } else {
            return {
                allowedMethods: [],
                requiredOnline: false,
                message: 'Maximum 6 items per order.',
                partialAllowed: false,
            };
        }
    };

    const cart = data?.myCart;
    const items = cart?.items || [];
    const total = cart?.total || 0;
    const itemCount = cart?.item_count || 0;

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
            <h2 style={styles.title}>🛒 Shopping Cart</h2>
            
            <div style={styles.itemsContainer}>
                {items.map((item) => (
                    <div key={item.id} style={styles.cartItem}>
                        <div style={styles.itemDetails}>
                            <h4>{item.menu_item?.name}</h4>
                            <p style={styles.itemPrice}>ETB {item.unit_price} each</p>
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

            {paymentRules && (
                <div style={styles.rulesCard}>
                    <h4>📋 Payment Rules</h4>
                    <p>{paymentRules.message}</p>
                    {itemCount >= 4 && (
                        <p style={styles.warning}>⚠️ Online payment required for 4+ items</p>
                    )}
                </div>
            )}

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
        padding: '1rem',
    },
    title: {
        marginBottom: '1.5rem',
        color: '#2d6a4f',
        fontSize: '1.5rem',
        borderBottom: '2px solid #d8f3dc',
        paddingBottom: '0.5rem',
    },
    itemsContainer: {
        border: '1px solid #d8f3dc',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '1rem',
    },
    cartItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #d8f3dc',
        backgroundColor: '#fffef7',
        flexWrap: 'wrap',
        gap: '0.75rem',
    },
    itemDetails: {
        flex: 2,
    },
    itemPrice: {
        fontSize: '0.75rem',
        color: '#52b788',
        marginTop: '4px',
    },
    itemActions: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    qtyBtn: {
        width: '28px',
        height: '28px',
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    quantity: {
        minWidth: '25px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    itemTotal: {
        minWidth: '70px',
        fontWeight: 'bold',
        color: '#2d6a4f',
        fontSize: '14px',
    },
    removeBtn: {
        backgroundColor: '#d8f3dc',
        color: '#2d6a4f',
        border: 'none',
        padding: '4px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    summaryCard: {
        backgroundColor: '#fffef7',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        border: '1px solid #d8f3dc',
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontSize: '14px',
        color: '#52b788',
    },
    summaryRowTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#2d6a4f',
    },
    divider: {
        height: '1px',
        backgroundColor: '#d8f3dc',
        margin: '8px 0',
    },
    rulesCard: {
        backgroundColor: '#d8f3dc',
        borderRadius: '12px',
        padding: '0.75rem',
        marginBottom: '1rem',
    },
    warning: {
        color: '#2d6a4f',
        fontWeight: 'bold',
        marginTop: '4px',
        fontSize: '12px',
    },
    actionButtons: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
    },
    clearBtn: {
        padding: '10px 20px',
        backgroundColor: '#d8f3dc',
        color: '#2d6a4f',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    checkoutBtn: {
        padding: '10px 25px',
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '40px 20px',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '15px',
    },
    browseBtn: {
        marginTop: '15px',
        padding: '10px 25px',
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
    },
};

export default Cart;