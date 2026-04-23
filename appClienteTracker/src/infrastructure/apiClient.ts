import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { config } from '../config/environment';

export const BASE_URL = config.api.baseUrl;

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: config.api.timeoutMs,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cached network state — updated by listener, read synchronously per-request.
// Avoids 100-200ms NetInfo.fetch() latency on every request.
let _netState: { isConnected: boolean | null; isInternetReachable: boolean | null } = {
    isConnected: true,
    isInternetReachable: true,
};

NetInfo.addEventListener((state: NetInfoState) => {
    _netState = {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
    };
});

// Seed initial state (don't block — listener will update shortly).
NetInfo.fetch().then((state) => {
    _netState = {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
    };
}).catch(() => { /* ignore */ });

// Callback registered by AuthProvider to clear React auth state on 401.
// Navigation is handled by _layout.tsx reacting to user becoming null.
let _onUnauthorized: (() => void) | null = null;
// Single in-flight promise for 401 handling — concurrent 401s await the same clear.
let _unauthorizedPromise: Promise<void> | null = null;

export function setUnauthorizedCallback(cb: () => void) {
    _onUnauthorized = cb;
}

async function handleUnauthorized(): Promise<void> {
    if (__DEV__) console.warn('Unauthorized request - Token may be invalid or expired');
    await SecureStore.deleteItemAsync('client_jwt');
    await SecureStore.deleteItemAsync('client_info');
    _onUnauthorized?.();
}

// Interceptor to inject JWT + short-circuit offline requests
apiClient.interceptors.request.use(
    async (config) => {
        if (_netState.isConnected === false || _netState.isInternetReachable === false) {
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

// Response interceptor: on 401, coalesce concurrent handlers into single promise.
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            if (!_unauthorizedPromise) {
                _unauthorizedPromise = handleUnauthorized().finally(() => {
                    // Allow re-trigger only after login produces a new valid token.
                    // Reset after microtask so all concurrent 401s await same clear.
                    setTimeout(() => { _unauthorizedPromise = null; }, 0);
                });
            }
            await _unauthorizedPromise;
        }
        return Promise.reject(error);
    }
);
