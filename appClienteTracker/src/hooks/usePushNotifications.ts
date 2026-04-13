import { useState, useEffect, useRef, useCallback } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { NotificationRepository } from '../infrastructure/NotificationRepository';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowList: true,
        shouldShowBanner: true,
    } as any),
});

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const router = useRouter();

    // Register token with backend when obtained
    const registerTokenWithBackend = useCallback(async (token: string) => {
        if (!token || token.startsWith('Error')) return;
        try {
            await NotificationRepository.registerFcmToken(token);
            console.log('FCM token registrado en backend');
        } catch (err) {
            console.warn('No se pudo registrar el FCM token:', err);
        }
    }, []);

    useEffect(() => {
        registerForPushNotificationsAsync()
            .then((token) => {
                const t = token ?? '';
                setExpoPushToken(t);
                // Register with the SIPE backend
                if (t) registerTokenWithBackend(t);
            })
            .catch((error: any) => setExpoPushToken(`${error}`));

        // Listener: notification received while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
            setNotification(notif);
        });

        // Listener: user tapped a notification → deep link
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            // Deep-link to the appropriate screen
            if (data?.tripId) {
                router.push('/(tabs)');
            } else if (data?.deepLink && typeof data.deepLink === 'string') {
                router.push(data.deepLink as any);
            }
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, [registerTokenWithBackend, router]);

    return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (projectId) {
                token = (
                    await Notifications.getExpoPushTokenAsync({ projectId })
                ).data;
            }
        } catch (e) {
            token = `${e}`;
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
