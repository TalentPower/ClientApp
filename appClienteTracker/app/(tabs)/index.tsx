import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { BottomSheet } from '@/src/components/BottomSheet';
import { MapSurface } from '@/src/components/MapSurface';
import { TripProgressBar } from '@/src/components/TripProgressBar';
import { TripStatusBanner } from '@/src/components/TripStatusBanner';
import { Colors, Spacing } from '@/src/constants/Colors';
import { useTrips, useAttendance } from '@/src/hooks/useTrips';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

// Register background task at module scope (required by Expo)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Error en Background Geolocation', error);
        return;
    }
    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        console.log('Ubicación capturada en background:', locations[0]);
    }
});

export default function RouteTrackingScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    // API hooks
    const {
        activeTrips,
        liveLocation,
        routeStops,
        etaData,
        fetchLiveLocation,
        fetchActiveTrips,
        fetchRouteStops,
        fetchEta,
        isLoading,
    } = useTrips();
    const { confirmAttendance, declineAttendance } = useAttendance();

    const currentTrip = activeTrips.length > 0 ? activeTrips[0] : null;

    // ── Poll driver live location every 5s ──
    useEffect(() => {
        if (!currentTrip) return;

        fetchLiveLocation(currentTrip.tripId);
        fetchRouteStops(currentTrip.tripId);
        fetchEta(currentTrip.tripId);

        const interval = setInterval(() => {
            fetchLiveLocation(currentTrip.tripId);
            fetchEta(currentTrip.tripId);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentTrip, fetchLiveLocation, fetchRouteStops, fetchEta]);

    // ── Request location permissions + tracking ──
    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos tu ubicación para guiarte.');
                return;
            }

            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus === 'granted') {
                await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 10000,
                    distanceInterval: 10,
                    foregroundService: {
                        notificationTitle: 'appClienteTracker activo',
                        notificationBody: 'Compartiendo tu progreso en la ruta',
                        notificationColor: '#4338CA',
                    },
                });
            }

            const initialLocation = await Location.getCurrentPositionAsync({});
            setLocation(initialLocation);

            locationSubscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
                (loc) => setLocation(loc)
            );
        })();

        return () => {
            if (locationSubscription) locationSubscription.remove();
        };
    }, []);

    // ── Build polyline from route stops ──
    const polylineCoords = routeStops
        .filter(s => s.latitude != null && s.longitude != null)
        .map(s => ({ latitude: s.latitude!, longitude: s.longitude! }));

    // Find how many stops have been completed
    const completedStopIndex = etaData
        ? routeStops.findIndex(s => s.id === etaData.nextStopId) - 1
        : -1;

    return (
        <View style={styles.container}>
            {location ? (
                <MapSurface
                    location={location}
                    busLocation={liveLocation}
                    routeStops={routeStops}
                    polylineCoordinates={polylineCoords}
                    showGeofences={true}
                />
            ) : (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Calibrando sensores de ubicación...</Text>
                </View>
            )}

            {/* Progress bar overlaid on the map top area */}
            {currentTrip && routeStops.length > 0 && (
                <View style={styles.progressOverlay}>
                    <TripStatusBanner status={currentTrip.status} etaMinutes={etaData?.etaMinutes} />
                    <View style={{ marginTop: 8 }}>
                        <TripProgressBar
                            stops={routeStops}
                            completedStopIndex={completedStopIndex}
                            nextStopName={etaData?.nextStopName}
                            etaMinutes={etaData?.etaMinutes}
                        />
                    </View>
                </View>
            )}

            {/* BottomSheet with trip info */}
            {currentTrip ? (
                <BottomSheet
                    statusText={
                        currentTrip.status === 'READY'
                            ? 'CONDUCTOR EN CAMINO'
                            : currentTrip.status === 'IN_PROGRESS'
                                ? 'VIAJE EN CURSO'
                                : currentTrip.status
                    }
                    driverName={currentTrip.driverInfo?.name || 'Sin Asignar'}
                    plate={currentTrip.driverInfo?.phone || ''}
                    etaMinutes={etaData?.etaMinutes}
                    etaText={etaData?.etaText}
                    nextStopName={etaData?.nextStopName}
                    completedStops={completedStopIndex >= 0 ? completedStopIndex + 1 : 0}
                    totalStops={routeStops.length}
                    onConfirm={async () => {
                        await confirmAttendance(currentTrip.tripId);
                        Alert.alert('Éxito', 'Has confirmado tu asistencia al viaje.');
                        fetchActiveTrips();
                    }}
                    onDecline={async () => {
                        await declineAttendance(currentTrip.tripId);
                        Alert.alert('Aviso', 'Has cancelado tu viaje de hoy.');
                        fetchActiveTrips();
                    }}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    {isLoading ? (
                        <Text style={styles.loadingText}>Buscando viajes asignados...</Text>
                    ) : (
                        <Text style={styles.emptyText}>No tienes viajes programados para hoy.</Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.primary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: Colors.textPrimary, fontSize: 16 },
    progressOverlay: {
        position: 'absolute',
        top: 60,
        left: Spacing.md,
        right: Spacing.md,
    },
    emptyContainer: {
        position: 'absolute',
        bottom: 120,
        left: Spacing.xl,
        right: Spacing.xl,
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        padding: Spacing.md,
        borderRadius: Spacing.md,
    },
    emptyText: { color: Colors.textSecondary, fontWeight: '500', fontSize: 14 },
});
