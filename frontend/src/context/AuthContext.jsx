import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchProfile();
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const response = await apiClient.get('/user/profile');
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userId, password) => {
        try {
            const response = await apiClient.post('/auth/login', { userId, password });
            const { token } = response.data;

            localStorage.setItem('token', token);
            setToken(token);

            // Fetch user profile
            const profileResponse = await apiClient.get('/user/profile');
            setUser(profileResponse.data);

            return profileResponse.data;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const response = await apiClient.get('/user/profile');
            setUser(response.data);
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
