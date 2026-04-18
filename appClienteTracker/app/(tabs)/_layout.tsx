import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/src/constants/Colors';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const bottomOffset = Platform.OS === 'ios'
        ? Math.max(insets.bottom, 16) + 8
        : insets.bottom + 12;

    const isIos = Platform.OS === 'ios';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarActiveTintColor: Colors.accent,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarItemStyle: styles.tabBarItem,
                tabBarStyle: [
                    styles.tabBarBase,
                    isIos ? styles.tabBarIos : styles.tabBarAndroid,
                    { bottom: bottomOffset },
                ],
                // BlurView solo en iOS — en Android el backgroundColor del style es suficiente
                tabBarBackground: isIos
                    ? () => <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    : undefined,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Mi Ruta',
                    tabBarIcon: ({ color }) => <IconSymbol size={26} name="map.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="hub"
                options={{
                    title: 'Mi Hub',
                    tabBarIcon: ({ color }) => <IconSymbol size={26} name="bell.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Mi QR',
                    tabBarIcon: ({ color }) => <IconSymbol size={26} name="qrcode" color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarBase: {
        position: 'absolute',
        left: 16,
        right: 16,
        borderRadius: 24,
        height: 68,
        borderTopWidth: 0,
    },
    tabBarIos: {
        backgroundColor: 'transparent',
        overflow: 'hidden',
        elevation: 0,
    },
    tabBarAndroid: {
        backgroundColor: Colors.secondary,
        overflow: 'visible',
        elevation: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tabBarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        paddingBottom: 6,
        gap: 3,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
});
