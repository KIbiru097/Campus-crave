import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_CAFES } from '../graphql/queries';

const HomeScreen = ({ navigation }) => {
    const { loading, error, data } = useQuery(GET_CAFES);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>Error: {error.message}</Text>
            </View>
        );
    }

    const cafes = data?.cafes || [];

    return (
        <View style={styles.container}>
            <FlatList
                data={cafes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.cafeCard}
                        onPress={() => navigation.navigate('CafeDetail', { cafeId: item.id, cafeName: item.name })}
                    >
                        <Text style={styles.cafeName}>{item.name}</Text>
                        <Text style={styles.cafeLocation}>📍 {item.location}</Text>
                        <Text style={styles.cafeStatus}>
                            {item.is_active ? '🟢 Open' : '🔴 Closed'}
                        </Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    list: {
        padding: 16,
    },
    cafeCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cafeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    cafeLocation: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    cafeStatus: {
        fontSize: 14,
        marginTop: 8,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        color: 'red',
        fontSize: 16,
    },
});

export default HomeScreen;