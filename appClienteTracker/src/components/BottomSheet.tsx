import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radii, Shadows, Spacing } from '../constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface BottomSheetProps {
    driverName?: string;
    plate?: string;
    statusText?: string;
    etaMinutes?: number | null;
    etaText?: string;
    nextStopName?: string;
    completedStops?: number;
    totalStops?: number;
    onConfirm?: () => void;
    onDecline?: () => void;
    style?: ViewStyle;
}

export function BottomSheet({
    driverName,
    plate,
    statusText,
    etaMinutes,
    etaText,
    nextStopName,
    completedStops,
    totalStops,
    onConfirm,
    onDecline,
    style,
}: BottomSheetProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for status badge when en camino
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={80} tint="dark" style={styles.blurWrapper}>
                <View style={styles.headerIndicator} />

                <View style={styles.content}>
                    {/* Status row with pulse */}
                    <View style={styles.statusRow}>
                        <Animated.View style={[styles.statusDot, { opacity: pulseAnim }]} />
                        <Text style={styles.statusLabel}>{statusText || 'Esperando Asignación'}</Text>
                    </View>

                    {/* ETA Card */}
                    {(etaMinutes != null || nextStopName) && (
                        <View style={styles.etaCard}>
                            <View style={styles.etaMain}>
                                <IconSymbol name="clock.fill" size={18} color={Colors.accent} />
                                <Text style={styles.etaTime}>
                                    {etaMinutes != null ? `${etaMinutes} min` : etaText || '—'}
                                </Text>
                            </View>
                            {nextStopName && (
                                <Text style={styles.etaLabel} numberOfLines={1}>
                                    Próxima → {nextStopName}
                                </Text>
                            )}
                            {completedStops != null && totalStops != null && totalStops > 0 && (
                                <View style={styles.progressRow}>
                                    <View style={styles.progressTrack}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${(completedStops / totalStops) * 100}%` },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {completedStops}/{totalStops}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Driver info */}
                    {driverName && plate && (
                        <View style={styles.driverInfoCard}>
                            <View style={styles.avatarPlaceholder}>
                                <IconSymbol name="person.fill" size={24} color={Colors.textPrimary} />
                            </View>
                            <View style={styles.textStack}>
                                <Text style={styles.driverName}>{driverName}</Text>
                                <Text style={styles.plateText}>{plate}</Text>
                            </View>
                            <View style={styles.iconCTA}>
                                <IconSymbol name="phone.fill" size={20} color={Colors.accent} />
                            </View>
                        </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.btnDecline]} onPress={onDecline}>
                            <Text style={styles.btnTextDecline}>Declinar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.btnConfirm]} onPress={onConfirm}>
                            <Text style={styles.btnTextConfirm}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        left: Spacing.md,
        right: Spacing.md,
        borderRadius: Radii.xl,
        overflow: 'hidden',
        ...Shadows.elevationLg,
    },
    blurWrapper: {
        padding: Spacing.lg,
        backgroundColor: Colors.glassBackground,
    },
    headerIndicator: {
        width: 40,
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: Radii.pill,
        alignSelf: 'center',
        marginBottom: Spacing.md,
    },
    content: {
        gap: Spacing.md,
    },
    // Status
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accentSuccess,
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.accentLight,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    // ETA
    etaCard: {
        backgroundColor: 'rgba(67, 56, 202, 0.08)',
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(67, 56, 202, 0.2)',
        gap: 6,
    },
    etaMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    etaTime: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    etaLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    progressTrack: {
        flex: 1,
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: Radii.pill,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.accent,
        borderRadius: Radii.pill,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    // Driver info
    driverInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: Radii.pill,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    textStack: {
        flex: 1,
    },
    driverName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    plateText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    iconCTA: {
        width: 40,
        height: 40,
        borderRadius: Radii.pill,
        backgroundColor: 'rgba(67, 56, 202, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Buttons
    buttonRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    button: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnDecline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    btnConfirm: {
        backgroundColor: Colors.accent,
    },
    btnTextDecline: {
        color: Colors.textPrimary,
        fontWeight: '600',
        fontSize: 16,
    },
    btnTextConfirm: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
});
