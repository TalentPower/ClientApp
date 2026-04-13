import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing } from '../constants/Colors';
import { RouteStop } from '../domain/Trip';

interface TripProgressBarProps {
    stops: RouteStop[];
    completedStopIndex: number;
    nextStopName?: string;
    etaMinutes?: number | null;
}

export function TripProgressBar({
    stops,
    completedStopIndex,
    nextStopName,
    etaMinutes,
}: TripProgressBarProps) {
    if (stops.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Stop dots */}
            <View style={styles.dotsRow}>
                {stops.map((stop, index) => {
                    const isCompleted = index <= completedStopIndex;
                    const isCurrent = index === completedStopIndex + 1;
                    const isLast = index === stops.length - 1;

                    return (
                        <React.Fragment key={stop.id}>
                            <View
                                style={[
                                    styles.dot,
                                    isCompleted && styles.dotCompleted,
                                    isCurrent && styles.dotCurrent,
                                    stop.isOrigin && styles.dotOrigin,
                                    stop.isDestination && styles.dotDestination,
                                ]}
                            >
                                {isCurrent && <View style={styles.dotPulse} />}
                            </View>
                            {!isLast && (
                                <View
                                    style={[
                                        styles.connector,
                                        isCompleted && styles.connectorCompleted,
                                    ]}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>

            {/* Info */}
            {nextStopName && (
                <View style={styles.infoRow}>
                    <Text style={styles.nextLabel}>Siguiente:</Text>
                    <Text style={styles.nextName} numberOfLines={1}>
                        {nextStopName}
                    </Text>
                    {etaMinutes != null && (
                        <Text style={styles.etaBadge}>{etaMinutes} min</Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.secondary,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.sm,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.border,
    },
    dotCompleted: {
        backgroundColor: Colors.accent,
    },
    dotCurrent: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.accent,
        borderWidth: 2,
        borderColor: Colors.accentLight,
    },
    dotOrigin: {
        backgroundColor: Colors.accentSuccess,
    },
    dotDestination: {
        backgroundColor: Colors.accentDanger,
    },
    dotPulse: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(67, 56, 202, 0.15)',
        top: -6,
        left: -6,
    },
    connector: {
        flex: 1,
        height: 2,
        backgroundColor: Colors.border,
        marginHorizontal: 2,
    },
    connectorCompleted: {
        backgroundColor: Colors.accent,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nextLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    nextName: {
        flex: 1,
        fontSize: 13,
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    etaBadge: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.accent,
        backgroundColor: 'rgba(67, 56, 202, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radii.pill,
        overflow: 'hidden',
    },
});
