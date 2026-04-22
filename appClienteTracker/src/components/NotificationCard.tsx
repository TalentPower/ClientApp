import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NotificationItem } from '../domain/Trip';
import { Ionicons } from '@expo/vector-icons';

interface NotificationCardProps {
    item: NotificationItem;
    onAction?: (action: 'confirm' | 'decline', entityId?: number) => void | Promise<any>;
    // Just in case it's a forecast that we know the status of in the notification
    forecastStatus?: 'PENDING' | 'CONFIRMED' | 'DECLINED';
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ item, onAction, forecastStatus }) => {
    const [submitting, setSubmitting] = useState<null | 'confirm' | 'decline'>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleAction = async (action: 'confirm' | 'decline') => {
        if (!onAction) return;
        setSubmitting(action);
        setLocalError(null);
        try {
            await onAction(action, item.entityId);
        } catch (err: any) {
            setLocalError(err?.message || 'No se pudo completar la acción. Intenta de nuevo.');
        } finally {
            setSubmitting(null);
        }
    };
    
    const getIconConfig = () => {
        switch (item.type) {
            case 'INFO': return { name: 'information-circle', color: '#3b82f6' };
            case 'ALERT': return { name: 'warning', color: '#f59e0b' };
            case 'SYSTEM': return { name: 'settings', color: '#6b7280' };
            case 'ATTENDANCE_FORECAST': return { name: 'calendar', color: '#8b5cf6' };
            default: return { name: 'notifications', color: '#6b7280' };
        }
    };

    const iconConfig = getIconConfig();

    return (
        <View style={[styles.card, item.read ? styles.cardRead : styles.cardUnread]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}20` }]}>
                    <Ionicons name={iconConfig.name as any} size={20} color={iconConfig.color} />
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.body}>{item.body}</Text>
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </View>

            {item.type === 'ATTENDANCE_FORECAST' && forecastStatus === 'PENDING' && (
                <>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton, submitting && styles.buttonDisabled]}
                            disabled={!!submitting}
                            onPress={() => handleAction('decline')}
                            accessibilityRole="button"
                            accessibilityLabel="Declinar aviso"
                        >
                            {submitting === 'decline' ? (
                                <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                                <Text style={styles.declineText}>Declinar</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton, submitting && styles.buttonDisabled]}
                            disabled={!!submitting}
                            onPress={() => handleAction('confirm')}
                            accessibilityRole="button"
                            accessibilityLabel="Confirmar aviso"
                        >
                            {submitting === 'confirm' ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.confirmText}>Confirmar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    {localError && (
                        <TouchableOpacity onPress={() => setLocalError(null)} style={styles.errorRow}>
                            <Ionicons name="alert-circle" size={14} color="#b91c1c" />
                            <Text style={styles.errorText}>{localError}</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {item.type === 'ATTENDANCE_FORECAST' && forecastStatus && forecastStatus !== 'PENDING' && (
                <View style={styles.badgeContainer}>
                    <View style={[
                        styles.badge, 
                        forecastStatus === 'CONFIRMED' ? styles.badgeGreen : styles.badgeRed
                    ]}>
                        <Text style={[
                            styles.badgeText,
                            forecastStatus === 'CONFIRMED' ? styles.badgeTextGreen : styles.badgeTextRed
                        ]}>
                            {forecastStatus === 'CONFIRMED' ? 'Confirmada' : 'Declinada'}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardUnread: {
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    cardRead: {
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    body: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 6,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        marginLeft: 8,
        marginTop: 6,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 12,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    confirmButton: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    declineButton: {
        backgroundColor: 'transparent',
        borderColor: '#ef4444',
    },
    confirmText: {
        color: '#fff',
        fontWeight: '600',
    },
    declineText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    badgeContainer: {
        marginTop: 12,
        alignItems: 'flex-start',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeGreen: {
        backgroundColor: '#d1fae5',
    },
    badgeRed: {
        backgroundColor: '#fee2e2',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    badgeTextGreen: {
        color: '#047857',
    },
    badgeTextRed: {
        color: '#b91c1c',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#b91c1c',
        flex: 1,
    },
});
