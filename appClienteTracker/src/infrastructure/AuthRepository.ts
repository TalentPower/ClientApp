import { apiClient } from './apiClient';
import { AuthResponse, LoginCredentials, RegisterAutoResponse, RegisterExplicitResponse } from '../domain/Auth';
import * as SecureStore from 'expo-secure-store';
import { config } from '../config/environment';

interface BackendApiResponse<T> {
    message: string;
    data: T;
    success: boolean;
}

export class AuthRepository {
    /**
     * POST /api/client/auth/login
     * Uses the dedicated ClientAuthController which returns:
     * { jwt, userId, name, email, phone, companyId }
     */
    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiClient.post<BackendApiResponse<AuthResponse>>(
            '/api/client/auth/login',
            {
                phone: credentials.phone,
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

    /**
     * POST /api/client/auth/register/auto
     * Creates/resets passenger credentials. Password = last 3 digits of phone.
     * Returns the generated password in the response.
     */
    static async registerAuto(phone: string): Promise<RegisterAutoResponse> {
        const response = await apiClient.post<BackendApiResponse<RegisterAutoResponse>>(
            config.api.endpoints.auth.registerAuto,
            { phone }
        );
        return response.data.data;
    }

    /**
     * POST /api/client/auth/register/explicit
     * Creates/resets passenger credentials with an explicit password.
     */
    static async registerExplicit(phone: string, password: string): Promise<RegisterExplicitResponse> {
        const response = await apiClient.post<BackendApiResponse<RegisterExplicitResponse>>(
            config.api.endpoints.auth.registerExplicit,
            { phone, password }
        );
        return response.data.data;
    }
}
