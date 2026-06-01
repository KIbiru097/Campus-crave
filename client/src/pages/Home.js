import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_MENU_ITEMS, GET_CAFES } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [popularItems, setPopularItems] = useState([]);

    // Fetch cafes for stats
    const { data: cafesData } = useQuery(GET_CAFES);
    
    // Fetch menu items for popular dishes
    const { loading: menuLoading, data: menuData } = useQuery(GET_MENU_ITEMS, {
        variables: { cafeId: null } // Get all menu items across cafes
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Get popular items (first 6 from menu)
    useEffect(() => {
        if (menuData?.menuItems) {
            // Get unique items or first 6
            const items = menuData.menuItems.slice(0, 6);
            setPopularItems(items);
        }
    }, [menuData]);

    const cafes = cafesData?.cafes || [];
    const totalMenuItems = menuData?.menuItems?.length || 0;

    // Get food emoji based on category
    const getFoodEmoji = (category) => {
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
            'Lunch': '🍱',
            'Main Dishes': '🍽️',
        };
        return emojiMap[category] || '🍽️';
    };

    return (
        <div style={styles.container}>
            {/* Hero Section */}
            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <div style={styles.foodAnimation}>
                        <span style={styles.flyingFood}>🍕</span>
                        <span style={styles.flyingFood2}>🍔</span>
                        <span style={styles.flyingFood3}>☕</span>
                        <span style={styles.flyingFood4}>🥗</span>
                    </div>
                    <h1 style={styles.heroTitle}>
                        <span style={styles.heroEmoji}>🍽️</span>
                        Campus Crave
                        <span style={styles.heroEmoji}>✨</span>
                    </h1>
                    <p style={styles.heroText}>
                        Your favorite campus cafes, now at your fingertips.
                        Order ahead, skip the line, and enjoy more time with friends.
                    </p>
                    {!user && (
                        <div style={styles.heroButtons}>
                            <Link to="/register">
                                <button style={styles.primaryBtn}>Get Started ✨</button>
                            </Link>
                            <Link to="/login">
                                <button style={styles.secondaryBtn}>Login 🔑</button>
                            </Link>
                        </div>
                    )}
                    {user && (
                        <div style={styles.welcomeBadge}>
                            <span>👋 Welcome back, {user.username}!</span>
                            {user.role === 'admin' && (
                                <Link to="/admin">
                                    <button style={styles.adminBtn}>Admin Dashboard</button>
                                </Link>
                            )}
                            {(user.role === 'owner' || user.role === 'staff') && (
                                <Link to="/cafe-management">
                                    <button style={styles.ownerBtn}>Manage Cafe</button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Section */}
            <div style={styles.statsSection}>
                <div style={styles.stat}>
                    <div style={styles.statIcon}>🏪</div>
                    <h3>{cafes.length}+</h3>
                    <p>Campus Cafes</p>
                </div>
                <div style={styles.stat}>
                    <div style={styles.statIcon}>🍽️</div>
                    <h3>{totalMenuItems}+</h3>
                    <p>Menu Items</p>
                </div>
                <div style={styles.stat}>
                    <div style={styles.statIcon}>👨‍🎓</div>
                    <h3>1000+</h3>
                    <p>Happy Students</p>
                </div>
                <div style={styles.stat}>
                    <div style={styles.statIcon}>⭐</div>
                    <h3>4.8</h3>
                    <p>Rating</p>
                </div>
            </div>

            {/* Popular Dishes Section - Fetched from Database */}
            <div style={styles.featuredSection}>
                <h2 style={styles.sectionTitle}>🔥 Popular Dishes</h2>
                {menuLoading ? (
                    <div style={styles.loadingContainer}>
                        <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '16px' }}></div>
                    </div>
                ) : (
                    <div style={styles.featuredGrid}>
                        {popularItems.map((item, index) => (
                            <div key={item.id} style={styles.featuredCard}>
                                <div style={styles.foodImage}>{getFoodEmoji(item.category)}</div>
                                <h4>{item.name}</h4>
                                <p>{item.category}</p>
                                <span style={styles.foodPrice}>ETB {item.price}</span>
                                <Link to={`/cafe/${item.cafe_id}`}>
                                    <button style={styles.orderBtn}>Order Now →</button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Features Section */}
            <div style={styles.featuresSection}>
                <h2 style={styles.sectionTitle}>Why Choose Campus Crave?</h2>
                <div style={styles.featuresGrid}>
                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>⚡</div>
                        <h4>Fast Delivery</h4>
                        <p>Get your food within 30 minutes</p>
                    </div>
                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>💳</div>
                        <h4>Easy Payment</h4>
                        <p>Online or Cash on Delivery</p>
                    </div>
                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>📍</div>
                        <h4>Real-time Tracking</h4>
                        <p>Track your order live</p>
                    </div>
                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>🎁</div>
                        <h4>Student Discounts</h4>
                        <p>Special offers for students</p>
                    </div>
                </div>
            </div>

            {/* Cafes Section */}
            <div style={styles.cafesSection}>
                <h2 style={styles.sectionTitle}>📍 Our Cafes</h2>
                <div style={styles.cafesGrid}>
                    {cafes.slice(0, 4).map((cafe) => (
                        <Link to={`/cafe/${cafe.id}`} key={cafe.id} style={styles.cafeCardLink}>
                            <div style={styles.cafeCard}>
                                <div style={styles.cafeIcon}>🏪</div>
                                <h4>{cafe.name}</h4>
                                <p>{cafe.location}</p>
                                <span style={styles.cafeStatus}>
                                    {cafe.is_active ? '🟢 Open' : '🔴 Closed'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
                <div style={styles.viewAll}>
                    <Link to="/">
                        <button style={styles.viewAllBtn}>View All Cafes →</button>
                    </Link>
                </div>
            </div>

            {/* Call to Action */}
            <div style={styles.ctaSection}>
                <h2>Ready to Crave?</h2>
                <p>Join thousands of students enjoying delicious meals from campus cafes</p>
                {!user && (
                    <Link to="/register">
                        <button style={styles.ctaBtn}>Sign Up Now</button>
                    </Link>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#fffef7',
    },
    hero: {
        background: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
        padding: '80px 20px',
        position: 'relative',
        overflow: 'hidden',
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
    },
    foodAnimation: {
        position: 'relative',
        height: '100px',
        marginBottom: '20px',
    },
    flyingFood: {
        position: 'absolute',
        fontSize: '45px',
        animation: 'float 3s ease-in-out infinite',
        left: '10%',
        top: '0',
    },
    flyingFood2: {
        position: 'absolute',
        fontSize: '40px',
        animation: 'float 4s ease-in-out infinite 0.5s',
        right: '10%',
        top: '20px',
    },
    flyingFood3: {
        position: 'absolute',
        fontSize: '35px',
        animation: 'float 3.5s ease-in-out infinite 1s',
        left: '30%',
        bottom: '0',
    },
    flyingFood4: {
        position: 'absolute',
        fontSize: '38px',
        animation: 'float 4.5s ease-in-out infinite 1.5s',
        right: '25%',
        top: '50px',
    },
    heroTitle: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        flexWrap: 'wrap',
    },
    heroEmoji: {
        fontSize: '48px',
    },
    heroText: {
        fontSize: '18px',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: '30px',
        lineHeight: '1.6',
    },
    heroButtons: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    primaryBtn: {
        padding: '12px 32px',
        fontSize: '16px',
        background: 'white',
        color: '#2d6a4f',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    secondaryBtn: {
        padding: '12px 32px',
        fontSize: '16px',
        background: 'transparent',
        color: 'white',
        border: '2px solid white',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    adminBtn: {
        padding: '8px 20px',
        fontSize: '14px',
        background: '#f39c12',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        marginLeft: '15px',
    },
    ownerBtn: {
        padding: '8px 20px',
        fontSize: '14px',
        background: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        marginLeft: '15px',
    },
    welcomeBadge: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
    },
    statsSection: {
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        padding: '40px 20px',
        backgroundColor: '#d8f3dc',
        marginTop: '-30px',
        marginLeft: '20px',
        marginRight: '20px',
        borderRadius: '30px',
    },
    stat: {
        textAlign: 'center',
        minWidth: '120px',
        padding: '15px',
    },
    statIcon: {
        fontSize: '40px',
        marginBottom: '10px',
    },
    featuredSection: {
        padding: '60px 20px',
    },
    sectionTitle: {
        textAlign: 'center',
        fontSize: '32px',
        color: '#2d6a4f',
        marginBottom: '40px',
    },
    featuredGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '25px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    featuredCard: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0 5px 20px rgba(45,106,79,0.1)',
        transition: 'transform 0.3s',
    },
    foodImage: {
        fontSize: '60px',
        marginBottom: '15px',
    },
    foodPrice: {
        display: 'inline-block',
        marginTop: '10px',
        padding: '5px 15px',
        backgroundColor: '#d8f3dc',
        color: '#2d6a4f',
        borderRadius: '20px',
        fontWeight: 'bold',
    },
    orderBtn: {
        marginTop: '12px',
        padding: '6px 16px',
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    featuresSection: {
        padding: '60px 20px',
        backgroundColor: '#f0fdf4',
    },
    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px',
        maxWidth: '1000px',
        margin: '0 auto',
    },
    featureCard: {
        textAlign: 'center',
        padding: '25px',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
    },
    featureIcon: {
        fontSize: '48px',
        marginBottom: '15px',
    },
    cafesSection: {
        padding: '60px 20px',
    },
    cafesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '25px',
        maxWidth: '1000px',
        margin: '0 auto',
    },
    cafeCardLink: {
        textDecoration: 'none',
        color: 'inherit',
    },
    cafeCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #d8f3dc',
        transition: 'transform 0.3s',
    },
    cafeIcon: {
        fontSize: '48px',
        marginBottom: '10px',
    },
    cafeStatus: {
        display: 'inline-block',
        marginTop: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    viewAll: {
        textAlign: 'center',
        marginTop: '30px',
    },
    viewAllBtn: {
        padding: '10px 30px',
        backgroundColor: 'transparent',
        border: '2px solid #2d6a4f',
        color: '#2d6a4f',
        borderRadius: '30px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    ctaSection: {
        textAlign: 'center',
        padding: '60px 20px',
        background: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
        color: 'white',
    },
    ctaBtn: {
        marginTop: '20px',
        padding: '12px 32px',
        fontSize: '16px',
        background: 'white',
        color: '#2d6a4f',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    loadingContainer: {
        padding: '40px',
        textAlign: 'center',
    },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    .skeleton {
        background: linear-gradient(90deg, #d8f3dc 25%, #fffef7 50%, #d8f3dc 75%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
    }
    @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
    }
`;
document.head.appendChild(styleSheet);

export default Home;