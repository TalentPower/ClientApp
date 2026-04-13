import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrips, useNotifications, useAttendanceForecast } from '../../src/hooks/useTrips';
import { TripStatusBanner } from '../../src/components/TripStatusBanner';
import { ForecastBanner } from '../../src/components/ForecastBanner';
import { NotificationCard } from '../../src/components/NotificationCard';
import { ProfileModal } from '../../src/components/ProfileModal';

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

    // Agrupamos notificaciones por fecha: hoy, ayer, más antiguas
    const groupNotifications = () => {
        if (!notifications.length) return [];
        
        // Simple mock grouping for now, ideally by exact date ignoring time
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
    };

    const notificationGroups = groupNotifications();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Avisos</Text>
                <TouchableOpacity onPress={() => setProfileModalVisible(true)} style={styles.profileButton}>
                    <Ionicons name="person-circle" size={36} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                {forecast && forecast.status === 'PENDING' && (
                    <View style={styles.section}>
                        <ForecastBanner 
                            forecast={forecast}
                            onConfirm={confirm}
                            onDecline={decline}
                            isSubmitting={isSubmittingForecast}
                        />
                    </View>
                )}

                {/* 3. Historial de Avisos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historial de Avisos</Text>
                    
                    {isLoading && notifications.length === 0 ? (
                        <ActivityIndicator style={{ marginTop: 24 }} color="#3b82f6" />
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
                                        onAction={(action, id) => {
                                            if (id) {
                                                if (action === 'confirm') confirm(id);
                                                if (action === 'decline') decline(id);
                                            }
                                        }}
                                    />
                                ))}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
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
        backgroundColor: '#f3f4f6', // gray-100
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        paddingTop: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    profileButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginLeft: 20,
        marginBottom: 12,
    },
    groupContainer: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 12,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 12,
    },
});
