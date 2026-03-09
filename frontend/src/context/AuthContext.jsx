/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(async () => {
        try {
            if (user && user.userId) {
                await apiClient.post('/auth/logout', { userId: user.userId });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
    }, [user]);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/user/profile');
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        if (token) {
            if (!user) {
                fetchProfile();
            } else {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [token, user, fetchProfile]);

    const login = async (userId, password) => {
        const response = await apiClient.post('/auth/login', { userId, password });
        if (response.data.mfaRequired) {
            return {
                mfaRequired: true,
                mfaToken: response.data.mfaToken,
                userId
            };
        }
        const { token } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        const profileResponse = await apiClient.get('/user/profile');
        setUser(profileResponse.data);
        return profileResponse.data;
    };

    const verifyMfa = async (mfaToken, code) => {
        const response = await apiClient.post('/auth/verify-mfa', { mfaToken, code });
        const { token } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        const profileResponse = await apiClient.get('/user/profile');
        setUser(profileResponse.data);
        return profileResponse.data;
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
                verifyMfa,
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
