'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { IUser } from '@/types';
import { apiService } from '@/services/api.service';
import { useRouter } from 'next/navigation';

interface AuthContextValue {
    user: IUser | null;
    isLoading: boolean;
    loading: boolean;
    refreshUser: () => Promise<void>;
    setUser: (user: IUser | null) => void;
    logout: () => Promise<void>;
    logoutAllDevices: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    const refreshUser = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await apiService.getProfile();
            if (res.success && res.data) {
                setUser(res.data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const logout = async () => {
        try {
            await apiService.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            router.push('/login');
        }
    };

    const logoutAllDevices = async () => {
        try {
            await apiService.logoutAllDevices();
        } catch (err) {
            console.error('Logout all devices error:', err);
        } finally {
            setUser(null);
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                loading: isLoading,
                refreshUser,
                setUser,
                logout,
                logoutAllDevices,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
