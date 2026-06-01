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
            <h2 style={styles.title}>🍽️ Menu</h2>
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
                                Add
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
        padding: '1rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    title: {
        marginBottom: '1.5rem',
        color: '#2d6a4f',
        textAlign: 'center',
        fontSize: '1.5rem',
    },
    successMessage: {
        backgroundColor: '#d8f3dc',
        color: '#2d6a4f',
        padding: '0.75rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        textAlign: 'center',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
    },
    card: {
        backgroundColor: '#fffef7',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: '0 2px 8px rgba(45, 106, 79, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    itemInfo: {
        flex: 2,
    },
    itemName: {
        marginBottom: '4px',
        color: '#1b4332',
        fontSize: '1rem',
    },
    description: {
        color: '#52b788',
        fontSize: '0.75rem',
        marginBottom: '4px',
    },
    category: {
        display: 'inline-block',
        backgroundColor: '#d8f3dc',
        color: '#2d6a4f',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        marginBottom: '6px',
    },
    price: {
        color: '#2d6a4f',
        fontWeight: 'bold',
        fontSize: '1rem',
        marginTop: '4px',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    quantityInput: {
        width: '50px',
        padding: '6px',
        border: '1px solid #d8f3dc',
        borderRadius: '6px',
        textAlign: 'center',
        fontSize: '0.85rem',
    },
    addButton: {
        padding: '6px 12px',
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.85rem',
    },
};

export default MenuItems;