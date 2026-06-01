import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_CAFES, GET_USERS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

// GraphQL mutations
const REGISTER_CAFE = gql`
    mutation RegisterCafe($input: CreateCafeInput!) {
        registerCafe(input: $input) {
            id name description location contact_phone is_active
        }
    }
`;

const ASSIGN_CAFE_OWNER = gql`
    mutation AssignCafeOwner($cafeId: ID!, $userId: ID!) {
        assignCafeOwner(cafe_id: $cafeId, user_id: $userId) {
            id user_id cafe_id position
        }
    }
`;

const SOFT_DELETE_CAFE = gql`
    mutation SoftDeleteCafe($id: ID!) {
        softDeleteCafe(id: $id) {
            id name deleted_at
        }
    }
`;

const RESTORE_CAFE = gql`
    mutation RestoreCafe($id: ID!) {
        restoreCafe(id: $id) {
            id name deleted_at
        }
    }
`;

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddCafe, setShowAddCafe] = useState(false);
    const [showAssignOwner, setShowAssignOwner] = useState(false);
    const [selectedCafeId, setSelectedCafeId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [newCafe, setNewCafe] = useState({ name: '', description: '', location: '', contact_phone: '' });

    const { data: cafesData, refetch: refetchCafes } = useQuery(GET_CAFES);
    const { data: usersData } = useQuery(GET_USERS);

    const [registerCafe] = useMutation(REGISTER_CAFE);
    const [assignCafeOwner] = useMutation(ASSIGN_CAFE_OWNER);
    const [softDeleteCafe] = useMutation(SOFT_DELETE_CAFE);
    const [restoreCafe] = useMutation(RESTORE_CAFE);

    if (!user || user.role !== 'admin') {
        return (
            <div style={styles.unauthorized}>
                <h2>Access Denied</h2>
                <p>You don't have permission to view this page.</p>
            </div>
        );
    }

    const cafes = cafesData?.cafes || [];
    const users = usersData?.users || [];
    const activeCafes = cafes.filter(c => !c.deleted_at && c.is_active);
    const deletedCafes = cafes.filter(c => c.deleted_at);

    const handleAddCafe = async (e) => {
        e.preventDefault();
        try {
            await registerCafe({ variables: { input: newCafe } });
            refetchCafes();
            setShowAddCafe(false);
            setNewCafe({ name: '', description: '', location: '', contact_phone: '' });
            alert('Cafe registered successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleAssignOwner = async () => {
        if (!selectedCafeId || !selectedUserId) {
            alert('Please select both cafe and user');
            return;
        }
        try {
            await assignCafeOwner({ variables: { cafeId: selectedCafeId, userId: selectedUserId } });
            alert('Owner assigned successfully!');
            setShowAssignOwner(false);
            setSelectedCafeId('');
            setSelectedUserId('');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleSoftDelete = async (cafeId) => {
        if (window.confirm('Are you sure? This cafe can be restored later.')) {
            try {
                await softDeleteCafe({ variables: { id: cafeId } });
                refetchCafes();
                alert('Cafe moved to trash');
            } catch (err) {
                alert('Error: ' + err.message);
            }
        }
    };

    const handleRestore = async (cafeId) => {
        try {
            await restoreCafe({ variables: { id: cafeId } });
            refetchCafes();
            alert('Cafe restored successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const stats = [
        { label: 'Total Cafes', value: cafes.length, icon: '🏪', color: '#2d6a4f' },
        { label: 'Active Cafes', value: activeCafes.length, icon: '✅', color: '#52b788' },
        { label: 'Total Users', value: users.length, icon: '👥', color: '#3498db' },
        { label: 'In Trash', value: deletedCafes.length, icon: '🗑️', color: '#e74c3c' },
    ];

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>👑 Admin Dashboard</h1>
            <p style={styles.subtitle}>Manage cafes, users, and system settings</p>

            <div style={styles.tabs}>
                <button style={{...styles.tab, ...(activeTab === 'overview' && styles.activeTab)}} onClick={() => setActiveTab('overview')}>📊 Overview</button>
                <button style={{...styles.tab, ...(activeTab === 'cafes' && styles.activeTab)}} onClick={() => setActiveTab('cafes')}>🏪 Cafes</button>
                <button style={{...styles.tab, ...(activeTab === 'deleted' && styles.activeTab)}} onClick={() => setActiveTab('deleted')}>🗑️ Trash ({deletedCafes.length})</button>
                <button style={{...styles.tab, ...(activeTab === 'users' && styles.activeTab)}} onClick={() => setActiveTab('users')}>👥 Users</button>
                <button style={{...styles.tab, ...(activeTab === 'assign' && styles.activeTab)}} onClick={() => setActiveTab('assign')}>👑 Assign Owner</button>
            </div>

            {activeTab === 'overview' && (
                <div>
                    <div style={styles.statsGrid}>
                        {stats.map((stat, idx) => (
                            <div key={idx} style={styles.statCard}>
                                <div style={styles.statIcon}>{stat.icon}</div>
                                <div style={styles.statValue}>{stat.value}</div>
                                <div style={styles.statLabel}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={styles.section}>
                        <h3>Quick Actions</h3>
                        <div style={styles.quickActions}>
                            <button style={styles.quickBtn} onClick={() => setShowAddCafe(true)}>➕ Register New Cafe</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'cafes' && (
                <div>
                    <div style={styles.sectionHeader}>
                        <h3>All Cafes</h3>
                        <button style={styles.addBtn} onClick={() => setShowAddCafe(true)}>+ Register Cafe</button>
                    </div>
                    <div style={styles.cafeGrid}>
                        {cafes.filter(c => !c.deleted_at).map(cafe => (
                            <div key={cafe.id} style={styles.cafeCard}>
                                <div style={styles.cafeIcon}>🏪</div>
                                <h4>{cafe.name}</h4>
                                <p>{cafe.location}</p>
                                <p>{cafe.contact_phone || 'No phone'}</p>
                                <div style={styles.cafeStatus}>
                                    {cafe.is_active ? <span style={styles.activeBadge}>Active</span> : <span style={styles.inactiveBadge}>Inactive</span>}
                                </div>
                                <div style={styles.cafeActions}>
                                    <button style={styles.deleteBtn} onClick={() => handleSoftDelete(cafe.id)}>🗑️ Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'deleted' && (
                <div>
                    <h3>Deleted Cafes (Restore Available)</h3>
                    <div style={styles.cafeGrid}>
                        {cafes.filter(c => c.deleted_at).map(cafe => (
                            <div key={cafe.id} style={{...styles.cafeCard, backgroundColor: '#fef3c7'}}>
                                <div style={styles.cafeIcon}>🗑️</div>
                                <h4>{cafe.name}</h4>
                                <p>{cafe.location}</p>
                                <p><small>Deleted: {new Date(cafe.deleted_at).toLocaleDateString()}</small></p>
                                <div style={styles.cafeActions}>
                                    <button style={styles.restoreBtn} onClick={() => handleRestore(cafe.id)}>↩️ Restore</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div>
                    <div style={styles.sectionHeader}>
                        <h3>System Users</h3>
                    </div>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr><th>Username</th><th>Email</th><th>Role</th><th>Joined</th></tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.username}</td>
                                        <td>{u.email}</td>
                                        <td><span style={{...styles.roleBadge, backgroundColor: getRoleColor(u.role)}}>{u.role}</span></td>
                                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'assign' && (
                <div style={styles.assignSection}>
                    <h3>Assign Cafe Owner</h3>
                    <div style={styles.assignForm}>
                        <select value={selectedCafeId} onChange={(e) => setSelectedCafeId(e.target.value)} style={styles.select}>
                            <option value="">Select Cafe</option>
                            {cafes.filter(c => !c.deleted_at).map(cafe => (
                                <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                            ))}
                        </select>
                        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={styles.select}>
                            <option value="">Select User</option>
                            {users.filter(u => u.role === 'student').map(u => (
                                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                            ))}
                        </select>
                        <button style={styles.assignBtn} onClick={handleAssignOwner}>Assign as Owner</button>
                    </div>
                </div>
            )}

            {/* Modal for Add Cafe */}
            {showAddCafe && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Register New Cafe</h3>
                        <form onSubmit={handleAddCafe}>
                            <input type="text" placeholder="Cafe Name" value={newCafe.name} onChange={(e) => setNewCafe({...newCafe, name: e.target.value})} style={styles.input} required />
                            <input type="text" placeholder="Location" value={newCafe.location} onChange={(e) => setNewCafe({...newCafe, location: e.target.value})} style={styles.input} required />
                            <input type="text" placeholder="Contact Phone" value={newCafe.contact_phone} onChange={(e) => setNewCafe({...newCafe, contact_phone: e.target.value})} style={styles.input} />
                            <textarea placeholder="Description" value={newCafe.description} onChange={(e) => setNewCafe({...newCafe, description: e.target.value})} style={styles.textarea} rows="3" />
                            <div style={styles.modalActions}>
                                <button type="button" style={styles.cancelBtn} onClick={() => setShowAddCafe(false)}>Cancel</button>
                                <button type="submit" style={styles.saveBtn}>Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const getRoleColor = (role) => {
    switch (role) {
        case 'admin': return '#e74c3c';
        case 'owner': return '#f39c12';
        case 'staff': return '#3498db';
        case 'delivery': return '#9b59b6';
        default: return '#2d6a4f';
    }
};

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
    title: { color: '#2d6a4f', marginBottom: '5px' },
    subtitle: { color: '#52b788', marginBottom: '30px' },
    unauthorized: { textAlign: 'center', padding: '60px', color: '#e74c3c' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', borderBottom: '2px solid #d8f3dc', paddingBottom: '10px' },
    tab: { padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px' },
    activeTab: { background: '#2d6a4f', color: 'white' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '40px' },
    statCard: { background: 'white', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid #d8f3dc' },
    statIcon: { fontSize: '40px', marginBottom: '10px' },
    statValue: { fontSize: '28px', fontWeight: 'bold', color: '#2d6a4f' },
    statLabel: { fontSize: '14px', color: '#666' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
    addBtn: { padding: '8px 20px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    cafeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    cafeCard: { background: 'white', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid #d8f3dc' },
    cafeIcon: { fontSize: '48px', marginBottom: '10px' },
    cafeActions: { marginTop: '15px' },
    deleteBtn: { padding: '6px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    restoreBtn: { padding: '6px 15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    activeBadge: { display: 'inline-block', padding: '4px 12px', background: '#27ae60', color: 'white', borderRadius: '20px', fontSize: '12px' },
    inactiveBadge: { display: 'inline-block', padding: '4px 12px', background: '#95a5a6', color: 'white', borderRadius: '20px', fontSize: '12px' },
    quickActions: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
    quickBtn: { padding: '12px 24px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden' },
    roleBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: 'white' },
    assignSection: { background: 'white', padding: '20px', borderRadius: '16px' },
    assignForm: { display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' },
    select: { padding: '10px', borderRadius: '8px', border: '1px solid #d8f3dc', flex: 1 },
    assignBtn: { padding: '10px 20px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d8f3dc', borderRadius: '8px' },
    textarea: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d8f3dc', borderRadius: '8px' },
    modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    cancelBtn: { padding: '8px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    saveBtn: { padding: '8px 20px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};

export default AdminDashboard;