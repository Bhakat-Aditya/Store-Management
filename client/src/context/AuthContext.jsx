import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate user state from local storage on reload
        const token = localStorage.getItem('tenantToken');
        const shopDetails = localStorage.getItem('shopDetails');
        
        if (token && shopDetails) {
            setUser(JSON.parse(shopDetails));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        localStorage.setItem('tenantToken', res.data.token);
        localStorage.setItem('shopDetails', JSON.stringify(res.data.shopDetails));
        setUser(res.data.shopDetails);
    };

    const logout = () => {
        localStorage.removeItem('tenantToken');
        localStorage.removeItem('shopDetails');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};