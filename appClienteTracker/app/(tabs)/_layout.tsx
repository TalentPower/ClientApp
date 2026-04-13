import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/src/constants/Colors';
import { BlurView } from 'expo-blur';

export default function TabLayout() {

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarActiveTintColor: Colors.accent,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: styles.tabBar,
                tabBarBackground: () => (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                ),
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Mi Ruta',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="hub"
                options={{
                    title: 'Mi Hub',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Mi QR',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode" color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 24 : 16,
        left: 16,
        right: 16,
        elevation: 0,
        backgroundColor: 'transparent',
        borderRadius: 24,
        height: 60,
        borderTopWidth: 0,
        overflow: 'hidden',
    },
});
