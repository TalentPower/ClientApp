import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthRepository } from '../infrastructure/AuthRepository';
import { AuthResponse, LoginCredentials } from '../domain/Auth';
import { setUnauthorizedCallback } from '../infrastructure/apiClient';

interface AuthContextType {
    user: AuthResponse | null;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initAuth = useCallback(async () => {
        try {
            const stored = await AuthRepository.getStoredAuth();
            if (stored) {
                setUser(stored);
            }
        } catch (e) {
            console.error('Failed to load stored auth:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Register 401 callback so apiClient can clear auth state without circular imports.
    // When token is invalid, apiClient calls this → user becomes null → _layout redirects to /login.
    useEffect(() => {
        setUnauthorizedCallback(() => {
            setUser(null);
            setError(null);
        });
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await AuthRepository.login(credentials);
            setUser(data);
            return data;
        } catch (err: any) {
            const data = err?.response?.data;
            setError(
                (Array.isArray(data?.details) && data.details[0]) ||
                data?.message ||
                'Credenciales incorrectas.'
            );
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AuthRepository.logout();
            setUser(null);
        } catch (e) {
            console.error('Logout error:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
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
