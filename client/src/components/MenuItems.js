import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MENU_ITEMS } from '../graphql/queries';
import { ADD_TO_CART } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MenuItems = ({ cafeId }) => {
    const [quantities, setQuantities] = useState({});
    const [message, setMessage] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const { loading, error, data } = useQuery(GET_MENU_ITEMS, {
        variables: { cafeId: parseInt(cafeId) }
    });

    const [addToCart] = useMutation(ADD_TO_CART, {
        refetchQueries: ['GetCart']
    });

    const handleQuantityChange = (itemId, value) => {
        setQuantities({
            ...quantities,
            [itemId]: parseInt(value) || 1
        });
    };

    const handleAddToCart = async (itemId, price) => {
        if (!user) {
            navigate('/login');
            return;
        }

        const quantity = quantities[itemId] || 1;

        try {
            await addToCart({
                variables: {
                    input: {
                        menu_item_id: parseInt(itemId),
                        quantity: quantity,
                        customizations: null
                    }
                }
            });
            setMessage(`✓ Added ${quantity} item(s) to cart!`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (loading) return <div className="loading">Loading menu...</div>;
    if (error) return <div className="error">Error loading menu: {error.message}</div>;

    const items = data?.menuItems || [];

    if (items.length === 0) {
        return <div className="loading">No menu items available for this cafe.</div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Menu</h2>
            {message && <div style={styles.successMessage}>{message}</div>}
            <div style={styles.grid}>
                {items.map((item) => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.itemInfo}>
                            <h3 style={styles.itemName}>{item.name}</h3>
                            <p style={styles.description}>{item.description}</p>
                            <span style={styles.category}>{item.category}</span>
                            <p style={styles.price}>ETB {item.price}</p>
                        </div>
                        <div style={styles.actions}>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={quantities[item.id] || 1}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                style={styles.quantityInput}
                            />
                            <button 
                                onClick={() => handleAddToCart(item.id, item.price)}
                                style={styles.addButton}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    title: {
        marginBottom: '30px',
        color: '#2c3e50',
        textAlign: 'center',
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        marginBottom: '8px',
        color: '#2c3e50',
    },
    description: {
        color: '#666',
        fontSize: '14px',
        marginBottom: '8px',
    },
    category: {
        display: 'inline-block',
        backgroundColor: '#ecf0f1',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        marginBottom: '8px',
    },
    price: {
        color: '#27ae60',
        fontWeight: 'bold',
        fontSize: '18px',
        marginTop: '8px',
    },
    actions: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        marginLeft: '15px',
    },
    quantityInput: {
        width: '60px',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        textAlign: 'center',
    },
    addButton: {
        padding: '8px 15px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};

export default MenuItems;