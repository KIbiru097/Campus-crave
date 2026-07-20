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
    const [menuOpen, setMenuOpen] = useState(false);

    const { data } = useQuery(GET_CART, {
        skip: !user,
        onCompleted: (data) => {
            setCartCount(data?.myCart?.item_count || 0);
        }
    });

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <style>{`
                .cc-nav-link {
                    color: white;
                    text-decoration: none;
                    padding: 8px 12px;
                    border-radius: 8px;
                    transition: background 0.3s;
                    white-space: nowrap;
                    font-size: 14px;
                }
                .cc-nav-link:hover {
                    background: rgba(255,255,255,0.15);
                }
                .cc-nav-link.active {
                    background: #FF7A3D;
                }
                .cc-hamburger {
                    display: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    z-index: 1100;
                }
                .cc-hamburger span {
                    display: block;
                    width: 22px;
                    height: 2px;
                    background: white;
                    margin: 5px 0;
                    border-radius: 2px;
                    transition: all 0.3s;
                }
                .cc-hamburger.open span:nth-child(1) {
                    transform: rotate(45deg) translate(5px, 5px);
                }
                .cc-hamburger.open span:nth-child(2) {
                    opacity: 0;
                }
                .cc-hamburger.open span:nth-child(3) {
                    transform: rotate(-45deg) translate(5px, -5px);
                }
                @media (max-width: 768px) {
                    .cc-hamburger {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .cc-nav-links {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: #E8532B;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        z-index: 1050;
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 0.3s;
                    }
                    .cc-nav-links.open {
                        opacity: 1;
                        pointer-events: auto;
                    }
                    .cc-nav-links .cc-nav-link {
                        font-size: 18px;
                        padding: 12px 24px;
                    }
                }
            `}</style>
            <nav style={styles.navbar}>
                <div style={styles.navContainer}>
                    <Link to="/" style={styles.logo}>
                        <span style={styles.logoEmoji}>🍕</span>
                        <span style={styles.logoText}>Campus Crave</span>
                    </Link>

                    <button
                        className={`cc-hamburger ${menuOpen ? 'open' : ''}`}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span />
                        <span />
                        <span />
                    </button>

                    <div className={`cc-nav-links ${menuOpen ? 'open' : ''}`} style={styles.navLinks}>
                        <Link to="/" className={`cc-nav-link ${isActive('/') ? 'active' : ''}`}>
                            🏠 Home
                        </Link>

                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <Link to="/admin" className={`cc-nav-link ${isActive('/admin') ? 'active' : ''}`}>
                                        👑 Admin
                                    </Link>
                                )}
                                {(user.role === 'owner' || user.role === 'staff') && (
                                    <Link to="/cafe-management" className={`cc-nav-link ${isActive('/cafe-management') ? 'active' : ''}`}>
                                        🏪 My Cafe
                                    </Link>
                                )}
                                {user.role === 'delivery' && (
                                    <Link to="/delivery-dashboard" className={`cc-nav-link ${isActive('/delivery-dashboard') ? 'active' : ''}`}>
                                        🚚 Deliveries
                                    </Link>
                                )}
                                <Link to="/orders" className={`cc-nav-link ${isActive('/orders') ? 'active' : ''}`}>
                                    📋 Orders
                                </Link>
                                <Link to="/cart" className={`cc-nav-link ${isActive('/cart') ? 'active' : ''}`}>
                                    🛒 Cart
                                    {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                                </Link>
                                <Link to="/profile" className={`cc-nav-link ${isActive('/profile') ? 'active' : ''}`}>
                                    👤 {user.username}
                                </Link>
                                <button onClick={handleLogout} style={styles.logoutBtn}>
                                    🚪 Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="cc-nav-link">Login</Link>
                                <Link to="/register" className="cc-nav-link">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

const styles = {
    navbar: {
        backgroundColor: '#E8532B',
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
        position: 'relative',
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
        gap: '6px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    cartBadge: {
        backgroundColor: '#e74c3c',
        color: 'white',
        borderRadius: '50%',
        padding: '2px 6px',
        fontSize: '11px',
        marginLeft: '5px',
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
};

export default Navbar;
