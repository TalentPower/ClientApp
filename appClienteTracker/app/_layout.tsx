import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '@/src/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth, AuthProvider } from '@/src/hooks/useAuth';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { OfflineBanner } from '@/src/components/OfflineBanner';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export const unstable_settings = {
    anchor: '(tabs)',
};

const AppTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: Colors.accent,
        background: Colors.primary,
        card: Colors.secondary,
        text: Colors.textPrimary,
        border: Colors.border,
    },
};

function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const [isNavigationReady, setIsNavigationReady] = useState(false);

    // Initialize push notifications (registers FCM token with backend)
    usePushNotifications();

    useEffect(() => {
        setIsNavigationReady(true);
    }, []);

    useEffect(() => {
        if (!isNavigationReady || isLoading) return;

        const isAuthGroup = segments[0] === 'login' || segments[0] === 'register';

        if (!user && !isAuthGroup) {
            router.replace('/login');
        } else if (user && isAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, isLoading, segments, isNavigationReady]);

    if (isLoading || !isNavigationReady) {
        return (
            <View style={{ flex: 1, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.accent} />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.primary }}>
            <ThemeProvider value={AppTheme}>
                <Stack>
                    <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
                    <Stack.Screen name="register" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
                    <Stack.Screen name="(modals)/event-modal" options={{ presentation: 'modal', headerShown: false }} />
                </Stack>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }} pointerEvents="box-none">
                    <OfflineBanner />
                </View>
                <StatusBar style="light" />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
