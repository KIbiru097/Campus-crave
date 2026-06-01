import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import client from './apollo/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import MockPayment from './components/MockPayment';
import AdminDashboard from './pages/AdminDashboard';
import CafeManagement from './pages/CafeManagement';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

// Main App Content
function AppContent() {
    return (
        <>
            <Navbar />
            <div style={{ minHeight: 'calc(100vh - 60px)', padding: '20px' }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cafe/:cafeId" element={<MenuPage />} />
                    <Route path="/cart" element={
                        <ProtectedRoute>
                            <CartPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/checkout" element={
                        <ProtectedRoute>
                            <CheckoutPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/payment" element={
                        <ProtectedRoute>
                            <PaymentPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                        <ProtectedRoute>
                            <OrdersPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/mock-payment" element={
                        <ProtectedRoute>
                            <MockPayment />
                        </ProtectedRoute>
                    } />
                    <Route path="/payment/success" element={
                        <ProtectedRoute>
                            <MockPayment />
                        </ProtectedRoute>
                    } />
                    // Add these routes
<Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
<Route path="/cafe-management" element={<ProtectedRoute><CafeManagement /></ProtectedRoute>} />
                </Routes>
            </div>
        </>
    );
}

// Main App Component
function App() {
    return (
        <ApolloProvider client={client}>
            <Router>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </Router>
        </ApolloProvider>
    );
}

export default App;