import React from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { GET_CAFES } from '../graphql/queries';

const CafeList = () => {
    const { loading, error, data } = useQuery(GET_CAFES);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorMessage message={error.message} />;

    const cafes = data?.cafes || [];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>✨ Featured Cafes</h2>
                <p style={styles.subtitle}>Discover the best food spots on campus</p>
            </div>
            <div style={styles.grid}>
                {cafes.map((cafe, index) => (
                    <Link to={`/cafe/${cafe.id}`} key={cafe.id} style={styles.cardLink}>
                        <div 
                            className="hover-lift"
                            style={{ ...styles.card, animationDelay: `${index * 0.1}s` }}
                        >
                            <div style={styles.cardIcon}>
                                <span style={styles.iconEmoji}>🏪</span>
                            </div>
                            <h3 style={styles.cafeName}>{cafe.name}</h3>
                            <p style={styles.description}>{cafe.description || 'Fresh meals prepared daily with love ❤️'}</p>
                            <div style={styles.info}>
                                <span style={styles.location}>📍 {cafe.location}</span>
                                <span style={styles.phone}>📞 {cafe.contact_phone || 'N/A'}</span>
                            </div>
                            <div style={cafe.is_active ? styles.open : styles.closed}>
                                {cafe.is_active ? (
                                    <span style={styles.openBadge}>🟢 Open Now</span>
                                ) : (
                                    <span style={styles.closedBadge}>🔴 Closed</span>
                                )}
                            </div>
                            <div style={styles.viewMore}>
                                <span>View Menu →</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div style={styles.container}>
        <div style={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} style={styles.card}>
                    <div className="skeleton" style={{ height: '150px', borderRadius: '12px' }}></div>
                </div>
            ))}
        </div>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
            <span style={styles.errorIcon}>😢</span>
            <h3>Oops! Something went wrong</h3>
            <p>{message}</p>
            <button onClick={() => window.location.reload()} style={styles.retryBtn}>
                Try Again
            </button>
        </div>
    </div>
);

const styles = {
    container: {
        padding: '2rem 1rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    header: {
        textAlign: 'center',
        marginBottom: '2rem',
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#2d6a4f',
        marginBottom: '0.5rem',
    },
    subtitle: {
        fontSize: '1rem',
        color: '#52b788',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
    },
    cardLink: {
        textDecoration: 'none',
        color: 'inherit',
    },
    card: {
        background: '#fffef7',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 4px 15px rgba(45, 106, 79, 0.1)',
        transition: 'all 0.3s ease',
        border: '1px solid #d8f3dc',
    },
    cardIcon: {
        textAlign: 'center',
        marginBottom: '0.75rem',
    },
    iconEmoji: {
        fontSize: '2.5rem',
    },
    cafeName: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#1b4332',
        marginBottom: '0.5rem',
        textAlign: 'center',
    },
    description: {
        color: '#52b788',
        lineHeight: '1.5',
        marginBottom: '0.75rem',
        textAlign: 'center',
        fontSize: '0.85rem',
    },
    info: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#74c69d',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    location: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    phone: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    open: {
        textAlign: 'center',
        marginBottom: '0.75rem',
    },
    openBadge: {
        display: 'inline-block',
        background: '#2d6a4f',
        color: 'white',
        padding: '0.25rem 1rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
    },
    closed: {
        textAlign: 'center',
        marginBottom: '0.75rem',
    },
    closedBadge: {
        display: 'inline-block',
        background: '#d8f3dc',
        color: '#2d6a4f',
        padding: '0.25rem 1rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
    },
    viewMore: {
        textAlign: 'center',
        color: '#52b788',
        fontWeight: '600',
        fontSize: '0.85rem',
    },
    errorContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '1rem',
    },
    errorCard: {
        textAlign: 'center',
        background: '#fffef7',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(45, 106, 79, 0.1)',
    },
    errorIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    retryBtn: {
        marginTop: '1rem',
        padding: '0.5rem 1.5rem',
        background: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
    },
};

export default CafeList;