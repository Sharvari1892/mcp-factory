import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { setAccessToken } from '../api/axios';
import * as authApi from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const accessTokenRef = useRef(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const parseJwt = (token) => {
        try {
            // Split the token to get the middle section (payload)
            const base64Url = token.split('.')[1];
            // Replace url safe characters with standard base64 characters
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            // Decode using atob and parse as JSON
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Failed to decode JWT token", e);
            return null;
        }
    };

    const handleAuthSuccess = (token) => {
        accessTokenRef.current = token;
        setAccessToken(token);
        const decoded = parseJwt(token);
        if (decoded && (decoded.userId || decoded.id)) {
            setUser({ userId: decoded.userId || decoded.id });
        } else {
            setUser(null);
        }
    };

    const handleAuthClear = () => {
        accessTokenRef.current = null;
        setAccessToken(null);
        setUser(null);
    };

    const login = async (email, password) => {
        const data = await authApi.login(email, password);
        handleAuthSuccess(data.accessToken);
        return data;
    };

    const register = async (email, password) => {
        const data = await authApi.register(email, password);
        handleAuthSuccess(data.accessToken);
        return data;
    };

    const logout = async () => {
        handleAuthClear();
        // Redirect to /login
        window.location.href = '/login';
    };

    // Auto-refresh token on component mount
    useEffect(() => {
        async function silentRefresh() {
            try {
                const data = await authApi.refresh();
                handleAuthSuccess(data.accessToken);
            } catch (err) {
                handleAuthClear();
            } finally {
                setLoading(false);
            }
        }
        silentRefresh();
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export default useAuth;
