import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BlurView } from 'expo-blur';
import { Colors, Radii, Shadows, Spacing } from '../constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface QrBoardingCardProps {
    qrPayload: string;
    userName: string;
    secondsLeft: number;
    isReady: boolean;
}

export function QrBoardingCard({ qrPayload, userName, secondsLeft, isReady }: QrBoardingCardProps) {
    const urgency = secondsLeft <= 10;

    return (
        <View style={styles.container}>
            <BlurView intensity={60} tint="dark" style={styles.blurWrapper}>
                {/* Header */}
                <View style={styles.header}>
                    <IconSymbol name="qrcode" size={22} color={Colors.accent} />
                    <Text style={styles.headerTitle}>Pase de Abordaje</Text>
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                    {isReady && qrPayload ? (
                        <View style={styles.qrWrapper}>
                            <QRCode
                                value={qrPayload}
                                size={200}
                                backgroundColor="white"
                                color="#0F172A"
                                ecl="M"
                            />
                        </View>
                    ) : (
                        <View style={styles.qrPlaceholder}>
                            <Text style={styles.placeholderText}>Generando código...</Text>
                        </View>
                    )}
                </View>

                {/* User name */}
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.instruction}>Muestra este código al conductor al abordar</Text>

                {/* Timer */}
                <View style={[styles.timerRow, urgency && styles.timerUrgent]}>
                    <IconSymbol
                        name="clock.fill"
                        size={14}
                        color={urgency ? Colors.accentDanger : Colors.textSecondary}
                    />
                    <Text style={[styles.timerText, urgency && styles.timerTextUrgent]}>
                        Se renueva en {secondsLeft}s
                    </Text>
                    <View style={styles.timerBar}>
                        <View
                            style={[
                                styles.timerFill,
                                {
                                    width: `${(secondsLeft / 60) * 100}%`,
                                    backgroundColor: urgency ? Colors.accentDanger : Colors.accent,
                                },
                            ]}
                        />
                    </View>
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Radii.xl,
        overflow: 'hidden',
        ...Shadows.elevationLg,
    },
    blurWrapper: {
        padding: Spacing.xl,
        backgroundColor: Colors.glassBackground,
        alignItems: 'center',
        gap: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    qrContainer: {
        marginVertical: Spacing.sm,
    },
    qrWrapper: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: Radii.lg,
        ...Shadows.elevationSm,
    },
    qrPlaceholder: {
        width: 232,
        height: 232,
        backgroundColor: Colors.secondary,
        borderRadius: Radii.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    instruction: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.secondary,
        borderRadius: Radii.md,
        width: '100%',
    },
    timerUrgent: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    timerText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    timerTextUrgent: {
        color: Colors.accentDanger,
    },
    timerBar: {
        flex: 1,
        height: 3,
        backgroundColor: Colors.border,
        borderRadius: Radii.pill,
        overflow: 'hidden',
    },
    timerFill: {
        height: '100%',
        borderRadius: Radii.pill,
    },
});
