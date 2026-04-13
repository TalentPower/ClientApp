import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface EventCardProps {
    eventName: string;
    driverName: string;
    onConfirm: () => Promise<void>;
    onDecline: () => Promise<void>;
}

export function EventCard({ eventName, driverName, onConfirm, onDecline }: EventCardProps) {
    const [loading, setLoading] = useState(false);

    const handleAction = async (type: 'confirm' | 'decline') => {
        setLoading(true);
        try {
            if (type === 'confirm') await onConfirm();
            else await onDecline();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <IconSymbol name="bell.fill" size={20} color={Colors.accent} />
                <Text style={styles.header}>Notificación de Asistencia</Text>
            </View>

            <Text style={styles.bodyText}>
                El conductor <Text style={styles.bold}>{driverName}</Text> está en camino a recoger el punto:{' '}
                <Text style={styles.bold}>{eventName}</Text>.
            </Text>

            <Text style={styles.question}>
                ¿Confirmas tu asistencia y recepción en el destino?
            </Text>

            {loading ? (
                <ActivityIndicator size="large" color={Colors.accent} style={styles.loader} />
            ) : (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.declineBtn]}
                        onPress={() => handleAction('decline')}
                    >
                        <Text style={styles.declineBtnText}>Declinar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.confirmBtn]}
                        onPress={() => handleAction('confirm')}
                    >
                        <Text style={styles.confirmBtnText}>Confirmar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.secondary,
        padding: Spacing.xl,
        borderRadius: Radii.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        marginVertical: Spacing.md,
        marginHorizontal: Spacing.md,
        ...Shadows.elevationLg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.md,
    },
    header: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    bodyText: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    bold: {
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
        color: Colors.textPrimary,
    },
    loader: {
        marginVertical: Spacing.xl,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: Radii.md,
        alignItems: 'center',
    },
    declineBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.accentDanger,
    },
    confirmBtn: {
        backgroundColor: Colors.accentSuccess,
    },
    declineBtnText: {
        color: Colors.accentDanger,
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
