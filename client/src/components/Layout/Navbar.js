import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@apollo/client';
import { GET_CART } from '../../graphql/queries';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);

    const { data } = useQuery(GET_CART, {
        skip: !user,
        onCompleted: (data) => {
            setCartCount(data?.myCart?.item_count || 0);
        }
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={styles.navbar}>
            <Link to="/" style={styles.logo}>
                🍕 Campus Crave
            </Link>
            <div style={styles.navLinks}>
                <Link to="/" style={styles.navLink}>Home</Link>
                {user ? (
                    <>
                        <Link to="/orders" style={styles.navLink}>My Orders</Link>
                        <Link to="/cart" style={styles.navLink}>
                            🛒 Cart
                            {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                        </Link>
                        <Link to="/profile" style={styles.navLink}>
                            👤 {user.username}
                        </Link>
                        <button onClick={handleLogout} style={styles.logoutBtn}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.navLink}>Login</Link>
                        <Link to="/register" style={styles.navLink}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

const styles = {
    navbar: {
        backgroundColor: '#2c3e50',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
    },
    logo: {
        color: 'white',
        fontSize: '1.5rem',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
    navLinks: {
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    navLink: {
        color: 'white',
        textDecoration: 'none',
        padding: '8px 12px',
        borderRadius: '5px',
        transition: 'background 0.3s',
    },
    logoutBtn: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    cartBadge: {
        backgroundColor: '#e74c3c',
        color: 'white',
        borderRadius: '50%',
        padding: '2px 6px',
        fontSize: '12px',
        marginLeft: '5px',
    },
};

export default Navbar;