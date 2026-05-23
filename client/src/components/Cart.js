import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { GET_CART } from '../graphql/queries';
import { UPDATE_CART_ITEM, REMOVE_FROM_CART, CLEAR_CART, CREATE_ORDER } from '../graphql/mutations';

// Your computer's IP address for mobile access
const IP_ADDRESS = '192.168.1.15';

const Cart = () => {
    const navigate = useNavigate();
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

    const handleCheckout = async () => {
        const cart = data?.myCart;
        
        if (!cart?.items?.length) {
            alert('Your cart is empty');
            return;
        }

        // Get cafe ID from first item (or default to 1)
        const cafeId = cart.items[0]?.menu_item?.cafe_id || 1;

        try {
            const { data: orderData } = await createOrder({
                variables: {
                    input: {
                        cafe_id: cafeId,
                        payment_type: 'Online',
                        special_instructions: null
                    }
                }
            });
            
            if (orderData?.createOrder) {
                const order = orderData.createOrder;
                // Redirect to mock payment with the IP address
                window.location.href = `http://${IP_ADDRESS}:3000/mock-payment?tx_ref=MOCK-${order.id}-${Date.now()}&amount=${cart.total}&order_id=${order.id}`;
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Failed to create order: ' + err.message);
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
};

export default Cart;