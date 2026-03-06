import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Only fetch if user is not already set (prevents double fetch on login)
            if (!user) {
                fetchProfile();
            } else {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [token, user]);

    const fetchProfile = async () => {
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
    };

    const login = async (userId, password) => {
        try {
            const response = await apiClient.post('/auth/login', { userId, password });

            // Check if MFA is required
            if (response.data.mfaRequired) {
                // Return MFA info — caller (LoginPage) will redirect to MFA verify
                return {
                    mfaRequired: true,
                    mfaToken: response.data.mfaToken,
                    userId
                };
            }

            // Normal login (no MFA)
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

    const verifyMfa = async (mfaToken, code) => {
        try {
            const response = await apiClient.post('/auth/verify-mfa', { mfaToken, code });
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

    const logout = async () => {
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
