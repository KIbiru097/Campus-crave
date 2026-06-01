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
                <div style={styles.emptyIcon}>📦</div>
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
            case 'confirmed': return '#2d6a4f';
            case 'preparing': return '#52b788';
            case 'ready': return '#1b4332';
            case 'delivered': return '#2d6a4f';
            case 'cancelled': return '#d8f3dc';
            default: return '#74c69d';
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>📋 My Orders</h2>
            <div style={styles.ordersList}>
                {orders.map((order) => (
                    <div key={order.id} style={styles.orderCard}>
                        <div style={styles.orderHeader}>
                            <h3>Order #{order.order_number}</h3>
                            <span style={{
                                ...styles.statusBadge,
                                backgroundColor: getStatusColor(order.order_status),
                                color: order.order_status?.toLowerCase() === 'cancelled' ? '#2d6a4f' : 'white'
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
        padding: '1rem',
    },
    title: {
        marginBottom: '1.5rem',
        color: '#2d6a4f',
        fontSize: '1.5rem',
    },
    ordersList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    orderCard: {
        backgroundColor: '#fffef7',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: '0 2px 8px rgba(45, 106, 79, 0.1)',
        border: '1px solid #d8f3dc',
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid #d8f3dc',
        flexWrap: 'wrap',
        gap: '8px',
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 'bold',
    },
    orderDetails: {
        marginBottom: '12px',
        fontSize: '14px',
    },
    itemsSection: {
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #d8f3dc',
    },
    orderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
        fontSize: '13px',
    },
    browseBtn: {
        marginTop: '15px',
        padding: '10px 25px',
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '40px 20px',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '15px',
    },
};

export default Orders;