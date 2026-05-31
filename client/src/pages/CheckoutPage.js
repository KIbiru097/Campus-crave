import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CART } from '../graphql/queries';
import { CREATE_ORDER } from '../graphql/mutations';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [paymentRules, setPaymentRules] = useState(null);
    
    const { loading, error, data, refetch } = useQuery(GET_CART);
    const [createOrder] = useMutation(CREATE_ORDER);

    const cart = data?.myCart;
    const items = cart?.items || [];
    const total = cart?.total || 0;
    const itemCount = cart?.item_count || 0;

    // Get payment rules based on item count
    const getPaymentRules = (count) => {
        if (count >= 4 && count <= 6) {
            return {
                allowedMethods: ['Online'],
                requiredOnline: true,
                message: 'Orders with 4-6 items require full online payment',
                partialAllowed: false,
                partialPercentage: 0
            };
        } else if (count >= 1 && count <= 3) {
            return {
                allowedMethods: ['Online', 'COD'],
                requiredOnline: false,
                message: 'You can choose between online payment or cash on delivery',
                partialAllowed: true,
                partialPercentage: 50
            };
        } else {
            return {
                allowedMethods: [],
                requiredOnline: false,
                message: 'Invalid order quantity. Maximum 6 items.',
                partialAllowed: false
            };
        }
    };

    useEffect(() => {
        const rules = getPaymentRules(itemCount);
        setPaymentRules(rules);
        if (rules.allowedMethods.length === 1 && rules.allowedMethods[0] === 'Online') {
            setPaymentMethod('Online');
        }
    }, [itemCount]);

    const deliveryFee = total > 150 ? 0 : 30;
    const serviceFee = 10;
    const grandTotal = total + deliveryFee + serviceFee;

    const handlePlaceOrder = async () => {
        // Validate payment method
        if (paymentRules?.requiredOnline && paymentMethod !== 'Online') {
            setPaymentError('This order requires online payment. Cash on delivery is not available.');
            return;
        }

        if (!paymentRules?.allowedMethods.includes(paymentMethod)) {
            setPaymentError('Payment method not available for this order.');
            return;
        }

        if (paymentMethod === 'COD' && !deliveryAddress) {
            setPaymentError('Please enter your delivery address for COD orders.');
            return;
        }

        setPaymentError('');
        setProcessing(true);

        try {
            const cafeId = items[0]?.menu_item?.cafe_id || 1;

            const { data: orderData } = await createOrder({
                variables: {
                    input: {
                        cafe_id: cafeId,
                        payment_type: paymentMethod === 'COD' ? 'COD' : 'Online',
                        special_instructions: specialInstructions || null
                    }
                }
            });

            if (orderData?.createOrder) {
                const order = orderData.createOrder;

                if (paymentMethod === 'COD') {
                    // Show success and redirect to orders
                    alert(`✅ Order placed successfully!\n\nOrder #: ${order.order_number}\nTotal: ETB ${grandTotal}\nPayment: Cash on Delivery\nDelivery Address: ${deliveryAddress}\n\nYour order will be delivered within 30-45 minutes.`);
                    navigate('/orders');
                } else {
                    // For online payment, calculate payment amount
                    let paymentAmount = grandTotal;
                    let paymentPercentage = 100;
                    
                    if (itemCount <= 3 && paymentRules?.partialAllowed) {
                        paymentAmount = grandTotal * 0.5;
                        paymentPercentage = 50;
                    }
                    
                    // Store order details for payment
                    sessionStorage.setItem('pendingOrder', JSON.stringify({
                        orderId: order.id,
                        orderNumber: order.order_number,
                        total: grandTotal,
                        itemCount: itemCount,
                        deliveryAddress: deliveryAddress
                    }));
                    
                    // Redirect to payment page
                    navigate(`/payment?orderId=${order.id}&amount=${paymentAmount}&paymentPercentage=${paymentPercentage}&totalAmount=${grandTotal}`);
                }
            }
        } catch (err) {
            console.error('Order error:', err);
            setPaymentError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="loading">Loading checkout...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;
    if (items.length === 0) {
        navigate('/cart');
        return null;
    }

    const deliveryOptions = [
        { label: 'Dormitory', value: 'Dormitory Building' },
        { label: 'Library Area', value: 'Library Complex' },
        { label: 'Academic Building', value: 'Academic Block' },
        { label: 'Cafe Pickup', value: 'Pickup from Cafe' },
    ];

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Checkout</h2>
            
            <div style={styles.checkoutGrid}>
                {/* Left Column - Order Summary */}
                <div style={styles.orderSummary}>
                    <h3>Order Summary</h3>
                    <div style={styles.itemsList}>
                        {items.map((item) => (
                            <div key={item.id} style={styles.checkoutItem}>
                                <div>
                                    <span style={styles.itemQuantity}>{item.quantity}x</span>
                                    <span style={styles.itemName}>{item.menu_item?.name}</span>
                                </div>
                                <span>ETB {item.quantity * item.unit_price}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div style={styles.priceDetails}>
                        <div style={styles.priceRow}>
                            <span>Subtotal ({itemCount} items):</span>
                            <span>ETB {total}</span>
                        </div>
                        <div style={styles.priceRow}>
                            <span>Delivery Fee:</span>
                            <span>ETB {deliveryFee} {deliveryFee === 0 && '(Free)'}</span>
                        </div>
                        <div style={styles.priceRow}>
                            <span>Service Fee:</span>
                            <span>ETB {serviceFee}</span>
                        </div>
                        <div style={styles.divider}></div>
                        <div style={styles.totalRow}>
                            <span>Total:</span>
                            <span>ETB {grandTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Checkout Form */}
                <div style={styles.checkoutForm}>
                    <h3>Delivery Information</h3>
                    
                    <div style={styles.formGroup}>
                        <label>Delivery Address *</label>
                        <select 
                            value={deliveryAddress} 
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            style={styles.select}
                        >
                            <option value="">Select delivery location</option>
                            {deliveryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.formGroup}>
                        <label>Special Instructions (optional)</label>
                        <textarea
                            placeholder="e.g., Extra napkins, no onions, call on arrival..."
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            style={styles.textarea}
                            rows="3"
                        />
                    </div>

                    <div style={styles.paymentSection}>
                        <h3>Payment Method</h3>
                        
                        {paymentRules?.allowedMethods.includes('Online') && (
                            <label style={styles.paymentOption}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="Online"
                                    checked={paymentMethod === 'Online'}
                                    onChange={() => setPaymentMethod('Online')}
                                />
                                <div>
                                    <strong>💳 Online Payment</strong>
                                    {paymentRules.partialAllowed && (
                                        <small> (50% now, 50% on delivery)</small>
                                    )}
                                </div>
                            </label>
                        )}
                        
                        {paymentRules?.allowedMethods.includes('COD') && (
                            <label style={styles.paymentOption}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={() => setPaymentMethod('COD')}
                                />
                                <div>
                                    <strong>💵 Cash on Delivery</strong>
                                    <small> Pay when your order arrives</small>
                                </div>
                            </label>
                        )}
                        
                        {paymentError && <div style={styles.errorMessage}>{paymentError}</div>}
                        
                        <div style={styles.rulesBox}>
                            <small>📋 {paymentRules?.message}</small>
                            {itemCount >= 4 && (
                                <small style={styles.warning}>⚠️ Online payment required for 4+ items</small>
                            )}
                        </div>
                    </div>

                    <div style={styles.actions}>
                        <Link to="/cart">
                            <button style={styles.backBtn}>← Back to Cart</button>
                        </Link>
                        <button 
                            onClick={handlePlaceOrder} 
                            style={styles.placeOrderBtn}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : `Place Order • ETB ${grandTotal}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
    },
    title: {
        marginBottom: '30px',
        color: '#2c3e50',
    },
    checkoutGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
    },
    orderSummary: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    checkoutForm: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    itemsList: {
        marginBottom: '20px',
    },
    checkoutItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #eee',
    },
    itemQuantity: {
        fontWeight: 'bold',
        marginRight: '10px',
        color: '#667eea',
    },
    itemName: {
        color: '#333',
    },
    priceDetails: {
        marginTop: '15px',
    },
    priceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        fontSize: '14px',
        color: '#666',
    },
    divider: {
        height: '1px',
        backgroundColor: '#eee',
        margin: '10px 0',
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 'bold',
        color: '#333',
    },
    select: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '14px',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '14px',
        resize: 'vertical',
    },
    paymentSection: {
        marginBottom: '24px',
    },
    paymentOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        marginBottom: '10px',
        border: '1px solid #eee',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#f9f9f9',
    },
    rulesBox: {
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f0f7ff',
        borderRadius: '8px',
        fontSize: '12px',
    },
    warning: {
        color: '#e74c3c',
        display: 'block',
        marginTop: '5px',
    },
    errorMessage: {
        color: '#e74c3c',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#fdecea',
        borderRadius: '8px',
    },
    actions: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'flex-end',
        marginTop: '24px',
    },
    backBtn: {
        padding: '12px 24px',
        backgroundColor: '#95a5a6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    placeOrderBtn: {
        padding: '12px 32px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
    },
};

export default CheckoutPage;