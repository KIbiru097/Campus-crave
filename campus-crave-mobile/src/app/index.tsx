import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_CAFES } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

export default function App() {
    const { user, logout } = useAuth();
    const { loading, error, data } = useQuery(GET_CAFES);

    if (loading) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Loading cafes... 🍕</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Error: {error.message}</Text>
            </View>
        );
    }

    const cafes = data?.cafes || [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Hero Section */}
            <View style={styles.hero}>
                <Text style={styles.heroEmoji}>🍕☕</Text>
                <Text style={styles.heroTitle}>Campus Crave</Text>
                <Text style={styles.heroSubtitle}>Your favorite campus cafes</Text>
                {!user && (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.primaryButton}>
                            <Text style={styles.buttonText}>Get Started</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {user && (
                    <View style={styles.userInfo}>
                        <Text style={styles.welcomeText}>👋 Welcome, {user.username}!</Text>
                        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Cafes Section */}
            <ScrollView style={styles.cafeList} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>✨ Featured Cafes</Text>
                {cafes.map((cafe, index) => (
                    <TouchableOpacity
                        key={cafe.id}
                        style={[styles.cafeCard, { animationDelay: `${index * 100}ms` }]}
                        activeOpacity={0.9}
                    >
                        <View style={styles.cafeIcon}>
                            <Text style={styles.cafeIconEmoji}>🏪</Text>
                        </View>
                        <View style={styles.cafeInfo}>
                            <Text style={styles.cafeName}>{cafe.name}</Text>
                            <Text style={styles.cafeLocation}>📍 {cafe.location}</Text>
                            <Text style={styles.cafeStatus}>
                                {cafe.is_active ? '🟢 Open Now' : '🔴 Closed'}
                            </Text>
                        </View>
                        <Text style={styles.arrowIcon}>→</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    hero: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    heroEmoji: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 10,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
    },
    primaryButton: {
        backgroundColor: 'white',
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#667eea',
        fontWeight: 'bold',
        fontSize: 14,
    },
    secondaryButton: {
        borderWidth: 2,
        borderColor: 'white',
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 25,
    },
    secondaryButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    userInfo: {
        alignItems: 'center',
    },
    welcomeText: {
        color: 'white',
        fontSize: 16,
        marginBottom: 10,
    },
    logoutButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    logoutText: {
        color: 'white',
        fontSize: 14,
    },
    cafeList: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
    },
    cafeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cafeIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cafeIconEmoji: {
        fontSize: 24,
    },
    cafeInfo: {
        flex: 1,
    },
    cafeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    cafeLocation: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    cafeStatus: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    arrowIcon: {
        fontSize: 20,
        color: '#ccc',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#e74c3c',
    },
});