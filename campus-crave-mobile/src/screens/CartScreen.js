import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CART } from '../graphql/queries';
import { CREATE_ORDER } from '../graphql/mutations';

const CartScreen = ({ navigation }) => {
    const { loading, error, data, refetch } = useQuery(GET_CART);
    const [createOrder] = useMutation(CREATE_ORDER);

    const handleCheckout = async () => {
        const cart = data?.myCart;
        if (!cart?.items?.length) {
            Alert.alert('Cart Empty', 'Please add items to your cart');
            return;
        }

        try {
            const { data: orderData } = await createOrder({
                variables: {
                    input: {
                        cafe_id: 1,
                        payment_type: 'Online',
                        special_instructions: null
                    }
                }
            });

            if (orderData?.createOrder) {
                Alert.alert('Success', `Order placed! #${orderData.createOrder.order_number}`);
                refetch();
                navigation.navigate('Orders');
            }
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

    const cart = data?.myCart;
    const items = cart?.items || [];
    const total = cart?.total || 0;

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Your cart is empty</Text>
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
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <View>
                            <Text style={styles.itemName}>{item.menu_item?.name}</Text>
                            <Text style={styles.itemPrice}>ETB {item.unit_price} each</Text>
                        </View>
                        <View>
                            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                            <Text style={styles.itemTotal}>
                                ETB {item.quantity * item.unit_price}
                            </Text>
                        </View>
                    </View>
                )}
            />
            <View style={styles.footer}>
                <Text style={styles.totalText}>Total: ETB {total}</Text>
                <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                    <Text style={styles.checkoutButtonText}>Checkout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemPrice: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    itemQuantity: {
        fontSize: 14,
        textAlign: 'right',
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#27ae60',
        marginTop: 4,
    },
    footer: {
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: 12,
    },
    checkoutButton: {
        backgroundColor: '#27ae60',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
});

export default CartScreen;