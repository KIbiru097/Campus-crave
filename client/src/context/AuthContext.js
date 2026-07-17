import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            if (token && userData) {
                return JSON.parse(userData);
            }
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return null;
    });
    const [loading, setLoading] = useState(false);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};