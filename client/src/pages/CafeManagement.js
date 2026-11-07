import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_MENU_ITEMS, GET_CAFE_ORDERS } from '../graphql/queries';
import { UPDATE_ORDER_STATUS, ASSIGN_DELIVERY } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// GraphQL Queries and Mutations
const GET_MY_CAFES = gql`
    query GetMyCafes {
        getMyCafes {
            id
            name
            description
            location
            contact_phone
            is_active
            created_at
        }
    }
`;

const CREATE_MENU_ITEM = gql`
    mutation CreateMenuItem($input: CreateMenuItemInput!) {
        createMenuItem(input: $input) {
            id
            name
            description
            price
            category
            status
            created_at
        }
    }
`;

const UPDATE_MENU_ITEM = gql`
    mutation UpdateMenuItem($id: ID!, $input: UpdateMenuItemInput!) {
        updateMenuItem(id: $id, input: $input) {
            id
            name
            description
            price
            category
            status
            updated_at
        }
    }
`;

const DELETE_MENU_ITEM = gql`
    mutation DeleteMenuItem($id: ID!) {
        deleteMenuItem(id: $id)
    }
`;

const GET_DELIVERY_DRIVERS = gql`
    query GetDeliveryDrivers {
        users(role: "delivery") {
            id
            username
            phone
        }
    }
`;

