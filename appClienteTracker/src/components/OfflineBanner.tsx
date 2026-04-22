import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Colors, Spacing } from '../constants/Colors';

export function OfflineBanner() {
    const { isConnected, isInternetReachable } = useNetworkStatus();
    const offline = !isConnected || isInternetReachable === false;

    if (!offline) return null;

    return (
        <View style={styles.container} accessibilityRole="alert" accessibilityLabel="Sin conexión a internet">
            <Ionicons name="cloud-offline" size={16} color={Colors.white} />
            <Text style={styles.text}>Sin conexión. Reintentando al recuperar red...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.accentDanger,
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        paddingTop: Platform.OS === 'ios' ? 6 : 6,
    },
    text: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
});
