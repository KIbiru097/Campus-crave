import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { REGISTER_USER } from '../../graphql/mutations';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        phone: '',
        reg_no: '',
        institution: '',
        department: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [registerMutation] = useMutation(REGISTER_USER);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await registerMutation({
                variables: {
                    input: formData
                }
            });

            if (data?.register) {
                login(data.register.token, data.register.user);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create Account</h2>
                <form onSubmit={handleSubmit}>
                    <div style={styles.row}>
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            style={styles.inputHalf}
                            required
                        />
                        <input
                            type="text"
                            name="full_name"
                            placeholder="Full Name"
                            value={formData.full_name}
                            onChange={handleChange}
                            style={styles.inputHalf}
                            required
                        />
                    </div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <div style={styles.row}>
                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={handleChange}
                            style={styles.inputHalf}
                        />
                        <input
                            type="text"
                            name="reg_no"
                            placeholder="Registration Number"
                            value={formData.reg_no}
                            onChange={handleChange}
                            style={styles.inputHalf}
                            required
                        />
                    </div>
                    <input
                        type="text"
                        name="institution"
                        placeholder="Institution"
                        value={formData.institution}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <input
                        type="text"
                        name="department"
                        placeholder="Department"
                        value={formData.department}
                        onChange={handleChange}
                        style={styles.input}
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>
                <p style={styles.footer}>
                    Already have an account? <Link to="/login" style={styles.link}>Login here</Link>
                </p>
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
    },
    card: {
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '550px',
    },
    title: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#2c3e50',
    },
    row: {
        display: 'flex',
        gap: '15px',
        marginBottom: '15px',
    },
    input: {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    inputHalf: {
        width: 'calc(50% - 7.5px)',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    error: {
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#fdecea',
        borderRadius: '5px',
    },
    footer: {
        textAlign: 'center',
        marginTop: '20px',
    },
    link: {
        color: '#3498db',
        textDecoration: 'none',
    },
};

export default Register;