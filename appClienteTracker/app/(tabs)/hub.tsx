import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrips, useNotifications, useAttendanceForecast } from '../../src/hooks/useTrips';
import { TripStatusBanner } from '../../src/components/TripStatusBanner';
import { ForecastBanner } from '../../src/components/ForecastBanner';
import { NotificationCard } from '../../src/components/NotificationCard';
import { ProfileModal } from '../../src/components/ProfileModal';
import { Colors, Radii, Spacing } from '../../src/constants/Colors';

export default function HubScreen() {
    const insets = useSafeAreaInsets();
    
    // Hooks
    const { activeTrips, fetchActiveTrips, isLoading: isLoadingTrips, etaData } = useTrips();
    const { notifications, isLoading: isLoadingNotifs, refresh: refreshNotifs } = useNotifications();
    const { forecast, isLoading: isLoadingForecast, isSubmitting: isSubmittingForecast, confirm, decline, refresh: refreshForecast } = useAttendanceForecast();

    // UI State
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            fetchActiveTrips(),
            refreshNotifs(),
            refreshForecast()
        ]);
        setRefreshing(false);
    }, [fetchActiveTrips, refreshNotifs, refreshForecast]);

    // Derived logic
    const currentTrip = activeTrips.length > 0 ? activeTrips[0] : undefined;
    const isLoading = isLoadingTrips || isLoadingNotifs || isLoadingForecast;

    // Agrupamos notificaciones por fecha: hoy, anteriores. Memoized para evitar jank.
    const notificationGroups = useMemo(() => {
        if (!notifications || !notifications.length) return [];

        const today: any[] = [];
        const older: any[] = [];

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        notifications.forEach(n => {
            const dateStr = new Date(n.createdAt).toISOString().split('T')[0];
            if (dateStr === todayStr) {
                today.push(n);
            } else {
                older.push(n);
            }
        });

        return [
            { title: 'Hoy', data: today },
            { title: 'Anteriores', data: older }
        ].filter(g => g.data.length > 0);
    }, [notifications]);

    const handleForecastAction = async (action: 'confirm' | 'decline', id: number) => {
        try {
            if (action === 'confirm') await confirm(id);
            else await decline(id);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'No se pudo procesar tu respuesta. Intenta de nuevo.');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Avisos</Text>
                <TouchableOpacity
                    onPress={() => setProfileModalVisible(true)}
                    style={styles.profileButton}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir perfil"
                >
                    <Ionicons name="person-circle" size={36} color={Colors.accent} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
                }
            >
                {/* 1. Estado del Viaje Actual */}
                {currentTrip && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mi Ruta Actual</Text>
                        <TripStatusBanner status={currentTrip.status} etaMinutes={etaData?.etaMinutes} />
                    </View>
                )}

                {/* 2. Asistencia Mañana */}
                {forecast && (
                    <View style={styles.section}>
                        <ForecastBanner
                            forecast={forecast}
                            onConfirm={(id) => handleForecastAction('confirm', id)}
                            onDecline={(id) => handleForecastAction('decline', id)}
                            isSubmitting={isSubmittingForecast}
                        />
                    </View>
                )}

                {/* 3. Historial de Avisos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historial de Avisos</Text>
                    
                    {isLoading && notifications.length === 0 ? (
                        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.accent} />
                    ) : notificationGroups.length > 0 ? (
                        notificationGroups.map((group, index) => (
                            <View key={index} style={styles.groupContainer}>
                                <Text style={styles.groupTitle}>{group.title}</Text>
                                {group.data.map(item => (
                                    <NotificationCard 
                                        key={item.id} 
                                        item={item} 
                                        forecastStatus={
                                            item.type === 'ATTENDANCE_FORECAST' && item.entityId === forecast?.forecastId 
                                                ? forecast?.status 
                                                : undefined
                                        } 
                                        onAction={async (action, id) => {
                                            if (!id) return;
                                            await handleForecastAction(action, id);
                                        }}
                                    />
                                ))}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={48} color={Colors.textSecondary} />
                            <Text style={styles.emptyText}>No tienes avisos nuevos</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <ProfileModal
                visible={profileModalVisible}
                onClose={() => setProfileModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        paddingTop: Spacing.sm,
        backgroundColor: Colors.secondary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    profileButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Spacing.lg,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginLeft: Spacing.xl,
        marginBottom: Spacing.md,
    },
    groupContainer: {
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 12,
    },
});
