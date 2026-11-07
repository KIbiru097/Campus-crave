import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GET_AVAILABLE_ORDERS } from '../graphql/queries';
import { ASSIGN_DELIVERY, UPDATE_DELIVERY_STATUS } from '../graphql/mutations';

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

const DeliveryDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [mainTab, setMainTab] = useState('assigned'); // 'assigned' | 'available'
    const [filterStatus, setFilterStatus] = useState(null);
    const [updating, setUpdating] = useState(false);

    const { data, loading, error, refetch } = useQuery(GET_MY_DELIVERIES, {
        variables: { status: filterStatus },
        pollInterval: 12000,
    });

    const { data: availableData, loading: availableLoading, refetch: refetchAvailable } = useQuery(GET_AVAILABLE_ORDERS, {
        pollInterval: 12000,
    });

    const [updateDeliveryStatus] = useMutation(UPDATE_DELIVERY_STATUS);
    const [assignDelivery, { loading: claimingDelivery }] = useMutation(ASSIGN_DELIVERY);

    if (!user || user.role !== 'delivery') {
        return (
            <div style={styles.unauthorized}>
                <h2>Access Denied</h2>
                <p>Only delivery personnel can access this page.</p>
            </div>
        );
    }

    const deliveries = data?.myDeliveries || [];
    const availableOrders = availableData?.availableOrders || [];

    const handleStatusUpdate = async (deliveryId, newStatus) => {
        setUpdating(true);
        try {
            await updateDeliveryStatus({
                variables: { deliveryId, status: newStatus }
            });
            refetch();
            toast.success(`Delivery status updated to ${newStatus}!`);
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error(err.message || 'Failed to update delivery status');
        } finally {
            setUpdating(false);
        }
    };

    const handleClaimOrder = async (orderId, orderNumber) => {
        try {
            await assignDelivery({
                variables: {
                    orderId: String(orderId),
                    deliveryPersonId: String(user.id),
                },
            });
            toast.success(`Order #${orderNumber} claimed! It is now in your active deliveries.`);
            refetch();
            refetchAvailable();
            setMainTab('assigned');
        } catch (err) {
            toast.error(err.message || 'Failed to claim delivery order');
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <div>
                    <h1 style={styles.title}>🚚 Delivery Dashboard</h1>
                    <p style={styles.subtitle}>Claim available orders and manage active campus deliveries</p>
                </div>
                <button
                    onClick={() => { refetch(); refetchAvailable(); }}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#FFF3E0',
                        color: '#E8532B',
                        border: '1px solid #FFE0C4',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    🔄 Refresh All
                </button>
            </div>

            {/* Dashboard Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
                <button
                    onClick={() => setMainTab('assigned')}
                    style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: mainTab === 'assigned' ? '#E8532B' : '#F3F4F6',
                        color: mainTab === 'assigned' ? '#fff' : '#4B5563',
                        fontWeight: 600,
                        fontSize: '14.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    📦 My Deliveries
                    <span style={{
                        fontSize: '12px',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        backgroundColor: mainTab === 'assigned' ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                        color: mainTab === 'assigned' ? '#fff' : '#374151',
                    }}>
                        {deliveries.length}
                    </span>
                </button>

                <button
                    onClick={() => setMainTab('available')}
                    style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: mainTab === 'available' ? '#E8532B' : '#F3F4F6',
                        color: mainTab === 'available' ? '#fff' : '#4B5563',
                        fontWeight: 600,
                        fontSize: '14.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    ⚡ Available to Claim
                    <span style={{
                        fontSize: '12px',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        backgroundColor: mainTab === 'available' ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                        color: mainTab === 'available' ? '#fff' : '#374151',
                    }}>
                        {availableOrders.length}
                    </span>
                </button>
            </div>

            {/* View 1: Available Orders to Claim */}
            {mainTab === 'available' && (
                <div>
                    {availableLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[1, 2].map((i) => (
                                <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />
                            ))}
                        </div>
                    ) : availableOrders.length === 0 ? (
                        <div style={styles.emptyContainer}>
                            <div style={styles.emptyIcon}>✨</div>
                            <h3>All caught up!</h3>
                            <p>There are no unassigned delivery orders right now. Check back in a few minutes.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {availableOrders.map((order) => (
                                <div
                                    key={order.id}
                                    style={{
                                        backgroundColor: '#fff',
                                        border: '1.5px solid #FFE0C4',
                                        borderRadius: '14px',
                                        padding: '20px',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                                        <div>
                                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>
                                                Order #{order.order_number}
                                            </span>
                                            <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                                                {order.order_status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#E8532B' }}>
                                            ETB {order.total_amount?.toFixed(2) || '0.00'}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                                        <div style={{ backgroundColor: '#FFFDF9', border: '1px solid #FFE0C4', borderRadius: '10px', padding: '12px' }}>
                                            <div style={{ fontWeight: 600, color: '#E8532B', marginBottom: '4px' }}>🏪 Pickup From:</div>
                                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{order.cafe?.name}</div>
                                            <div style={{ fontSize: '13px', color: '#6B5E52' }}>📍 {order.cafe?.location}</div>
                                            {order.cafe?.contact_phone && (
                                                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                                    📞 <a href={`tel:${order.cafe.contact_phone}`} style={{ color: '#E8532B', textDecoration: 'none' }}>{order.cafe.contact_phone}</a>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px' }}>
                                            <div style={{ fontWeight: 600, color: '#15803D', marginBottom: '4px' }}>📍 Deliver To:</div>
                                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{order.delivery_address || 'Campus Dorm'}</div>
                                            <div style={{ fontSize: '13px', color: '#4B5563' }}>👤 {order.student?.full_name || 'Student'}</div>
                                            {order.student?.phone_number && (
                                                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                                    📞 <a href={`tel:${order.student.phone_number}`} style={{ color: '#15803D', textDecoration: 'none' }}>{order.student.phone_number}</a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                                        <div style={{ fontSize: '13.5px', color: '#6B7280' }}>
                                            Items ({order.items?.length || 0}): {order.items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')}
                                        </div>
                                        <button
                                            onClick={() => handleClaimOrder(order.id, order.order_number)}
                                            disabled={claimingDelivery}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#E8532B',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}
                                        >
                                            ⚡ Claim This Delivery
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* View 2: Assigned Deliveries */}
            {mainTab === 'assigned' && (
                <>
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
        </>
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
        color: '#E8532B',
        marginBottom: '5px',
        fontSize: '28px',
    },
    subtitle: {
        color: '#6B5E52',
        marginBottom: '20px',
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
        backgroundColor: '#FFF3E0',
        borderRadius: '12px',
    },
    filterSelect: {
        padding: '8px 15px',
        borderRadius: '8px',
        border: '1px solid #FFE0C4',
        fontSize: '14px',
        minWidth: '150px',
    },
    refreshBtn: {
        padding: '8px 20px',
        backgroundColor: '#FF7A3D',
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
        border: '1px solid #FFE0C4',
    },
    statNumber: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#E8532B',
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
        border: '1px solid #FFE0C4',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    deliveryHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '15px',
        borderBottom: '1px solid #FFE0C4',
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
        backgroundColor: '#FFFDF9',
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
        borderTop: '1px solid #FFE0C4',
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