import React from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { GET_PROFILE } from '../graphql/queries';

const Profile = () => {
    const { user } = useAuth();
    const { loading, error, data } = useQuery(GET_PROFILE);

    if (loading) return <div className="loading">Loading profile...</div>;
    if (error) return <div className="error">Error: {error.message}</div>;

    const student = data?.myProfile;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>My Profile</h2>
            <div style={styles.card}>
                <div style={styles.section}>
                    <h3>Account Information</h3>
                    <div style={styles.infoRow}>
                        <span>Username:</span>
                        <strong>{user?.username}</strong>
                    </div>
                    <div style={styles.infoRow}>
                        <span>Email:</span>
                        <strong>{user?.email}</strong>
                    </div>
                    <div style={styles.infoRow}>
                        <span>Phone:</span>
                        <strong>{user?.phone || 'Not provided'}</strong>
                    </div>
                    <div style={styles.infoRow}>
                        <span>Role:</span>
                        <strong>{user?.role}</strong>
                    </div>
                </div>
                
                {student && (
                    <div style={styles.section}>
                        <h3>Student Information</h3>
                        <div style={styles.infoRow}>
                            <span>Full Name:</span>
                            <strong>{student.full_name}</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Registration No:</span>
                            <strong>{student.reg_no}</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Institution:</span>
                            <strong>{student.institution}</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Department:</span>
                            <strong>{student.department || 'Not specified'}</strong>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Verification Status:</span>
                            <span style={{
                                ...styles.verificationBadge,
                                backgroundColor: student.verification_status === 'Approved' ? '#27ae60' : '#f39c12'
                            }}>
                                {student.verification_status}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
    },
    title: {
        marginBottom: '20px',
        color: '#2c3e50',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    section: {
        marginBottom: '25px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eee',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
    },
    verificationBadge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
    },
};

export default Profile;