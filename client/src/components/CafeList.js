import React from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { GET_CAFES } from '../graphql/queries';

const CafeList = () => {
    const { loading, error, data } = useQuery(GET_CAFES);

    if (loading) return <div className="loading">Loading cafes...</div>;
    if (error) return <div className="error">Error loading cafes: {error.message}</div>;

    const cafes = data?.cafes || [];

    if (cafes.length === 0) {
        return <div className="loading">No cafes available at the moment.</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>Campus Cafes</h1>
            <div style={styles.grid}>
                {cafes.map((cafe) => (
                    <Link to={`/cafe/${cafe.id}`} key={cafe.id} style={styles.cardLink}>
                        <div style={styles.card}>
                            <h3 style={styles.cafeName}>{cafe.name}</h3>
                            <p style={styles.description}>{cafe.description || 'No description available'}</p>
                            <div style={styles.info}>
                                <span>📍 {cafe.location}</span>
                                <span>📞 {cafe.contact_phone || 'N/A'}</span>
                            </div>
                            <div style={cafe.is_active ? styles.open : styles.closed}>
                                {cafe.is_active ? '🟢 Open Now' : '🔴 Closed'}
                            </div>
                        </div>
                    </Link>
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
    pageTitle: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#2c3e50',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
    },
    cardLink: {
        textDecoration: 'none',
        color: 'inherit',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        cursor: 'pointer',
    },
    cardHover: {
        transform: 'translateY(-5px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    },
    cafeName: {
        marginBottom: '10px',
        color: '#2c3e50',
        fontSize: '1.3rem',
    },
    description: {
        color: '#666',
        marginBottom: '15px',
        lineHeight: '1.4',
    },
    info: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: '#888',
        marginBottom: '10px',
    },
    open: {
        fontWeight: 'bold',
        color: '#27ae60',
        marginTop: '10px',
    },
    closed: {
        fontWeight: 'bold',
        color: '#e74c3c',
        marginTop: '10px',
    },
};

export default CafeList;