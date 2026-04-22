import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { config } from '../config/environment';

export const BASE_URL = config.api.baseUrl;

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Callback registered by AuthProvider to clear React auth state on 401.
// Navigation is handled by _layout.tsx reacting to user becoming null.
let _onUnauthorized: (() => void) | null = null;
let _handling401 = false;

export function setUnauthorizedCallback(cb: () => void) {
    _onUnauthorized = cb;
}

// Interceptor to inject JWT + short-circuit offline requests
apiClient.interceptors.request.use(
    async (config) => {
        const net = await NetInfo.fetch();
        if (net.isConnected === false || net.isInternetReachable === false) {
            const err: any = new Error('Sin conexión a internet. Verifica tu red.');
            err.isOffline = true;
            err.code = 'OFFLINE';
            throw err;
        }
        const token = await SecureStore.getItemAsync('client_jwt');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: on 401 clear storage and notify AuthProvider once.
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !_handling401) {
            _handling401 = true;
            if (__DEV__) console.warn('Unauthorized request - Token may be invalid or expired');
            await SecureStore.deleteItemAsync('client_jwt');
            await SecureStore.deleteItemAsync('client_info');
            // Notify AuthProvider → sets user = null → _layout redirects to /login
            _onUnauthorized?.();
            // Reset flag after a tick so concurrent requests don't re-trigger
            setTimeout(() => { _handling401 = false; }, 2000);
        }
        return Promise.reject(error);
    }
);
