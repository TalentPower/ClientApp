// ── Notification Domain Types ──

export interface PushNotificationPayload {
    type: 'TRIP_ALERT' | 'ETA_UPDATE' | 'BOARDING_CHECK' | 'ANNOUNCEMENT' | 'GENERAL';
    title: string;
    body: string;
    tripId?: number;
    routeId?: number;
    deepLink?: string;
}

export interface Announcement {
    id: string;
    title: string;
    description: string;
    date: string;
    type: 'warning' | 'info' | 'success';
}

export interface FcmTokenRegistration {
    token: string;
    platform: 'android' | 'ios';
    deviceId?: string;
}
