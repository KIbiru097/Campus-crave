import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CAFES, GET_USERS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

// GraphQL mutations (add these to your mutations.js)
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
    const [selectedCafeId, setSelectedCafeId] = useState(null);
    const [newCafe, setNewCafe] = useState({ name: '', description: '', location: '', contact_phone: '' });

    const { data: cafesData, refetch: refetchCafes } = useQuery(GET_CAFES);
    const { data: usersData, refetch: refetchUsers } = useQuery(GET_USERS);

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
        if (!selectedCafeId) return;
        try {
            await assignCafeOwner({ variables: { cafeId: selectedCafeId, userId: selectedCafeId } });
            alert('Owner assigned successfully!');
            setShowAssignOwner(false);
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
                            <button style={styles.quickBtn} onClick={() => setShowAssignOwner(true)}>👑 Assign Cafe Owner</button>
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
                                    <button style={styles.editBtn}>✏️ Edit</button>
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
        </div>
    );
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
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
    addBtn: { padding: '8px 20px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    cafeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    cafeCard: { background: 'white', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid #d8f3dc' },
    cafeIcon: { fontSize: '48px', marginBottom: '10px' },
    cafeActions: { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' },
    editBtn: { padding: '6px 15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { padding: '6px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    restoreBtn: { padding: '6px 15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    activeBadge: { display: 'inline-block', padding: '4px 12px', background: '#27ae60', color: 'white', borderRadius: '20px', fontSize: '12px' },
    inactiveBadge: { display: 'inline-block', padding: '4px 12px', background: '#95a5a6', color: 'white', borderRadius: '20px', fontSize: '12px' },
    quickActions: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
    quickBtn: { padding: '12px 24px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' },
};

export default AdminDashboard;