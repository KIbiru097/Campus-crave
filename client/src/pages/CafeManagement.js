import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CAFES, GET_MENU_ITEMS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

const GET_MY_CAFES = gql`
    query GetMyCafes {
        getMyCafes {
            id name description location contact_phone is_active
        }
    }
`;

const CREATE_MENU_ITEM = gql`
    mutation CreateMenuItem($input: CreateMenuItemInput!) {
        createMenuItem(input: $input) {
            id name description price category status
        }
    }
`;

const SOFT_DELETE_MENU_ITEM = gql`
    mutation SoftDeleteMenuItem($id: ID!) {
        softDeleteMenuItem(id: $id) {
            id name deleted_at
        }
    }
`;

const UPDATE_MENU_ITEM = gql`
    mutation UpdateMenuItem($id: ID!, $input: UpdateMenuItemInput!) {
        updateMenuItem(id: $id, input: $input) {
            id name description price category status
        }
    }
`;

const CafeManagement = () => {
    const { user } = useAuth();
    const [selectedCafe, setSelectedCafe] = useState(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newItem, setNewItem] = useState({ name: '', price: '', category: '', description: '' });

    const { data: myCafesData, refetch: refetchMyCafes } = useQuery(GET_MY_CAFES);
    const { data: menuData, refetch: refetchMenu } = useQuery(GET_MENU_ITEMS, {
        variables: { cafeId: selectedCafe },
        skip: !selectedCafe,
    });

    const [createMenuItem] = useMutation(CREATE_MENU_ITEM);
    const [softDeleteMenuItem] = useMutation(SOFT_DELETE_MENU_ITEM);
    const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM);

    if (!user || (user.role !== 'owner' && user.role !== 'staff')) {
        return (
            <div style={styles.unauthorized}>
                <h2>Access Denied</h2>
                <p>Only cafe owners and staff can access this page.</p>
            </div>
        );
    }

    const myCafes = myCafesData?.getMyCafes || [];
    const menuItems = menuData?.menuItems || [];

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!selectedCafe) {
            alert('Please select a cafe first');
            return;
        }
        try {
            await createMenuItem({
                variables: {
                    input: {
                        cafe_id: selectedCafe,
                        name: newItem.name,
                        description: newItem.description,
                        price: parseFloat(newItem.price),
                        category: newItem.category,
                    }
                }
            });
            refetchMenu();
            setShowAddItem(false);
            setNewItem({ name: '', price: '', category: '', description: '' });
            alert('Menu item added!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            await updateMenuItem({
                variables: {
                    id: editingItem.id,
                    input: {
                        name: editingItem.name,
                        description: editingItem.description,
                        price: parseFloat(editingItem.price),
                        category: editingItem.category,
                    }
                }
            });
            refetchMenu();
            setEditingItem(null);
            alert('Item updated!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Move this item to trash? You can restore it later.')) {
            try {
                await softDeleteMenuItem({ variables: { id: itemId } });
                refetchMenu();
                alert('Item moved to trash');
            } catch (err) {
                alert('Error: ' + err.message);
            }
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🍽️ My Cafe Management</h1>
            <p style={styles.subtitle}>Manage your cafe menu and orders</p>

            <div style={styles.cafeSelector}>
                <label>Select Your Cafe:</label>
                <select value={selectedCafe || ''} onChange={(e) => setSelectedCafe(parseInt(e.target.value))} style={styles.select}>
                    <option value="">-- Choose Cafe --</option>
                    {myCafes.map(cafe => (
                        <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                    ))}
                </select>
                {myCafes.length === 0 && (
                    <p style={styles.warning}>You are not assigned to any cafe. Contact admin.</p>
                )}
            </div>

            {selectedCafe && (
                <div style={styles.content}>
                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}><div style={styles.statIcon}>📋</div><div style={styles.statValue}>{menuItems.length}</div><div>Menu Items</div></div>
                        <div style={styles.statCard}><div style={styles.statIcon}>💰</div><div style={styles.statValue}>ETB 12,450</div><div>Today's Sales</div></div>
                        <div style={styles.statCard}><div style={styles.statIcon}>⏳</div><div style={styles.statValue}>8</div><div>Pending Orders</div></div>
                    </div>

                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h2>📝 Menu Items</h2>
                            <button style={styles.addBtn} onClick={() => setShowAddItem(true)}>+ Add Item</button>
                        </div>

                        {(showAddItem || editingItem) && (
                            <div style={styles.modal}>
                                <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                                <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
                                    <input type="text" placeholder="Item Name" value={editingItem ? editingItem.name : newItem.name} onChange={(e) => editingItem ? setEditingItem({...editingItem, name: e.target.value}) : setNewItem({...newItem, name: e.target.value})} style={styles.input} required />
                                    <input type="number" placeholder="Price (ETB)" value={editingItem ? editingItem.price : newItem.price} onChange={(e) => editingItem ? setEditingItem({...editingItem, price: e.target.value}) : setNewItem({...newItem, price: e.target.value})} style={styles.input} required />
                                    <input type="text" placeholder="Category" value={editingItem ? editingItem.category : newItem.category} onChange={(e) => editingItem ? setEditingItem({...editingItem, category: e.target.value}) : setNewItem({...newItem, category: e.target.value})} style={styles.input} required />
                                    <textarea placeholder="Description" value={editingItem ? editingItem.description : newItem.description} onChange={(e) => editingItem ? setEditingItem({...editingItem, description: e.target.value}) : setNewItem({...newItem, description: e.target.value})} style={styles.textarea} rows="3" />
                                    <div style={styles.modalActions}>
                                        <button type="button" style={styles.cancelBtn} onClick={() => { setShowAddItem(false); setEditingItem(null); }}>Cancel</button>
                                        <button type="submit" style={styles.saveBtn}>{editingItem ? 'Update' : 'Save'}</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div style={styles.menuGrid}>
                            {menuItems.filter(item => !item.deleted_at).map(item => (
                                <div key={item.id} style={styles.menuCard}>
                                    <div style={styles.menuInfo}>
                                        <h4>{item.name}</h4>
                                        <p>{item.description}</p>
                                        <span style={styles.category}>{item.category}</span>
                                        <span style={styles.price}>ETB {item.price}</span>
                                    </div>
                                    <div style={styles.menuActions}>
                                        <button style={styles.editBtn} onClick={() => setEditingItem(item)}>✏️ Edit</button>
                                        <button style={styles.deleteBtn} onClick={() => handleDeleteItem(item.id)}>🗑️ Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
    title: { color: '#2d6a4f', marginBottom: '5px' },
    subtitle: { color: '#52b788', marginBottom: '30px' },
    unauthorized: { textAlign: 'center', padding: '60px', color: '#e74c3c' },
    cafeSelector: { marginBottom: '30px', padding: '20px', background: '#f0fdf4', borderRadius: '12px' },
    select: { marginLeft: '15px', padding: '8px 15px', borderRadius: '8px', border: '1px solid #d8f3dc' },
    warning: { color: '#e74c3c', marginTop: '10px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' },
    statCard: { background: 'white', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid #d8f3dc' },
    statIcon: { fontSize: '32px', marginBottom: '10px' },
    statValue: { fontSize: '28px', fontWeight: 'bold', color: '#2d6a4f' },
    section: { marginBottom: '40px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
    addBtn: { padding: '8px 20px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' },
    menuCard: { background: 'white', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #d8f3dc' },
    menuInfo: { flex: 1 },
    category: { display: 'inline-block', padding: '2px 8px', background: '#d8f3dc', borderRadius: '12px', fontSize: '11px', marginRight: '8px' },
    price: { fontWeight: 'bold', color: '#2d6a4f' },
    menuActions: { display: 'flex', gap: '8px' },
    editBtn: { background: '#3498db', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
    modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 1000, width: '90%', maxWidth: '500px' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d8f3dc', borderRadius: '8px' },
    textarea: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d8f3dc', borderRadius: '8px' },
    modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    cancelBtn: { padding: '8px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    saveBtn: { padding: '8px 20px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};

export default CafeManagement;