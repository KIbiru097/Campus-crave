import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_MY_ORDERS } from '../graphql/queries';

const OrdersScreen = ({ navigation }) => {
    const { loading, error, data, refetch } = useQuery(GET_MY_ORDERS);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#f39c12';
            case 'CONFIRMED': return '#3498db';
            case 'PREPARING': return '#9b59b6';
            case 'ON_THE_WAY': return '#e67e22';
            case 'DELIVERED': return '#27ae60';
            case 'CANCELLED': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

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
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const orders = data?.myOrders || [];

    if (orders.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No orders yet</Text>
                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.shopButtonText}>Browse Cafes</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderNumber}>#{item.order_number}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.order_status) }]}>
                                <Text style={styles.statusText}>{item.order_status}</Text>
                            </View>
                        </View>
                        <Text style={styles.cafeName}>{item.cafe?.name || 'Unknown Cafe'}</Text>
                        <View style={styles.orderItems}>
                            {item.items?.map((orderItem, idx) => (
                                <Text key={idx} style={styles.orderItem}>
                                    {orderItem.quantity}x {orderItem.menu_item?.name}
                                </Text>
                            ))}
                        </View>
                        <View style={styles.orderFooter}>
                            <Text style={styles.orderTotal}>ETB {item.total_amount}</Text>
                            <Text style={styles.orderDate}>
                                {new Date(item.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refetch} />
                }
            />
        </View>
    );
};

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
    list: {
        padding: 16,
    },
    orderCard: {
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
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    cafeName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    orderItems: {
        marginBottom: 8,
    },
    orderItem: {
        fontSize: 13,
        color: '#555',
        marginBottom: 2,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    orderDate: {
        fontSize: 12,
        color: '#999',
    },
    error: {
        color: 'red',
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
    },
    shopButton: {
        marginTop: 16,
        backgroundColor: '#3498db',
        padding: 12,
        borderRadius: 8,
    },
    shopButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default OrdersScreen;
