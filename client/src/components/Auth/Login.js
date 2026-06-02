import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { LOGIN_USER } from '../../graphql/mutations';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [loginMutation] = useMutation(LOGIN_USER);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await loginMutation({
                variables: {
                    input: { email, password }
                }
            });

            if (data?.login) {
                const { token, user } = data.login;
                login(token, user);
                
                // Redirect based on user role
                if (user.role === 'admin') {
                    navigate('/admin');
                } else if (user.role === 'owner') {
                    navigate('/cafe-management');
                } else if (user.role === 'staff') {
                    navigate('/cafe-management');
                } else if (user.role === 'delivery') {
                    navigate('/delivery-dashboard');
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Welcome Back</h2>
                <p style={styles.subtitle}>Login to your account</p>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>
                    {error && <div style={styles.error}>{error}</div>}
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p style={styles.footer}>
                    Don't have an account? <Link to="/register" style={styles.link}>Register here</Link>
                </p>
                <div style={styles.demoCredentials}>
                    <p style={styles.demoTitle}>Demo Credentials:</p>
                    <div style={styles.demoGrid}>
                        <div>
                            <strong>Student:</strong><br />
                            Email: student@test.com<br />
                            Password: student123
                        </div>
                        <div>
                            <strong>Admin:</strong><br />
                            Email: admin@campuscrave.com<br />
                            Password: Admin123
                        </div>
                        <div>
                            <strong>Owner:</strong><br />
                            Email: owner@campuscrave.com<br />
                            Password: Owner123
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '20px',
        backgroundColor: '#f5f7fa',
    },
    card: {
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '450px',
    },
    title: {
        textAlign: 'center',
        marginBottom: '10px',
        color: '#2d6a4f',
        fontSize: '28px',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#52b788',
    },
    inputGroup: {
        marginBottom: '20px',
    },
    input: {
        width: '100%',
        padding: '14px',
        border: '1px solid #d8f3dc',
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'border 0.3s',
        outline: 'none',
    },
    button: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#2d6a4f',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background 0.3s',
    },
    error: {
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#fdecea',
        borderRadius: '8px',
    },
    footer: {
        textAlign: 'center',
        marginTop: '20px',
    },
    link: {
        color: '#2d6a4f',
        textDecoration: 'none',
    },
    demoCredentials: {
        marginTop: '25px',
        paddingTop: '20px',
        borderTop: '1px solid #d8f3dc',
    },
    demoTitle: {
        fontSize: '12px',
        color: '#666',
        marginBottom: '10px',
        textAlign: 'center',
    },
    demoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        fontSize: '11px',
        color: '#555',
    },
};

export default Login;