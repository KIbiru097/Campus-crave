import React from 'react';
import CafeList from '../components/CafeList';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user } = useAuth();

    return (
        <div>
            <div style={styles.hero}>
                <div className="animate-fadeIn" style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>
                        <span style={styles.heroEmoji}>🍕</span>
                        Welcome to Campus Crave
                        <span style={styles.heroEmoji}>☕</span>
                    </h1>
                    <p style={styles.heroText}>
                        Your favorite campus cafes, now at your fingertips.
                        Order ahead, skip the line, and enjoy more time with friends.
                    </p>
                    {!user && (
                        <div style={styles.heroButtons}>
                            <button 
                                onClick={() => window.location.href = '/register'} 
                                style={styles.primaryBtn}
                                className="hover-lift"
                            >
                                Get Started ✨
                            </button>
                            <button 
                                onClick={() => window.location.href = '/login'} 
                                style={styles.secondaryBtn}
                                className="hover-lift"
                            >
                                Login 🔑
                            </button>
                        </div>
                    )}
                </div>
                <div style={styles.heroStats}>
                    <div className="animate-slideInLeft" style={styles.stat}>
                        <h3>50+</h3>
                        <p>Menu Items</p>
                    </div>
                    <div className="animate-slideInLeft" style={{ ...styles.stat, animationDelay: '0.2s' }}>
                        <h3>10+</h3>
                        <p>Cafes</p>
                    </div>
                    <div className="animate-slideInLeft" style={{ ...styles.stat, animationDelay: '0.4s' }}>
                        <h3>1000+</h3>
                        <p>Happy Students</p>
                    </div>
                </div>
            </div>
            <CafeList />
        </div>
    );
};

const styles = {
    hero: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    heroTitle: {
        fontSize: '3.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        flexWrap: 'wrap',
    },
    heroEmoji: {
        fontSize: '3rem',
        animation: 'pulse 2s infinite',
    },
    heroText: {
        fontSize: '1.2rem',
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: '1.6',
        marginBottom: '2rem',
    },
    heroButtons: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    primaryBtn: {
        padding: '12px 32px',
        fontSize: '1rem',
        background: 'white',
        color: '#667eea',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
    },
    secondaryBtn: {
        padding: '12px 32px',
        fontSize: '1rem',
        background: 'transparent',
        color: 'white',
        border: '2px solid white',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
    },
    heroStats: {
        display: 'flex',
        justifyContent: 'center',
        gap: '3rem',
        marginTop: '3rem',
        position: 'relative',
        zIndex: 2,
        flexWrap: 'wrap',
    },
    stat: {
        textAlign: 'center',
        color: 'white',
    },
};

export default Home;