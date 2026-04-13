import { apiClient } from './apiClient';
import { Platform } from 'react-native';

interface BackendApiResponse<T> {
    message: string;
    data: T;
    success: boolean;
}

export class NotificationRepository {
    /**
     * POST /api/notifications/fcm-token
     * Registers the device's push token with the backend so it can
     * send targeted alerts (proximity, boarding checks, announcements).
     * Backend field is "pushToken" (matches FcmTokenRegistrationDto).
     */
    static async registerFcmToken(token: string): Promise<void> {
        await apiClient.post<BackendApiResponse<any>>(
            '/api/notifications/fcm-token',
            {
                pushToken: token,
                platform: Platform.OS, // 'android' | 'ios'
            }
        );
    }

    /**
     * GET /api/notifications
     * Fetches announcements for the user's company
     */
    static async getNotifications(companyId?: number): Promise<any[]> {
        const url = companyId 
            ? `/api/notifications?companyId=${companyId}&activeOnly=true&module=APP_PASAJERO` 
            : '/api/notifications?activeOnly=true&module=APP_PASAJERO';
            
        // We also fetch without module to get generic alerts
        const response = await apiClient.get<BackendApiResponse<any[]>>(url);
        return response.data.data;
    }
}
