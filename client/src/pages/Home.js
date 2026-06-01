import React, { useState, useEffect } from 'react';
import CafeList from '../components/CafeList';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [featuredImages, setFeaturedImages] = useState({
        cafe1: null,
        cafe2: null,
        cafe3: null,
        cafe4: null
    });

    // Load dark mode preference from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode) {
            setDarkMode(savedMode === 'true');
        }
        
        // Load saved images from localStorage
        const savedImages = localStorage.getItem('featuredImages');
        if (savedImages) {
            setFeaturedImages(JSON.parse(savedImages));
        }
    }, []);

    // Save dark mode preference
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    // Save images to localStorage
    useEffect(() => {
        localStorage.setItem('featuredImages', JSON.stringify(featuredImages));
    }, [featuredImages]);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleImageUpload = (cafeKey, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFeaturedImages(prev => ({
                    ...prev,
                    [cafeKey]: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = (cafeKey) => {
        document.getElementById(`image-input-${cafeKey}`).click();
    };

    const featuredCafes = [
        { id: 'cafe1', name: 'Campus Brew Cafe', description: 'Fresh coffee & pastries', defaultIcon: '☕', defaultImage: null },
        { id: 'cafe2', name: 'Student Hub Diner', description: 'Burgers & fries', defaultIcon: '🍔', defaultImage: null },
        { id: 'cafe3', name: 'Green Leaf Salad Bar', description: 'Healthy options', defaultIcon: '🥗', defaultImage: null },
        { id: 'cafe4', name: 'Pizza Piazza', description: 'Authentic Italian pizza', defaultIcon: '🍕', defaultImage: null }
    ];

    return (
        <div style={{ ...styles.container, ...(darkMode && styles.containerDark) }}>
            {/* Dark Mode Toggle Button */}
            <button onClick={toggleDarkMode} style={{ ...styles.darkModeToggle, ...(darkMode && styles.darkModeToggleDark) }}>
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {/* Wave Hero Section */}
            <div style={{ ...styles.hero, ...(darkMode && styles.heroDark) }}>
                <div style={styles.waveContainer}>
                    <svg style={styles.wave} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                        <path fill={darkMode ? '#2d1b0e' : '#FF6B35'} fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                    </svg>
                </div>
                
                <div className="animate-fadeIn" style={styles.heroContent}>
                    <div style={styles.heroEmojiContainer}>
                        <span style={styles.heroEmoji}>🍕</span>
                        <span style={styles.heroEmoji}>☕</span>
                        <span style={styles.heroEmoji}>🥗</span>
                    </div>
                    <h1 style={{ ...styles.heroTitle, ...(darkMode && styles.heroTitleDark) }}>
                        Campus Crave
                    </h1>
                    <p style={{ ...styles.heroText, ...(darkMode && styles.heroTextDark) }}>
                        Your favorite campus cafes, now at your fingertips.
                        Order ahead, skip the line, and enjoy more time with friends.
                    </p>
                    {!user && (
                        <div style={styles.heroButtons}>
                            <button 
                                onClick={() => window.location.href = '/register'} 
                                style={styles.primaryBtn}
                                className="hover-lift"
                                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                                Get Started ✨
                            </button>
                            <button 
                                onClick={() => window.location.href = '/login'} 
                                style={styles.secondaryBtn}
                                className="hover-lift"
                                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                                Login 🔑
                            </button>
                        </div>
                    )}
                    {user && (
                        <div style={styles.welcomeBadge}>
                            <span>👋 Welcome back, {user.username}!</span>
                        </div>
                    )}
                </div>
                
                {/* Floating Food Icons */}
                <div style={styles.floatingIcons}>
                    <div className="floating-icon" style={{ ...styles.floatingIcon, top: '20%', left: '10%', animationDelay: '0s' }}>🍔</div>
                    <div className="floating-icon" style={{ ...styles.floatingIcon, top: '60%', left: '85%', animationDelay: '1s' }}>🍟</div>
                    <div className="floating-icon" style={{ ...styles.floatingIcon, top: '70%', left: '15%', animationDelay: '2s' }}>🥤</div>
                    <div className="floating-icon" style={{ ...styles.floatingIcon, top: '30%', left: '75%', animationDelay: '0.5s' }}>🍩</div>
                    <div className="floating-icon" style={{ ...styles.floatingIcon, top: '80%', left: '50%', animationDelay: '1.5s' }}>🌮</div>
                </div>
            </div>

            {/* Stats Section */}
            <div style={{ ...styles.statsSection, ...(darkMode && styles.statsSectionDark) }}>
                <div className="animate-slideInLeft" style={styles.stat}>
                    <div style={styles.statIcon}>🏪</div>
                    <h3 style={{ ...styles.statNumber, ...(darkMode && styles.statNumberDark) }}>12+</h3>
                    <p style={{ ...styles.statLabel, ...(darkMode && styles.statLabelDark) }}>Campus Cafes</p>
                </div>
                <div className="animate-slideInLeft" style={{ ...styles.stat, animationDelay: '0.2s' }}>
                    <div style={styles.statIcon}>🍽️</div>
                    <h3 style={{ ...styles.statNumber, ...(darkMode && styles.statNumberDark) }}>50+</h3>
                    <p style={{ ...styles.statLabel, ...(darkMode && styles.statLabelDark) }}>Menu Items</p>
                </div>
                <div className="animate-slideInLeft" style={{ ...styles.stat, animationDelay: '0.4s' }}>
                    <div style={styles.statIcon}>👨‍🎓</div>
                    <h3 style={{ ...styles.statNumber, ...(darkMode && styles.statNumberDark) }}>1000+</h3>
                    <p style={{ ...styles.statLabel, ...(darkMode && styles.statLabelDark) }}>Happy Students</p>
                </div>
                <div className="animate-slideInLeft" style={{ ...styles.stat, animationDelay: '0.6s' }}>
                    <div style={styles.statIcon}>⭐</div>
                    <h3 style={{ ...styles.statNumber, ...(darkMode && styles.statNumberDark) }}>4.8</h3>
                    <p style={{ ...styles.statLabel, ...(darkMode && styles.statLabelDark) }}>Rating</p>
                </div>
            </div>

            {/* Features Section */}
            <div style={{ ...styles.featuresSection, ...(darkMode && styles.featuresSectionDark) }}>
                <h2 style={{ ...styles.sectionTitle, ...(darkMode && styles.sectionTitleDark) }}>Why Choose Campus Crave?</h2>
                <div style={styles.featuresGrid}>
                    <div className="hover-lift" style={{ ...styles.featureCard, ...(darkMode && styles.featureCardDark) }}>
                        <div style={styles.featureIcon}>⚡</div>
                        <h4>Fast Delivery</h4>
                        <p>Get your food delivered within 30 minutes</p>
                    </div>
                    <div className="hover-lift" style={{ ...styles.featureCard, ...(darkMode && styles.featureCardDark) }}>
                        <div style={styles.featureIcon}>💳</div>
                        <h4>Easy Payment</h4>
                        <p>Online or Cash on Delivery options available</p>
                    </div>
                    <div className="hover-lift" style={{ ...styles.featureCard, ...(darkMode && styles.featureCardDark) }}>
                        <div style={styles.featureIcon}>📍</div>
                        <h4>Real-time Tracking</h4>
                        <p>Track your order from cafe to your doorstep</p>
                    </div>
                    <div className="hover-lift" style={{ ...styles.featureCard, ...(darkMode && styles.featureCardDark) }}>
                        <div style={styles.featureIcon}>🎁</div>
                        <h4>Student Discounts</h4>
                        <p>Special offers and discounts for students</p>
                    </div>
                </div>
            </div>

            {/* Featured Cafes with Images Section */}
            <div style={{ ...styles.cafesSection, ...(darkMode && styles.cafesSectionDark) }}>
                <h2 style={{ ...styles.sectionTitle, ...(darkMode && styles.sectionTitleDark) }}>✨ Featured Cafes</h2>
                <div style={styles.featuredGrid}>
                    {featuredCafes.map(cafe => (
                        <div key={cafe.id} className="hover-lift" style={{ ...styles.featuredCard, ...(darkMode && styles.featuredCardDark) }}>
                            <div style={styles.imageContainer}>
                                {featuredImages[cafe.id] ? (
                                    <img 
                                        src={featuredImages[cafe.id]} 
                                        alt={cafe.name}
                                        style={styles.featuredImage}
                                    />
                                ) : (
                                    <div style={styles.imagePlaceholder}>
                                        <span style={styles.placeholderIcon}>{cafe.defaultIcon}</span>
                                        <p style={styles.placeholderText}>Click to add image</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id={`image-input-${cafe.id}`}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleImageUpload(cafe.id, e)}
                                />
                                <button 
                                    onClick={() => triggerFileInput(cafe.id)}
                                    style={styles.uploadButton}
                                >
                                    📷 Upload Image
                                </button>
                            </div>
                            <h3 style={styles.featuredCardTitle}>{cafe.name}</h3>
                            <p style={styles.featuredCardDesc}>{cafe.description}</p>
                            <button style={styles.orderButton}>Order Now →</button>
                        </div>
                    ))}
                </div>
                <CafeList />
            </div>

            {/* Bottom Wave */}
            <div style={styles.bottomWave}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill={darkMode ? '#2d1b0e' : '#FF6B35'} fillOpacity="1" d="M0,256L48,240C96,224,192,192,288,192C384,192,480,224,576,234.7C672,245,768,235,864,208C960,181,1056,139,1152,138.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        transition: 'all 0.3s ease',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    darkModeToggle: {
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 1000,
        padding: '10px 20px',
        backgroundColor: '#FF6B35',
        color: 'white',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
    },
    darkModeToggleDark: {
        backgroundColor: '#FF8C42',
    },
    hero: {
        position: 'relative',
        background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroDark: {
        background: 'linear-gradient(135deg, #2d1b0e 0%, #4a2c15 100%)',
    },
    waveContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    wave: {
        width: '100%',
        height: 'auto',
    },
    heroContent: {
        textAlign: 'center',
        color: 'white',
        zIndex: 2,
        maxWidth: '800px',
        padding: '20px',
    },
    heroEmojiContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '20px',
    },
    heroEmoji: {
        fontSize: '48px',
        animation: 'bounce 2s infinite',
    },
    heroTitle: {
        fontSize: '3.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
    },
    heroTitleDark: {
        color: '#fff',
    },
    heroText: {
        fontSize: '1.2rem',
        opacity: 0.95,
        lineHeight: 1.6,
        marginBottom: '2rem',
    },
    heroTextDark: {
        color: '#ccc',
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
        color: '#FF6B35',
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
    welcomeBadge: {
        display: 'inline-block',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '10px 20px',
        borderRadius: '30px',
        marginTop: '20px',
    },
    floatingIcons: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    floatingIcon: {
        position: 'absolute',
        fontSize: '30px',
        opacity: 0.6,
        animation: 'float 6s ease-in-out infinite',
    },
    statsSection: {
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        padding: '40px 20px',
        backgroundColor: 'white',
        marginTop: '-50px',
        position: 'relative',
        zIndex: 10,
        borderRadius: '30px',
        marginLeft: '20px',
        marginRight: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    },
    statsSectionDark: {
        backgroundColor: '#1e1e2e',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    },
    stat: {
        textAlign: 'center',
        padding: '20px',
        minWidth: '150px',
    },
    statIcon: {
        fontSize: '40px',
        marginBottom: '10px',
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#FF6B35',
        marginBottom: '5px',
    },
    statNumberDark: {
        color: '#FF8C42',
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
    },
    statLabelDark: {
        color: '#aaa',
    },
    featuresSection: {
        padding: '60px 20px',
        backgroundColor: '#f8f9fa',
    },
    featuresSectionDark: {
        backgroundColor: '#1a1a2e',
    },
    sectionTitle: {
        textAlign: 'center',
        fontSize: '32px',
        marginBottom: '40px',
        color: '#2c3e50',
    },
    sectionTitleDark: {
        color: '#fff',
    },
    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    featureCard: {
        textAlign: 'center',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
    },
    featureCardDark: {
        backgroundColor: '#2d2d3d',
        color: '#fff',
    },
    featureIcon: {
        fontSize: '48px',
        marginBottom: '15px',
    },
    cafesSection: {
        padding: '60px 20px',
        backgroundColor: '#f5f7fa',
    },
    cafesSectionDark: {
        backgroundColor: '#121212',
    },
    featuredGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto 60px auto',
    },
    featuredCard: {
        backgroundColor: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
    },
    featuredCardDark: {
        backgroundColor: '#2d2d3d',
        color: '#fff',
    },
    imageContainer: {
        position: 'relative',
        height: '200px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff5f0',
    },
    placeholderIcon: {
        fontSize: '48px',
        marginBottom: '10px',
    },
    placeholderText: {
        fontSize: '14px',
        color: '#999',
    },
    uploadButton: {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        padding: '8px 15px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.3s ease',
    },
    featuredCardTitle: {
        padding: '15px 15px 5px 15px',
        fontSize: '18px',
        margin: 0,
    },
    featuredCardDesc: {
        padding: '0 15px 15px 15px',
        fontSize: '14px',
        color: '#666',
    },
    orderButton: {
        margin: '0 15px 20px 15px',
        padding: '10px 20px',
        backgroundColor: '#FF6B35',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontWeight: 'bold',
        width: 'calc(100% - 30px)',
        transition: 'all 0.3s ease',
    },
    bottomWave: {
        marginTop: '-10px',
    },
};

// Add keyframe animations to document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.8s ease-out;
    }
    
    .animate-slideInLeft {
        animation: slideInLeft 0.6s ease-out forwards;
        opacity: 0;
    }
    
    .animate-slideInLeft:nth-child(1) { animation-delay: 0s; }
    .animate-slideInLeft:nth-child(2) { animation-delay: 0.2s; }
    .animate-slideInLeft:nth-child(3) { animation-delay: 0.4s; }
    .animate-slideInLeft:nth-child(4) { animation-delay: 0.6s; }
    
    .hover-lift {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .hover-lift:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    
    .floating-icon {
        animation: float 6s ease-in-out infinite;
    }
    
    body.dark-mode {
        background-color: #121212;
    }
`;
document.head.appendChild(styleSheet);

export default Home;