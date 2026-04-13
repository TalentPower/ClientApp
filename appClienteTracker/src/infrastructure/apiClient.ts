import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Set this to your external server URL
export const BASE_URL = 'https://api-sipe.com';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to inject JWT on every request securely
apiClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('client_jwt');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle unified error messages
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // We can handle global 401s here to force a logout redirect later
        if (error.response?.status === 401) {
            console.warn('Unauthorized request - Token may be invalid or expired');
            await SecureStore.deleteItemAsync('client_jwt');
            await SecureStore.deleteItemAsync('client_info');
            try {
                if (router && router.replace) {
                    router.replace('/login');
                }
            } catch (e) {
                console.warn('Router replace failed out of context');
            }
        }
        return Promise.reject(error);
    }
);
