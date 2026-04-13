import { apiClient } from './apiClient';
import { AuthResponse, LoginCredentials } from '../domain/Auth';
import * as SecureStore from 'expo-secure-store';

interface BackendApiResponse<T> {
    message: string;
    data: T;
    success: boolean;
}

export class AuthRepository {
    /**
     * POST /api/client/auth/login
     * Uses the dedicated ClientAuthController which returns:
     * { jwt, userId, name, email, companyId }
     */
    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiClient.post<BackendApiResponse<AuthResponse>>(
            '/api/client/auth/login',
            {
                email: credentials.email,
                password: credentials.password,
            }
        );

        const authData = response.data.data;
        if (authData.jwt) {
            await SecureStore.setItemAsync('client_jwt', authData.jwt);
            await SecureStore.setItemAsync('client_info', JSON.stringify(authData));
        }

        return authData;
    }

    static async logout(): Promise<void> {
        await SecureStore.deleteItemAsync('client_jwt');
        await SecureStore.deleteItemAsync('client_info');
    }

    static async getStoredAuth(): Promise<AuthResponse | null> {
        const data = await SecureStore.getItemAsync('client_info');
        if (data) {
            return JSON.parse(data) as AuthResponse;
        }
        return null;
    }
}
