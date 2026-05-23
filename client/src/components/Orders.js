import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_MY_ORDERS } from '../graphql/queries';

const Orders = () => {
    const { loading, error, data } = useQuery(GET_MY_ORDERS);

    if (loading) return <div className="loading">Loading orders...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    const orders = data?.myOrders || [];

    if (orders.length === 0) {
        return (
            <div style={styles.emptyContainer}>
                <h2>No Orders Yet</h2>
                <p>Start ordering from your favorite cafes!</p>
                <button onClick={() => window.location.href = '/'} style={styles.browseBtn}>
                    Browse Cafes
                </button>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return '#f39c12';
            case 'confirmed': return '#3498db';
            case 'preparing': return '#9b59b6';
            case 'ready': return '#1abc9c';
            case 'delivered': return '#27ae60';
            case 'cancelled': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>My Orders</h2>
            <div style={styles.ordersList}>
                {orders.map((order) => (
                    <div key={order.id} style={styles.orderCard}>
                        <div style={styles.orderHeader}>
                            <h3>Order #{order.order_number}</h3>
                            <span style={{
                                ...styles.statusBadge,
                                backgroundColor: getStatusColor(order.order_status)
                            }}>
                                {order.order_status}
                            </span>
                        </div>
                        <div style={styles.orderDetails}>
                            <p><strong>Cafe:</strong> {order.cafe?.name}</p>
                            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                            <p><strong>Total:</strong> ETB {order.total_amount}</p>
                        </div>
                        <div style={styles.itemsSection}>
                            <h4>Items:</h4>
                            {order.items?.map((item, idx) => (
                                <div key={idx} style={styles.orderItem}>
                                    <span>{item.quantity}x {item.menu_item?.name}</span>
                                    <span>ETB {item.unit_price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
    },
    title: {
        marginBottom: '20px',
        color: '#2c3e50',
    },
    ordersList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    orderCard: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #eee',
    },
    statusBadge: {
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
    },
    orderDetails: {
        marginBottom: '15px',
    },
    itemsSection: {
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #eee',
    },
    orderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '5px 0',
    },
    browseBtn: {
        marginTop: '20px',
        padding: '10px 25px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '60px',
    },
};

export default Orders;