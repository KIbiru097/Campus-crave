import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import client from './apollo/client';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import MockPayment from './components/MockPayment';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';

function App() {
    return (
        <ApolloProvider client={client}>
            <BrowserRouter>
                <AuthProvider>
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/cafe/:cafeId" element={<MenuPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/mock-payment" element={<MockPayment />} />
                        <Route path="/payment/success" element={<MockPayment />} />
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
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ApolloProvider>
    );
}

export default App;
