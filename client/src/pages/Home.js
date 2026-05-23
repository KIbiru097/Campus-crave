import React from 'react';
import CafeList from '../components/CafeList';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user } = useAuth();

    return (
        <div>
            <div style={styles.hero}>
                <h1 style={styles.heroTitle}>Welcome to Campus Crave</h1>
                <p style={styles.heroText}>Order food from your favorite campus cafes</p>
                {!user && (
                    <button 
                        onClick={() => window.location.href = '/login'} 
                        style={styles.ctaButton}
                    >
                        Get Started
                    </button>
                )}
            </div>
            <CafeList />
        </div>
    );
};

const styles = {
    hero: {
        textAlign: 'center',
        padding: '60px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
    },
    heroTitle: {
        fontSize: '48px',
        marginBottom: '20px',
    },
    heroText: {
        fontSize: '20px',
        marginBottom: '30px',
    },
    ctaButton: {
        padding: '12px 30px',
        fontSize: '16px',
        backgroundColor: 'white',
        color: '#764ba2',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};

export default Home;