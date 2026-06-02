import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_MY_DELIVERIES = gql`
    query GetMyDeliveries($status: String) {
        myDeliveries(status: $status) {
            id
            order_id
            status
            pickup_time
            delivered_time
            delivery_address
            notes
            created_at
            updated_at
            order {
                id
                order_number
                total_amount
                cafe {
                    name
                    location
                    contact_phone
                }
                student {
                    full_name
                    phone_number
                }
                items {
                    quantity
                    menu_item {
                        name
                    }
                }
            }
        }
    }
`;

const UPDATE_DELIVERY_STATUS = gql`
    mutation UpdateDeliveryStatus($deliveryId: ID!, $status: String!) {
        updateDeliveryStatus(delivery_id: $deliveryId, status: $status) {
            id
            status
            pickup_time
            delivered_time
        }
    }
`;

const DeliveryDashboard = () => {
    const { user } = useAuth();
    const [filterStatus, setFilterStatus] = useState(null);
    const [updating, setUpdating] = useState(false);

    const { data, loading, error, refetch } = useQuery(GET_MY_DELIVERIES, {
        variables: { status: filterStatus },
    });

    const [updateDeliveryStatus] = useMutation(UPDATE_DELIVERY_STATUS);

    if (!user || user.role !== 'delivery') {
        return (
            <div style={styles.unauthorized}>
                <h2>Access Denied</h2>
                <p>Only delivery personnel can access this page.</p>
            </div>
        );
    }

    const deliveries = data?.myDeliveries || [];

    const handleStatusUpdate = async (deliveryId, newStatus) => {
        setUpdating(true);
        try {
            await updateDeliveryStatus({
                variables: { deliveryId, status: newStatus }
            });
            refetch();
            alert(`Delivery status updated to ${newStatus}`);
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ASSIGNED': return '#f39c12';
            case 'PICKED_UP': return '#3498db';
            case 'ON_THE_WAY': return '#9b59b6';
            case 'DELIVERED': return '#27ae60';
            case 'FAILED': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ASSIGNED': return '📋';
            case 'PICKED_UP': return '📦';
            case 'ON_THE_WAY': return '🚚';
            case 'DELIVERED': return '✅';
            case 'FAILED': return '❌';
            default: return '⏳';
        }
    };

    const availableActions = (status) => {
        switch (status) {
            case 'ASSIGNED':
                return { next: 'PICKED_UP', label: 'Mark Picked Up', color: '#3498db' };
            case 'PICKED_UP':
                return { next: 'ON_THE_WAY', label: 'Start Delivery', color: '#9b59b6' };
            case 'ON_THE_WAY':
                return { next: 'DELIVERED', label: 'Mark Delivered', color: '#27ae60' };
            default:
                return null;
        }
    };

    if (loading) return <div style={styles.loading}>Loading deliveries...</div>;
    if (error) return <div style={styles.error}>Error: {error.message}</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🚚 Delivery Dashboard</h1>
            <p style={styles.subtitle}>Manage your deliveries and update status</p>

            {/* Filter Section */}
            <div style={styles.filterSection}>
                <label>Filter by status:</label>
                <select 
                    value={filterStatus || ''} 
                    onChange={(e) => setFilterStatus(e.target.value || null)}
                    style={styles.filterSelect}
                >
                    <option value="">All Deliveries</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="ON_THE_WAY">On The Way</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="FAILED">Failed</option>
                </select>
                <button style={styles.refreshBtn} onClick={() => refetch()}>🔄 Refresh</button>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{deliveries.length}</div>
                    <div style={styles.statLabel}>Total Deliveries</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                        {deliveries.filter(d => d.status === 'ASSIGNED').length}
                    </div>
                    <div style={styles.statLabel}>Assigned</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                        {deliveries.filter(d => d.status === 'ON_THE_WAY').length}
                    </div>
                    <div style={styles.statLabel}>In Progress</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                        {deliveries.filter(d => d.status === 'DELIVERED').length}
                    </div>
                    <div style={styles.statLabel}>Completed</div>
                </div>
            </div>

            {/* Deliveries List */}
            {deliveries.length === 0 ? (
                <div style={styles.emptyContainer}>
                    <div style={styles.emptyIcon}>📭</div>
                    <h3>No deliveries assigned</h3>
                    <p>You don't have any delivery orders at the moment.</p>
                </div>
            ) : (
                <div style={styles.deliveriesList}>
                    {deliveries.map((delivery) => {
                        const actions = availableActions(delivery.status);
                        return (
                            <div key={delivery.id} style={styles.deliveryCard}>
                                <div style={styles.deliveryHeader}>
                                    <div>
                                        <span style={styles.deliveryIcon}>{getStatusIcon(delivery.status)}</span>
                                        <span style={styles.orderNumber}>Order #{delivery.order?.order_number}</span>
                                    </div>
                                    <span style={{...styles.statusBadge, backgroundColor: getStatusColor(delivery.status)}}>
                                        {delivery.status}
                                    </span>
                                </div>

                                <div style={styles.deliveryContent}>
                                    <div style={styles.deliverySection}>
                                        <h4>🏪 Cafe Information</h4>
                                        <p><strong>Name:</strong> {delivery.order?.cafe?.name}</p>
                                        <p><strong>Location:</strong> {delivery.order?.cafe?.location}</p>
                                        <p><strong>Phone:</strong> {delivery.order?.cafe?.contact_phone || 'N/A'}</p>
                                    </div>

                                    <div style={styles.deliverySection}>
                                        <h4>👤 Customer Information</h4>
                                        <p><strong>Name:</strong> {delivery.order?.student?.full_name}</p>
                                        <p><strong>Phone:</strong> {delivery.order?.student?.phone_number || 'N/A'}</p>
                                        <p><strong>Delivery Address:</strong> {delivery.delivery_address || 'Pickup from cafe'}</p>
                                    </div>

                                    <div style={styles.deliverySection}>
                                        <h4>📦 Order Details</h4>
                                        <p><strong>Total Amount:</strong> ETB {delivery.order?.total_amount}</p>
                                        <p><strong>Items:</strong></p>
                                        <ul style={styles.itemsList}>
                                            {delivery.order?.items?.map((item, idx) => (
                                                <li key={idx}>{item.quantity}x {item.menu_item?.name}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {delivery.notes && (
                                        <div style={styles.deliverySection}>
                                            <h4>📝 Special Instructions</h4>
                                            <p>{delivery.notes}</p>
                                        </div>
                                    )}

                                    <div style={styles.deliverySection}>
                                        <h4>⏰ Timeline</h4>
                                        <p><strong>Assigned:</strong> {new Date(delivery.created_at).toLocaleString()}</p>
                                        {delivery.pickup_time && <p><strong>Picked Up:</strong> {new Date(delivery.pickup_time).toLocaleString()}</p>}
                                        {delivery.delivered_time && <p><strong>Delivered:</strong> {new Date(delivery.delivered_time).toLocaleString()}</p>}
                                    </div>
                                </div>

                                {actions && (
                                    <div style={styles.actionButtons}>
                                        <button
                                            style={{...styles.updateBtn, backgroundColor: actions.color}}
                                            onClick={() => handleStatusUpdate(delivery.id, actions.next)}
                                            disabled={updating}
                                        >
                                            {updating ? 'Updating...' : actions.label}
                                        </button>
                                        {delivery.status === 'ON_THE_WAY' && (
                                            <button
                                                style={styles.callBtn}
                                                onClick={() => window.location.href = `tel:${delivery.order?.student?.phone_number}`}
                                            >
                                                📞 Call Customer
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
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
        color: '#2d6a4f',
        marginBottom: '5px',
        fontSize: '28px',
    },
    subtitle: {
        color: '#52b788',
        marginBottom: '30px',
    },
    unauthorized: {
        textAlign: 'center',
        padding: '60px',
        color: '#e74c3c',
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#666',
    },
    error: {
        textAlign: 'center',
        padding: '40px',
        color: '#e74c3c',
    },
    filterSection: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        marginBottom: '25px',
        flexWrap: 'wrap',
        padding: '15px',
        backgroundColor: '#f0fdf4',
        borderRadius: '12px',
    },
    filterSelect: {
        padding: '8px 15px',
        borderRadius: '8px',
        border: '1px solid #d8f3dc',
        fontSize: '14px',
        minWidth: '150px',
    },
    refreshBtn: {
        padding: '8px 20px',
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '30px',
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '15px',
        textAlign: 'center',
        border: '1px solid #d8f3dc',
    },
    statNumber: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#2d6a4f',
    },
    statLabel: {
        fontSize: '12px',
        color: '#666',
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '60px',
        backgroundColor: 'white',
        borderRadius: '16px',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '15px',
    },
    deliveriesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    deliveryCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #d8f3dc',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    deliveryHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '15px',
        borderBottom: '1px solid #d8f3dc',
        flexWrap: 'wrap',
        gap: '10px',
    },
    deliveryIcon: {
        fontSize: '20px',
        marginRight: '10px',
    },
    orderNumber: {
        fontWeight: 'bold',
        fontSize: '16px',
    },
    statusBadge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
    },
    deliveryContent: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
    },
    deliverySection: {
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
    },
    itemsList: {
        marginLeft: '20px',
        marginTop: '5px',
    },
    actionButtons: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid #d8f3dc',
    },
    updateBtn: {
        padding: '8px 20px',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    callBtn: {
        padding: '8px 20px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
};

export default DeliveryDashboard;