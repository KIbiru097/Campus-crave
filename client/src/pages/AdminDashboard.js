import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_CAFES, GET_USERS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

// GraphQL Mutations
const CREATE_STAFF = gql`
    mutation CreateStaff($input: CreateStaffInput!) {
        createStaff(input: $input) {
            id
            username
            email
            phone
            role
        }
    }
`;

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
    const [showCreateStaff, setShowCreateStaff] = useState(false);
    const [showAssignOwner, setShowAssignOwner] = useState(false);
    const [selectedCafeId, setSelectedCafeId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [newCafe, setNewCafe] = useState({ name: '', description: '', location: '', contact_phone: '' });
    const [newStaff, setNewStaff] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'staff',
        cafe_id: ''
    });

    const { data: cafesData, refetch: refetchCafes } = useQuery(GET_CAFES);
    const { data: usersData, refetch: refetchUsers } = useQuery(GET_USERS);

    const [createStaff] = useMutation(CREATE_STAFF);
    const [registerCafe] = useMutation(REGISTER_CAFE);
    const [assignCafeOwner] = useMutation(ASSIGN_CAFE_OWNER);
    const [softDeleteCafe] = useMutation(SOFT_DELETE_CAFE);
    const [restoreCafe] = useMutation(RESTORE_CAFE);

    if (!user || user.role !== 'admin') {
        return (
            <div style={styles.unauthorized}>
                <div style={styles.unauthorizedIcon}>🔒</div>
                <h2>Access Denied</h2>
                <p>You don't have permission to view this page.</p>
                <p>This area is restricted to administrators only.</p>
            </div>
        );
    }

    const cafes = cafesData?.cafes || [];
    const users = usersData?.users || [];
    const activeCafes = cafes.filter(c => !c.deleted_at && c.is_active);
    const deletedCafes = cafes.filter(c => c.deleted_at);
    const staffUsers = users.filter(u => u.role === 'staff' || u.role === 'owner' || u.role === 'delivery');

    const handleAddCafe = async (e) => {
        e.preventDefault();
        try {
            await registerCafe({ variables: { input: newCafe } });
            refetchCafes();
            setShowAddCafe(false);
            setNewCafe({ name: '', description: '', location: '', contact_phone: '' });
            alert('✅ Cafe registered successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            await createStaff({
                variables: {
                    input: {
                        username: newStaff.username,
                        email: newStaff.email,
                        password: newStaff.password,
                        full_name: newStaff.full_name,
                        phone: newStaff.phone,
                        role: newStaff.role,
                        cafe_id: newStaff.cafe_id ? parseInt(newStaff.cafe_id) : null
                    }
                }
            });
            alert(`✅ ${newStaff.role.toUpperCase()} account created successfully!`);
            refetchUsers();
            setShowCreateStaff(false);
            setNewStaff({ username: '', email: '', password: '', full_name: '', phone: '', role: 'staff', cafe_id: '' });
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
            alert('✅ Owner assigned successfully!');
            setShowAssignOwner(false);
            setSelectedCafeId('');
            setSelectedUserId('');
            refetchCafes();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleSoftDelete = async (cafeId) => {
        if (window.confirm('Are you sure? This cafe can be restored later.')) {
            try {
                await softDeleteCafe({ variables: { id: cafeId } });
                refetchCafes();
                alert('✅ Cafe moved to trash');
            } catch (err) {
                alert('Error: ' + err.message);
            }
        }
    };

    const handleRestore = async (cafeId) => {
        try {
            await restoreCafe({ variables: { id: cafeId } });
            refetchCafes();
            alert('✅ Cafe restored successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const stats = [
        { label: 'Total Cafes', value: cafes.length, icon: '🏪', color: '#2d6a4f' },
        { label: 'Active Cafes', value: activeCafes.length, icon: '✅', color: '#52b788' },
        { label: 'Total Users', value: users.length, icon: '👥', color: '#3498db' },
        { label: 'Staff Members', value: staffUsers.length, icon: '👨‍🍳', color: '#9b59b6' },
        { label: 'In Trash', value: deletedCafes.length, icon: '🗑️', color: '#e74c3c' },
        { label: 'Total Revenue', value: 'ETB 0', icon: '💰', color: '#f39c12' },
    ];

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return '#e74c3c';
            case 'owner': return '#f39c12';
            case 'staff': return '#3498db';
            case 'delivery': return '#9b59b6';
            default: return '#2d6a4f';
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>👑 Admin Dashboard</h1>
            <p style={styles.subtitle}>Manage cafes, users, staff, and system settings</p>

            {/* Tabs */}
            <div style={styles.tabs}>
                <button style={{...styles.tab, ...(activeTab === 'overview' && styles.activeTab)}} onClick={() => setActiveTab('overview')}>📊 Overview</button>
                <button style={{...styles.tab, ...(activeTab === 'cafes' && styles.activeTab)}} onClick={() => setActiveTab('cafes')}>🏪 Cafes</button>
                <button style={{...styles.tab, ...(activeTab === 'staff' && styles.activeTab)}} onClick={() => setActiveTab('staff')}>👥 Staff</button>
                <button style={{...styles.tab, ...(activeTab === 'deleted' && styles.activeTab)}} onClick={() => setActiveTab('deleted')}>🗑️ Trash ({deletedCafes.length})</button>
                <button style={{...styles.tab, ...(activeTab === 'users' && styles.activeTab)}} onClick={() => setActiveTab('users')}>👤 Users</button>
            </div>

            {/* Overview Tab */}
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
                            <button style={styles.quickBtn} onClick={() => setShowAddCafe(true)}>🏪 Register New Cafe</button>
                            <button style={styles.quickBtn} onClick={() => setShowCreateStaff(true)}>👥 Create Staff Account</button>
                            <button style={styles.quickBtn} onClick={() => setShowAssignOwner(true)}>👑 Assign Cafe Owner</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cafes Tab */}
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

            {/* Staff Management Tab */}
            {activeTab === 'staff' && (
                <div>
                    <div style={styles.sectionHeader}>
                        <h3>Staff Members</h3>
                        <button style={styles.addBtn} onClick={() => setShowCreateStaff(true)}>+ Create Staff</button>
                    </div>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Phone</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffUsers.map(staff => (
                                    <tr key={staff.id}>
                                        <td>{staff.username}</td>
                                        <td>{staff.email}</td>
                                        <td><span style={{...styles.roleBadge, backgroundColor: getRoleColor(staff.role)}}>{staff.role}</span></td>
                                        <td>{staff.phone || '-'}</td>
                                        <td>
                                            <button style={styles.iconBtn}>✏️</button>
                                            <button style={styles.iconBtn}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Deleted Cafes Tab */}
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

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div>
                    <h3>System Users</h3>
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

            {/* Add Cafe Modal */}
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

            {/* Create Staff Modal */}
            {showCreateStaff && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Create Staff Account</h3>
                        <form onSubmit={handleCreateStaff}>
                            <input type="text" placeholder="Username *" value={newStaff.username} onChange={(e) => setNewStaff({...newStaff, username: e.target.value})} style={styles.input} required />
                            <input type="email" placeholder="Email *" value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} style={styles.input} required />
                            <input type="password" placeholder="Password *" value={newStaff.password} onChange={(e) => setNewStaff({...newStaff, password: e.target.value})} style={styles.input} required />
                            <input type="text" placeholder="Full Name *" value={newStaff.full_name} onChange={(e) => setNewStaff({...newStaff, full_name: e.target.value})} style={styles.input} required />
                            <input type="text" placeholder="Phone" value={newStaff.phone} onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})} style={styles.input} />
                            <select value={newStaff.role} onChange={(e) => setNewStaff({...newStaff, role: e.target.value})} style={styles.input}>
                                <option value="staff">👨‍🍳 Staff</option>
                                <option value="owner">👑 Owner</option>
                                <option value="delivery">🚚 Delivery</option>
                            </select>
                            <select value={newStaff.cafe_id} onChange={(e) => setNewStaff({...newStaff, cafe_id: e.target.value})} style={styles.input}>
                                <option value="">Select Cafe (for staff/owner)</option>
                                {cafes.filter(c => !c.deleted_at).map(cafe => (
                                    <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                                ))}
                            </select>
                            <div style={styles.modalActions}>
                                <button type="button" style={styles.cancelBtn} onClick={() => setShowCreateStaff(false)}>Cancel</button>
                                <button type="submit" style={styles.saveBtn}>Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Owner Modal */}
            {showAssignOwner && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Assign Cafe Owner</h3>
                        <select value={selectedCafeId} onChange={(e) => setSelectedCafeId(e.target.value)} style={styles.input}>
                            <option value="">Select Cafe</option>
                            {cafes.filter(c => !c.deleted_at).map(cafe => (
                                <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                            ))}
                        </select>
                        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={styles.input}>
                            <option value="">Select User</option>
                            {users.filter(u => u.role === 'student' || u.role === 'staff').map(u => (
                                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                            ))}
                        </select>
                        <div style={styles.modalActions}>
                            <button type="button" style={styles.cancelBtn} onClick={() => setShowAssignOwner(false)}>Cancel</button>
                            <button type="button" style={styles.saveBtn} onClick={handleAssignOwner}>Assign as Owner</button>
                        </div>
                    </div>
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
    unauthorizedIcon: {
        fontSize: '60px',
        marginBottom: '20px',
    },
    tabs: {
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        flexWrap: 'wrap',
        borderBottom: '2px solid #d8f3dc',
        paddingBottom: '10px',
    },
    tab: {
        padding: '10px 20px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '8px',
        transition: 'all 0.3s',
    },
    activeTab: {
        background: '#2d6a4f',
        color: 'white',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
    },
    statCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #d8f3dc',
    },
    statIcon: {
        fontSize: '40px',
        marginBottom: '10px',
    },
    statValue: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#2d6a4f',
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
    },
    section: {
        marginTop: '30px',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px',
    },
    quickActions: {
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
    },
    quickBtn: {
        padding: '12px 24px',
        background: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    addBtn: {
        padding: '8px 20px',
        background: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    cafeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
    },
    cafeCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #d8f3dc',
    },
    cafeIcon: {
        fontSize: '48px',
        marginBottom: '10px',
    },
    cafeStatus: {
        marginTop: '10px',
    },
    activeBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        background: '#27ae60',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
    },
    inactiveBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        background: '#95a5a6',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
    },
    cafeActions: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginTop: '15px',
    },
    editBtn: {
        padding: '6px 15px',
        background: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    deleteBtn: {
        padding: '6px 15px',
        background: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    restoreBtn: {
        padding: '6px 15px',
        background: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    tableContainer: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    roleBadge: {
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        color: 'white',
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        margin: '0 5px',
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        background: 'white',
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
    },
    textarea: {
        width: '100%',
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #d8f3dc',
        borderRadius: '8px',
    },
    modalActions: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        padding: '8px 20px',
        background: '#95a5a6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '8px 20px',
        background: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
};

export default AdminDashboard;