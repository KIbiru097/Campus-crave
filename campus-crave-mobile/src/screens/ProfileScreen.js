import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_PROFILE = gql`
    query GetProfile {
        me {
            id
            username
            email
            phone
            role
            created_at
            last_login
        }
        myProfile {
            id
            full_name
            reg_no
            institution
            department
            year_of_study
            phone_number
            verification_status
        }
    }
`;

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { loading, error, data } = useQuery(GET_PROFILE);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    const userData = data?.me || user;
    const profileData = data?.myProfile;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {userData?.username?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.name}>{userData?.username || 'User'}</Text>
                <Text style={styles.email}>{userData?.email || ''}</Text>
                <View style={[styles.roleBadge, { backgroundColor: userData?.role === 'admin' ? '#f39c12' : '#3498db' }]}>
                    <Text style={styles.roleText}>{userData?.role?.toUpperCase()}</Text>
                </View>
            </View>

            {profileData && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Student Information</Text>
                    <View style={styles.infoCard}>
                        <InfoRow label="Full Name" value={profileData.full_name} />
                        <InfoRow label="Registration No" value={profileData.reg_no} />
                        <InfoRow label="Institution" value={profileData.institution} />
                        {profileData.department && <InfoRow label="Department" value={profileData.department} />}
                        {profileData.year_of_study && <InfoRow label="Year of Study" value={String(profileData.year_of_study)} />}
                        <InfoRow label="Phone" value={profileData.phone_number} />
                        <InfoRow label="Verification" value={profileData.verification_status} />
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.infoCard}>
                    <InfoRow label="Username" value={userData?.username} />
                    <InfoRow label="Email" value={userData?.email} />
                    <InfoRow label="Phone" value={userData?.phone} />
                    <InfoRow label="Member Since" value={userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'} />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const InfoRow = ({ label, value }) => (
    <View style={infoStyles.row}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value || 'N/A'}</Text>
    </View>
);

const infoStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    label: {
        fontSize: 14,
        color: '#888',
    },
    value: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        maxWidth: '60%',
        textAlign: 'right',
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: 'white',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    roleBadge: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    logoutButton: {
        margin: 16,
        marginTop: 30,
        backgroundColor: '#e74c3c',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 40,
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
