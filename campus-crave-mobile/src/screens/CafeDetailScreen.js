import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MENU_ITEMS } from '../graphql/queries';
import { ADD_TO_CART } from '../graphql/mutations';

const CafeDetailScreen = ({ route }) => {
    const { cafeId, cafeName } = route.params;
    const { loading, error, data } = useQuery(GET_MENU_ITEMS, {
        variables: { cafeId }
    });
    const [addToCart] = useMutation(ADD_TO_CART);

    const handleAddToCart = async (menuItemId) => {
        try {
            await addToCart({
                variables: {
                    input: {
                        menu_item_id: menuItemId,
                        quantity: 1
                    }
                }
            });
            Alert.alert('Added', 'Item added to cart');
        } catch (error) {
            Alert.alert('Error', error.message);
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
            </View>
        );
    }

    const menuItems = data?.menuItems || [];

    const getCategoryEmoji = (category) => {
        const emojiMap = {
            'Coffee': '☕',
            'Beverages': '🥤',
            'Burgers': '🍔',
            'Sandwiches': '🥪',
            'Pizza': '🍕',
            'Pasta': '🍝',
            'Salads': '🥗',
            'Desserts': '🍰',
            'Ethiopian': '🍛',
            'Breakfast': '🍳',
        };
        return emojiMap[category] || '🍽️';
    };

    return (
        <View style={styles.container}>
            {menuItems.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No menu items available</Text>
                </View>
            ) : (
                <FlatList
                    data={menuItems}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.menuCard}>
                            <View style={styles.menuInfo}>
                                <Text style={styles.emoji}>{getCategoryEmoji(item.category)}</Text>
                                <View style={styles.menuDetails}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    {item.description && (
                                        <Text style={styles.itemDescription} numberOfLines={2}>
                                            {item.description}
                                        </Text>
                                    )}
                                    <Text style={styles.itemCategory}>{item.category}</Text>
                                    <Text style={styles.itemPrice}>ETB {item.price}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => handleAddToCart(item.id)}
                            >
                                <Text style={styles.addButtonText}>+ Add</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                />
            )}
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
    menuCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    menuInfo: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    emoji: {
        fontSize: 36,
        marginRight: 12,
    },
    menuDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    itemDescription: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    itemCategory: {
        fontSize: 11,
        color: '#3498db',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#27ae60',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#3498db',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    error: {
        color: 'red',
        fontSize: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});

export default CafeDetailScreen;
