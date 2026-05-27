import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { REGISTER_USER } from '../../graphql/mutations';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        phone: '',
        reg_no: '',
        institution: '',
        department: '',
        year_of_study: '',
        gender: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [studentInfo, setStudentInfo] = useState(null);
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
                    input: {
                        username: formData.username,
                        full_name: formData.full_name,
                        email: formData.email,
                        password: formData.password,
                        phone: formData.phone,
                        reg_no: formData.reg_no,
                        institution: formData.institution,
                        department: formData.department,
                        year_of_study: parseInt(formData.year_of_study) || null
                    }
                }
            });

            if (data?.register) {
                login(data.register.token, data.register.user);
                setStudentInfo({
                    name: formData.full_name,
                    reg_no: formData.reg_no,
                    institution: formData.institution,
                    department: formData.department
                });
                setShowSuccess(true);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="success-modal-overlay">
                <div className="success-modal">
                    <div className="success-icon">✓</div>
                    <h2>Registration Successful!</h2>
                    <p>Welcome to Campus Crave, {formData.full_name}!</p>
                    <div className="student-info-card">
                        <h3>Student Information</h3>
                        <p><strong>Name:</strong> {studentInfo?.name}</p>
                        <p><strong>Registration No:</strong> {studentInfo?.reg_no}</p>
                        <p><strong>Institution:</strong> {studentInfo?.institution}</p>
                        <p><strong>Department:</strong> {studentInfo?.department}</p>
                    </div>
                    <p className="redirect-message">Redirecting to home page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="register-container">
            <div className="register-wrapper">
                <div className="register-illustration">
                    <div className="illustration-content">
                        <h1>Campus Crave</h1>
                        <p>Join our exclusive student community. Access student-only benefits and order from your favorite campus cafes.</p>
                        <div className="feature-list">
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Secure & verified registration</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Easy order placement</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Real-time order tracking</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Exclusive student discounts</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="register-form-container">
                    <div className="form-header">
                        <i className="fas fa-graduation-cap"></i>
                        <h2>Student Registration</h2>
                    </div>
                    
                    <h1 className="form-title">Create Your Account</h1>
                    <p className="form-subtitle">Fill in your details to get started</p>

                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <div className="input-icon">
                                    <i className="fas fa-user"></i>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <div className="input-icon">
                                    <i className="fas fa-id-badge"></i>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Choose a username"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Registration Number *</label>
                                <div className="input-icon">
                                    <i className="fas fa-id-card"></i>
                                    <input
                                        type="text"
                                        name="reg_no"
                                        value={formData.reg_no}
                                        onChange={handleChange}
                                        placeholder="e.g., CST/123/14"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Gender *</label>
                                <div className="input-icon">
                                    <i className="fas fa-venus-mars"></i>
                                    <select name="gender" value={formData.gender} onChange={handleChange} required>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email *</label>
                                <div className="input-icon">
                                    <i className="fas fa-envelope"></i>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <div className="input-icon">
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a password"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Phone</label>
                                <div className="input-icon">
                                    <i className="fas fa-phone"></i>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Your phone number"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Year / Batch</label>
                                <div className="input-icon">
                                    <i className="fas fa-calendar-alt"></i>
                                    <input
                                        type="text"
                                        name="year_of_study"
                                        value={formData.year_of_study}
                                        onChange={handleChange}
                                        placeholder="e.g., 3rd Year"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Institution *</label>
                                <div className="input-icon">
                                    <i className="fas fa-university"></i>
                                    <input
                                        type="text"
                                        name="institution"
                                        value={formData.institution}
                                        onChange={handleChange}
                                        placeholder="Your university/college"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Department *</label>
                                <div className="input-icon">
                                    <i className="fas fa-book"></i>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="Your department"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus"></i>
                                    Register Student
                                </>
                            )}
                        </button>

                        <p className="login-link">
                            Already have an account? <Link to="/login">Login here</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
