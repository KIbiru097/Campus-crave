import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@apollo/client';
import { GET_CART } from '../../graphql/queries';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
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

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={styles.navbar}>
            <div style={styles.navContainer}>
                <Link to="/" style={styles.logo}>
                    <span style={styles.logoEmoji}>🍕</span>
                    <span style={styles.logoText}>Campus Crave</span>
                </Link>

                <div style={styles.navLinks}>
                    <Link to="/" style={{ ...styles.navLink, ...(isActive('/') && styles.navLinkActive) }}>
                        🏠 Home
                    </Link>
                    
                    {user ? (
                        <>
                            {/* Role-based links */}
                            {user.role === 'admin' && (
                                <Link to="/admin" style={{ ...styles.navLink, ...(isActive('/admin') && styles.navLinkActive) }}>
                                    👑 Admin
                                </Link>
                            )}
                            {(user.role === 'owner' || user.role === 'staff') && (
                                <Link to="/cafe-management" style={{ ...styles.navLink, ...(isActive('/cafe-management') && styles.navLinkActive) }}>
                                    🏪 My Cafe
                                </Link>
                            )}

                            // Add this inside the user section
                          {user && user.role === 'delivery' && (
                        <Link to="/delivery-dashboard" style={styles.navLink}>
                                    🚚 Deliveries
                           </Link>
                            )}
                            
                            {/* Common links for all users */}
                            <Link to="/orders" style={{ ...styles.navLink, ...(isActive('/orders') && styles.navLinkActive) }}>
                                📋 Orders
                            </Link>
                            <Link to="/cart" style={{ ...styles.navLink, ...(isActive('/cart') && styles.navLinkActive) }}>
                                🛒 Cart
                                {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                            </Link>
                            <Link to="/profile" style={{ ...styles.navLink, ...(isActive('/profile') && styles.navLinkActive) }}>
                                👤 {user.username}
                            </Link>
                            <button onClick={handleLogout} style={styles.logoutBtn}>
                                🚪 Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={styles.navLink}>Login</Link>
                            <Link to="/register" style={styles.navLink}>Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

const styles = {
    navbar: {
        backgroundColor: '#2d6a4f',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
    },
    navContainer: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
    },
    logoEmoji: {
        fontSize: '1.5rem',
    },
    logoText: {
        fontSize: '1.3rem',
        fontWeight: 'bold',
        color: 'white',
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
        borderRadius: '8px',
        transition: 'background 0.3s',
    },
    navLinkActive: {
        backgroundColor: '#1b4332',
    },
    logoutBtn: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    cartBadge: {
        backgroundColor: '#e74c3c',
        color: 'white',
        borderRadius: '50%',
        padding: '2px 6px',
        fontSize: '11px',
        marginLeft: '5px',
    },
};

export default Navbar;