const CafeManagement = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedCafe, setSelectedCafe] = useState(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('menu');
    const [orderFilter, setOrderFilter] = useState('ALL');
    const [selectedDrivers, setSelectedDrivers] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newItem, setNewItem] = useState({
        name: '',
        price: '',
        category: '',
        description: ''
    });

    // Queries
    const { data: myCafesData, loading: cafesLoading, refetch: refetchCafes } = useQuery(GET_MY_CAFES);
    const { data: menuData, loading: menuLoading, refetch: refetchMenu } = useQuery(GET_MENU_ITEMS, {
        variables: { cafeId: selectedCafe },
        skip: !selectedCafe,
    });
    const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useQuery(GET_CAFE_ORDERS, {
        variables: {
            cafeId: selectedCafe,
            status: orderFilter === 'ALL' ? null : orderFilter,
        },
        skip: !selectedCafe,
        pollInterval: 12000,
    });
    const { data: driversData } = useQuery(GET_DELIVERY_DRIVERS, {
        skip: !selectedCafe,
    });

    // Mutations
    const [createMenuItem] = useMutation(CREATE_MENU_ITEM);
    const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM);
    const [deleteMenuItem] = useMutation(DELETE_MENU_ITEM);
    const [updateOrderStatus, { loading: updatingOrder }] = useMutation(UPDATE_ORDER_STATUS);
    const [assignDelivery, { loading: assigningDelivery }] = useMutation(ASSIGN_DELIVERY);

    // Auto-select first cafe if only one
    useEffect(() => {
        if (myCafesData?.getMyCafes && myCafesData.getMyCafes.length === 1 && !selectedCafe) {
            setSelectedCafe(myCafesData.getMyCafes[0].id);
        }
    }, [myCafesData]);

    const handleUpdateStatus = async (orderId, orderNumber, newStatus) => {
        try {
            await updateOrderStatus({
                variables: {
                    input: {
                        order_id: parseInt(orderId),
                        status: newStatus,
                    },
                },
            });
            toast.success(`Order #${orderNumber} marked as ${newStatus}!`);
            refetchOrders();
        } catch (err) {
            toast.error(err.message || 'Failed to update order status');
        }
    };

    const handleAssignDeliveryDriver = async (orderId, orderNumber) => {
        const driverId = selectedDrivers[orderId];
        if (!driverId) {
            toast.warning('Please select a delivery driver from the dropdown first');
            return;
        }
        try {
            await assignDelivery({
                variables: {
                    orderId: String(orderId),
                    deliveryPersonId: String(driverId),
                },
            });
            toast.success(`Driver dispatched for Order #${orderNumber}!`);
            refetchOrders();
        } catch (err) {
            toast.error(err.message || 'Failed to assign driver');
        }
    };

    // Clear messages after 3 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    if (!user || (user.role !== 'owner' && user.role !== 'staff' && user.role !== 'admin')) {
        return (
            <div style={styles.unauthorized}>
                <h2>Access Denied</h2>
                <p>Only cafe owners and staff can access this page.</p>
            </div>
        );
    }

    const myCafes = myCafesData?.getMyCafes || [];
    const menuItems = menuData?.menuItems || [];
    const selectedCafeData = myCafes.find(c => c.id === selectedCafe);
    const cafeOrders = ordersData?.cafeOrders || [];
    const drivers = driversData?.users || [];

    const handleAddItem = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedCafe) {
            setError('Please select a cafe first');
            return;
        }

        if (!newItem.name || !newItem.price || !newItem.category) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const { data } = await createMenuItem({
                variables: {
                    input: {
                        cafe_id: parseInt(selectedCafe),
                        name: newItem.name,
                        description: newItem.description || '',
                        price: parseFloat(newItem.price),
                        category: newItem.category,
                    }
                }
            });

            if (data?.createMenuItem) {
                setSuccess('Menu item added successfully!');
                refetchMenu();
                setShowAddItem(false);
                setNewItem({ name: '', price: '', category: '', description: '' });
            }
        } catch (err) {
            console.error('Add item error:', err);
            setError(err.message || 'Failed to add menu item');
        }
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!editingItem) return;

        try {
            const { data } = await updateMenuItem({
                variables: {
                    id: editingItem.id,
                    input: {
                        name: editingItem.name,
                        description: editingItem.description || '',
                        price: parseFloat(editingItem.price),
                        category: editingItem.category,
                    }
                }
            });

            if (data?.updateMenuItem) {
                setSuccess('Menu item updated successfully!');
                refetchMenu();
                setEditingItem(null);
            }
        } catch (err) {
            console.error('Update item error:', err);
            setError(err.message || 'Failed to update menu item');
        }
    };

    const handleDeleteItem = async (itemId) => {
        setError('');
        setSuccess('');

        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                const { data } = await deleteMenuItem({
                    variables: { id: itemId }
                });

                if (data?.deleteMenuItem) {
                    setSuccess('Menu item deleted successfully!');
                    refetchMenu();
                }
            } catch (err) {
                console.error('Delete item error:', err);
                setError(err.message || 'Failed to delete menu item');
            }
        }
    };

    const handleInputChange = (e) => {
        setNewItem({
            ...newItem,
            [e.target.name]: e.target.value
        });
    };

    const handleEditChange = (e) => {
        setEditingItem({
            ...editingItem,
            [e.target.name]: e.target.value
        });
    };

    if (cafesLoading) {
        return <div style={styles.loading}>Loading your cafes...</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🍽️ Cafe Management</h1>
            <p style={styles.subtitle}>Manage your cafes, menu items, and orders</p>

            {/* Error/Success Messages */}
            {error && <div style={styles.errorMessage}>{error}</div>}
            {success && <div style={styles.successMessage}>{success}</div>}

            {/* Cafe Selection Section */}
            <div style={styles.cafeSelector}>
                <label style={styles.cafeSelectorLabel}>Select Cafe:</label>
                <select
                    value={selectedCafe || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCafe(val ? parseInt(val) : null);
                    }}
                    style={styles.cafeSelect}
                >
                    <option value="">-- Choose a cafe --</option>
                    {myCafes.map(cafe => (
                        <option key={cafe.id} value={cafe.id}>
                            {cafe.name} {!cafe.is_active && '(Closed)'}
                        </option>
                    ))}
                </select>
                {myCafes.length === 0 && (
                    <p style={styles.warning}>You are not assigned to any cafe. Contact admin.</p>
                )}
            </div>

            {selectedCafe && selectedCafeData && (
                <div style={styles.content}>
                    {/* Cafe Info Card */}
                    <div style={styles.cafeInfoCard}>
                        <h2>{selectedCafeData.name}</h2>
                        <p>📍 {selectedCafeData.location}</p>
                        <p>📞 {selectedCafeData.contact_phone || 'No phone'}</p>
                        <span style={selectedCafeData.is_active ? styles.openBadge : styles.closedBadge}>
                            {selectedCafeData.is_active ? '🟢 Open' : '🔴 Closed'}
                        </span>
                    </div>

                    {/* Tabs */}
                    <div style={styles.tabs}>
                        <button
                            style={{ ...styles.tab, ...(activeTab === 'menu' && styles.activeTab) }}
                            onClick={() => setActiveTab('menu')}
                        >
                            📝 Menu Items
                        </button>
                        <button
                            style={{ ...styles.tab, ...(activeTab === 'orders' && styles.activeTab) }}
                            onClick={() => setActiveTab('orders')}
                        >
                            📋 Orders
                        </button>
                        <button
                            style={{ ...styles.tab, ...(activeTab === 'stats' && styles.activeTab) }}
                            onClick={() => setActiveTab('stats')}
                        >
                            📊 Statistics
                        </button>
                    </div>

                    {/* Menu Items Tab */}
                    {activeTab === 'menu' && (
                        <div>
                            <div style={styles.sectionHeader}>
                                <h3>Menu Items</h3>
                                <button style={styles.addBtn} onClick={() => setShowAddItem(true)}>
                                    + Add New Item
                                </button>
                            </div>

                            {/* Add/Edit Modal */}
                            {(showAddItem || editingItem) && (
                                <div style={styles.modal}>
                                    <div style={styles.modalContent}>
                                        <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                                        <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Item Name *"
                                                value={editingItem ? editingItem.name : newItem.name}
                                                onChange={editingItem ? handleEditChange : handleInputChange}
                                                style={styles.input}
                                                required
                                            />
                                            <input
                                                type="number"
                                                name="price"
                                                placeholder="Price (ETB) *"
                                                value={editingItem ? editingItem.price : newItem.price}
                                                onChange={editingItem ? handleEditChange : handleInputChange}
                                                style={styles.input}
                                                required
                                            />
                                            <input
                                                type="text"
                                                name="category"
                                                placeholder="Category *"
                                                value={editingItem ? editingItem.category : newItem.category}
                                                onChange={editingItem ? handleEditChange : handleInputChange}
                                                style={styles.input}
                                                required
                                            />
                                            <textarea
                                                name="description"
                                                placeholder="Description (optional)"
                                                value={editingItem ? editingItem.description : newItem.description}
                                                onChange={editingItem ? handleEditChange : handleInputChange}
                                                style={styles.textarea}
                                                rows="3"
                                            />
                                            <div style={styles.modalActions}>
                                                <button
                                                    type="button"
                                                    style={styles.cancelBtn}
                                                    onClick={() => {
                                                        setShowAddItem(false);
                                                        setEditingItem(null);
                                                        setError('');
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button type="submit" style={styles.saveBtn}>
                                                    {editingItem ? 'Update Item' : 'Add Item'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Menu Items List */}
                            {menuLoading ? (
                                <div style={styles.loading}>Loading menu...</div>
                            ) : (
                                <div style={styles.menuGrid}>
                                    {menuItems.filter(item => !item.deleted_at).map(item => (
                                        <div key={item.id} style={styles.menuCard}>
                                            <div style={styles.menuInfo}>
                                                <h4>{item.name}</h4>
                                                <p>{item.description || 'No description'}</p>
                                                <div>
                                                    <span style={styles.category}>{item.category}</span>
                                                    <span style={styles.price}>ETB {item.price}</span>
                                                </div>
                                            </div>
                                            <div style={styles.menuActions}>
                                                <button
                                                    style={styles.editBtn}
                                                    onClick={() => setEditingItem(item)}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    style={styles.deleteBtn}
                                                    onClick={() => handleDeleteItem(item.id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {menuItems.length === 0 && (
                                        <div style={styles.emptyMenu}>
                                            <p>No menu items yet. Click "Add New Item" to create your first menu item!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div style={styles.ordersSection}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>📋 Incoming Orders</h3>
                                    <p style={{ margin: '4px 0 0 0', color: '#6B5E52', fontSize: '14px' }}>
                                        Manage student orders, advance kitchen status, and dispatch delivery drivers.
                                    </p>
                                </div>
                                <button
                                    onClick={() => refetchOrders()}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#FFF3E0',
                                        color: '#E8532B',
                                        border: '1px solid #FFE0C4',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    🔄 Refresh Orders
                                </button>
                            </div>

                            {/* Status Filter Tabs */}
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
                                {[
                                    { key: 'ALL', label: 'All Orders' },
                                    { key: 'CONFIRMED', label: 'Confirmed' },
                                    { key: 'PREPARING', label: 'Preparing' },
                                    { key: 'READY', label: 'Ready' },
                                    { key: 'ON_THE_WAY', label: 'On The Way' },
                                    { key: 'DELIVERED', label: 'Delivered' },
                                    { key: 'CANCELLED', label: 'Cancelled' },
                                ].map((tab) => {
                                    const count = tab.key === 'ALL'
                                        ? cafeOrders.length
                                        : cafeOrders.filter(o => o.order_status === tab.key).length;
                                    const active = orderFilter === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => setOrderFilter(tab.key)}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '20px',
                                                border: active ? '1.5px solid #E8532B' : '1px solid #e5e7eb',
                                                backgroundColor: active ? '#E8532B' : '#fff',
                                                color: active ? '#fff' : '#4b5563',
                                                fontSize: '13.5px',
                                                fontWeight: active ? 600 : 500,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {tab.label}
                                            <span
                                                style={{
                                                    fontSize: '11px',
                                                    padding: '2px 6px',
                                                    borderRadius: '10px',
                                                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                                                    color: active ? '#fff' : '#6b7280',
                                                }}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Orders Content */}
                            {ordersLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
                                    ))}
                                </div>
                            ) : cafeOrders.length === 0 ? (
                                <div style={styles.emptyOrders}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
                                    <h4 style={{ margin: '0 0 6px 0', color: '#374151', fontSize: '18px' }}>
                                        {orderFilter === 'ALL' ? 'No orders yet for this cafe' : `No ${orderFilter.toLowerCase()} orders`}
                                    </h4>
                                    <p style={{ margin: 0, color: '#6B5E52', fontSize: '14px' }}>
                                        New orders from students will appear here automatically in real time.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {cafeOrders.map((order) => {
                                        const status = order.order_status;
                                        const isDelivery = Boolean(order.delivery_address);
                                        const badgeColor =
                                            status === 'CONFIRMED' ? { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' } :
                                            status === 'PREPARING' ? { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' } :
                                            status === 'READY' ? { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' } :
                                            status === 'ON_THE_WAY' ? { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' } :
                                            status === 'DELIVERED' ? { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' } :
                                            status === 'CANCELLED' ? { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' } :
                                            { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };

                                        return (
                                            <div
                                                key={order.id}
                                                style={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '14px',
                                                    padding: '20px',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                    transition: 'box-shadow 0.2s ease',
                                                }}
                                            >
                                                {/* Order Top Bar */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '17px', fontWeight: 'bold', color: '#111827' }}>
                                                                Order #{order.order_number}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    padding: '4px 10px',
                                                                    borderRadius: '12px',
                                                                    backgroundColor: badgeColor.bg,
                                                                    color: badgeColor.text,
                                                                    border: `1px solid ${badgeColor.border}`,
                                                                }}
                                                            >
                                                                {status}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: 500,
                                                                    padding: '4px 8px',
                                                                    borderRadius: '8px',
                                                                    backgroundColor: isDelivery ? '#FEF3C7' : '#F3F4F6',
                                                                    color: isDelivery ? '#92400E' : '#4B5563',
                                                                }}
                                                            >
                                                                {isDelivery ? '🚚 Delivery' : '🏪 Pickup'}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#6B5E52', marginTop: '4px' }}>
                                                            Placed: {new Date(parseInt(order.created_at) || order.created_at).toLocaleString()}
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#E8532B' }}>
                                                            ETB {order.total_amount?.toFixed(2) || '0.00'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                                            Payment: {order.payment_type || 'Cash'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Student & Delivery Contact */}
                                                <div
                                                    style={{
                                                        backgroundColor: '#FFFDF9',
                                                        border: '1px solid #FFE0C4',
                                                        borderRadius: '10px',
                                                        padding: '12px 16px',
                                                        marginBottom: '14px',
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                                        gap: '10px',
                                                        fontSize: '13.5px',
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#374151' }}>
                                                            👤 Student: {order.student?.full_name || 'Campus Student'}
                                                        </div>
                                                        {order.student?.phone_number && (
                                                            <div style={{ marginTop: '3px' }}>
                                                                📞 Phone:{' '}
                                                                <a
                                                                    href={`tel:${order.student.phone_number}`}
                                                                    style={{ color: '#E8532B', fontWeight: 500, textDecoration: 'none' }}
                                                                >
                                                                    {order.student.phone_number}
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {isDelivery ? (
                                                            <div style={{ color: '#92400E' }}>
                                                                📍 <strong>Delivery Address:</strong> {order.delivery_address}
                                                            </div>
                                                        ) : (
                                                            <div style={{ color: '#4B5563' }}>
                                                                🏪 <strong>Fulfillment:</strong> Counter Pickup
                                                            </div>
                                                        )}
                                                        {order.special_instructions && (
                                                            <div style={{ color: '#B45309', marginTop: '3px', fontStyle: 'italic' }}>
                                                                📝 Instructions: "{order.special_instructions}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Items List */}
                                                <div style={{ marginBottom: '16px' }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Order Items ({order.items?.length || 0})
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {order.items?.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '6px 10px',
                                                                    backgroundColor: '#F9FAFB',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                }}
                                                            >
                                                                <span style={{ color: '#1F2937' }}>
                                                                    <strong>{item.quantity}x</strong> {item.menu_item?.name || 'Item'}
                                                                </span>
                                                                <span style={{ fontWeight: 600, color: '#4B5563' }}>
                                                                    ETB {(item.subtotal || item.quantity * item.unit_price || 0).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Action Bar */}
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
                                                    {/* Confirmed / Pending -> Start Preparing */}
                                                    {(status === 'CONFIRMED' || status === 'PENDING') && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, order.order_number, 'PREPARING')}
                                                            disabled={updatingOrder}
                                                            style={{
                                                                padding: '10px 18px',
                                                                backgroundColor: '#F59E0B',
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
                                                            👨‍🍳 Start Preparing
                                                        </button>
                                                    )}

                                                    {/* Preparing -> Mark Ready */}
                                                    {status === 'PREPARING' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, order.order_number, 'READY')}
                                                            disabled={updatingOrder}
                                                            style={{
                                                                padding: '10px 18px',
                                                                backgroundColor: '#10B981',
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
                                                            🔔 Mark Order Ready
                                                        </button>
                                                    )}

                                                    {/* Ready -> Dispatch or Pickup */}
                                                    {status === 'READY' && (
                                                        <>
                                                            {isDelivery && (
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    <select
                                                                        value={selectedDrivers[order.id] || ''}
                                                                        onChange={(e) => setSelectedDrivers({ ...selectedDrivers, [order.id]: e.target.value })}
                                                                        style={{
                                                                            padding: '9px 12px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #D1D5DB',
                                                                            fontSize: '13.5px',
                                                                            backgroundColor: '#fff',
                                                                            minWidth: '200px',
                                                                        }}
                                                                    >
                                                                        <option value="">Select Delivery Driver...</option>
                                                                        {drivers.map((d) => (
                                                                            <option key={d.id} value={d.id}>
                                                                                🚚 {d.username} ({d.phone || 'Driver'})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => handleAssignDeliveryDriver(order.id, order.order_number)}
                                                                        disabled={assigningDelivery}
                                                                        style={{
                                                                            padding: '10px 18px',
                                                                            backgroundColor: '#8B5CF6',
                                                                            color: '#fff',
                                                                            border: 'none',
                                                                            borderRadius: '8px',
                                                                            fontWeight: 600,
                                                                            fontSize: '14px',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        🚀 Dispatch Driver
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, order.order_number, 'DELIVERED')}
                                                                disabled={updatingOrder}
                                                                style={{
                                                                    padding: '10px 18px',
                                                                    backgroundColor: '#059669',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    fontWeight: 600,
                                                                    fontSize: '14px',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                ✅ Complete Pickup
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* On the way info */}
                                                    {status === 'ON_THE_WAY' && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '14px', color: '#6D28D9', fontWeight: 500 }}>
                                                                🚚 In Transit with Driver
                                                            </span>
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, order.order_number, 'DELIVERED')}
                                                                disabled={updatingOrder}
                                                                style={{
                                                                    padding: '8px 14px',
                                                                    backgroundColor: '#059669',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    fontWeight: 600,
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                Mark Delivered
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Cancel action if not completed */}
                                                    {['PENDING', 'CONFIRMED', 'PREPARING'].includes(status) && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Are you sure you want to cancel order #${order.order_number}?`)) {
                                                                    handleUpdateStatus(order.id, order.order_number, 'CANCELLED');
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '8px 14px',
                                                                backgroundColor: 'transparent',
                                                                color: '#DC2626',
                                                                border: '1px solid #FECACA',
                                                                borderRadius: '8px',
                                                                fontWeight: 500,
                                                                fontSize: '13px',
                                                                cursor: 'pointer',
                                                                marginLeft: 'auto',
                                                            }}
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Statistics Tab */}
                    {activeTab === 'stats' && (
                        <div style={styles.statsSection}>
                            <h3>Cafe Statistics</h3>
                            <div style={styles.statsGrid}>
                                <div style={styles.statCard}>
                                    <div style={styles.statNumber}>{menuItems.length}</div>
                                    <div style={styles.statLabel}>Total Menu Items</div>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statNumber}>
                                        {cafeOrders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(o.order_status)).length}
                                    </div>
                                    <div style={styles.statLabel}>Active Orders</div>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statNumber}>
                                        {cafeOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.order_status)).length}
                                    </div>
                                    <div style={styles.statLabel}>Completed Orders</div>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statNumber}>
                                        ETB {cafeOrders.filter(o => o.order_status !== 'CANCELLED').reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(0)}
                                    </div>
                                    <div style={styles.statLabel}>Total Cafe Revenue</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
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
        color: '#E8532B',
        marginBottom: '5px',
        fontSize: '28px',
    },
    subtitle: {
        color: '#6B5E52',
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
    errorMessage: {
        backgroundColor: '#fdecea',
        color: '#e74c3c',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    cafeSelector: {
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#FFF3E0',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
    },
    cafeSelectorLabel: {
        fontWeight: 'bold',
        color: '#E8532B',
    },
    cafeSelect: {
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #FFE0C4',
        fontSize: '14px',
        minWidth: '250px',
        backgroundColor: 'white',
    },
    warning: {
        color: '#e74c3c',
        marginTop: '10px',
        width: '100%',
    },
    cafeInfoCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '25px',
        border: '1px solid #FFE0C4',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    openBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        backgroundColor: '#27ae60',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
    },
    closedBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        backgroundColor: '#95a5a6',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
    },
    tabs: {
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        borderBottom: '2px solid #FFE0C4',
        paddingBottom: '10px',
    },
    tab: {
        padding: '10px 20px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'all 0.3s',
    },
    activeTab: {
        backgroundColor: '#FF7A3D',
        color: 'white',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px',
    },
    addBtn: {
        padding: '10px 20px',
        backgroundColor: '#FF7A3D',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    menuGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '16px',
    },
    menuCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid #FFE0C4',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    menuInfo: {
        flex: 1,
    },
    category: {
        display: 'inline-block',
        padding: '2px 8px',
        backgroundColor: '#FFE0C4',
        borderRadius: '12px',
        fontSize: '11px',
        marginRight: '8px',
    },
    price: {
        fontWeight: 'bold',
        color: '#E8532B',
    },
    menuActions: {
        display: 'flex',
        gap: '8px',
    },
    editBtn: {
        padding: '6px 12px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    deleteBtn: {
        padding: '6px 12px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
    },
    input: {
        width: '100%',
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #FFE0C4',
        borderRadius: '8px',
        fontSize: '14px',
    },
    textarea: {
        width: '100%',
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #FFE0C4',
        borderRadius: '8px',
        resize: 'vertical',
        fontSize: '14px',
    },
    modalActions: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        padding: '8px 20px',
        backgroundColor: '#95a5a6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '8px 20px',
        backgroundColor: '#FF7A3D',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    emptyMenu: {
        textAlign: 'center',
        padding: '40px',
        color: '#666',
        backgroundColor: '#FFFDF9',
        borderRadius: '12px',
    },
    ordersSection: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
    },
    emptyOrders: {
        textAlign: 'center',
        padding: '40px',
        color: '#666',
    },
    statsSection: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    statCard: {
        backgroundColor: '#FFF3E0',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#E8532B',
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
        marginTop: '5px',
    },
};

export default CafeManagement;