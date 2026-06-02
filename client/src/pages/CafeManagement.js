import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_MENU_ITEMS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

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

const CafeManagement = () => {
    const { user } = useAuth();
    const [selectedCafe, setSelectedCafe] = useState(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('menu');
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

    // Mutations
    const [createMenuItem] = useMutation(CREATE_MENU_ITEM);
    const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM);
    const [deleteMenuItem] = useMutation(DELETE_MENU_ITEM);

    // Auto-select first cafe if only one
    useEffect(() => {
        if (myCafesData?.getMyCafes && myCafesData.getMyCafes.length === 1 && !selectedCafe) {
            setSelectedCafe(myCafesData.getMyCafes[0].id);
        }
    }, [myCafesData]);

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
                    onChange={(e) => setSelectedCafe(parseInt(e.target.value))}
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
                            <h3>Recent Orders</h3>
                            <div style={styles.emptyOrders}>
                                <p>No orders yet for this cafe.</p>
                            </div>
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
                                    <div style={styles.statNumber}>0</div>
                                    <div style={styles.statLabel}>Today's Orders</div>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statNumber}>ETB 0</div>
                                    <div style={styles.statLabel}>Today's Revenue</div>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statNumber}>
                                        {selectedCafeData.is_active ? 'Open' : 'Closed'}
                                    </div>
                                    <div style={styles.statLabel}>Status</div>
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
        backgroundColor: '#f0fdf4',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
    },
    cafeSelectorLabel: {
        fontWeight: 'bold',
        color: '#2d6a4f',
    },
    cafeSelect: {
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #d8f3dc',
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
        border: '1px solid #d8f3dc',
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
        borderBottom: '2px solid #d8f3dc',
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
        backgroundColor: '#2d6a4f',
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
        backgroundColor: '#2d6a4f',
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
        border: '1px solid #d8f3dc',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    menuInfo: {
        flex: 1,
    },
    category: {
        display: 'inline-block',
        padding: '2px 8px',
        backgroundColor: '#d8f3dc',
        borderRadius: '12px',
        fontSize: '11px',
        marginRight: '8px',
    },
    price: {
        fontWeight: 'bold',
        color: '#2d6a4f',
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
        border: '1px solid #d8f3dc',
        borderRadius: '8px',
        fontSize: '14px',
    },
    textarea: {
        width: '100%',
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #d8f3dc',
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
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    emptyMenu: {
        textAlign: 'center',
        padding: '40px',
        color: '#666',
        backgroundColor: '#f9f9f9',
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
        backgroundColor: '#f0fdf4',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#2d6a4f',
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
        marginTop: '5px',
    },
};

export default CafeManagement;