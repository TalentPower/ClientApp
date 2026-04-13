import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TripStatus } from '../domain/Trip';

interface TripStatusBannerProps {
    status?: TripStatus;
    etaMinutes?: number;
}

const STEPS = [
    { label: 'Programado', status: 'READY' },
    { label: 'En Camino', status: 'IN_PROGRESS' },
    { label: 'Completado', status: 'COMPLETED' },
];

export const TripStatusBanner: React.FC<TripStatusBannerProps> = ({ status, etaMinutes }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        if (status === 'IN_PROGRESS' || status === 'READY') {
            pulse.start();
        } else {
            pulse.stop();
        }

        return () => pulse.stop();
    }, [status, pulseAnim]);

    const getStepIndex = (currentStatus?: TripStatus) => {
        if (!currentStatus) return -1;
        if (currentStatus === 'READY') return 0;
        if (currentStatus === 'IN_PROGRESS') return 1;
        if (currentStatus === 'COMPLETED') return 2;
        return -1; // CANCELLED, etc.
    };

    const currentIndex = getStepIndex(status);

    return (
        <View style={styles.container}>
            <View style={styles.pipeline}>
                {STEPS.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isPast = index < currentIndex;
                    
                    return (
                        <React.Fragment key={step.status}>
                            <View style={styles.stepContainer}>
                                <Animated.View
                                    style={[
                                        styles.dot,
                                        isPast && styles.dotPast,
                                        isActive && styles.dotActive,
                                        isActive && { transform: [{ scale: pulseAnim }] }
                                    ]}
                                />
                                <Text style={[
                                    styles.stepLabel,
                                    isActive && styles.labelActive,
                                    isPast && styles.labelPast
                                ]}>
                                    {step.label}
                                </Text>
                            </View>
                            {index < STEPS.length - 1 && (
                                <View style={[styles.line, (isPast || isActive) && styles.lineActive]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
            
            {status === 'IN_PROGRESS' && etaMinutes !== undefined && (
                <View style={styles.etaContainer}>
                    <Text style={styles.etaText}>
                        ETA: {etaMinutes} min a destino
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    pipeline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepContainer: {
        alignItems: 'center',
        flex: 1,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#e5e7eb', // gray-200
        marginBottom: 4,
    },
    dotPast: {
        backgroundColor: '#3b82f6', // blue-500
    },
    dotActive: {
        backgroundColor: '#10b981', // emerald-500
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    stepLabel: {
        fontSize: 10,
        color: '#9ca3af', // gray-400
        fontWeight: '500',
    },
    labelPast: {
        color: '#4b5563', // gray-600
    },
    labelActive: {
        color: '#111827', // gray-900
        fontWeight: 'bold',
    },
    line: {
        height: 2,
        flex: 1,
        backgroundColor: '#e5e7eb',
        marginHorizontal: -10,
        marginTop: -16, // offset for label height
    },
    lineActive: {
        backgroundColor: '#3b82f6',
    },
    etaContainer: {
        marginTop: 10,
        alignItems: 'center',
        backgroundColor: '#d1fae5', // emerald-100
        paddingVertical: 4,
        borderRadius: 8,
    },
    etaText: {
        fontSize: 12,
        color: '#047857', // emerald-700
        fontWeight: '600',
    },
});
