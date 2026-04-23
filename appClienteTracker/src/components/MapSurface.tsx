import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE, MapStyleElement } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '../constants/Colors';
import { RouteStop, Coordinate } from '../domain/Trip';

// ── Dark map style ──
const CustomMapStyle: MapStyleElement[] = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#dfd2ae' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

interface MapSurfaceProps {
    location: Location.LocationObject;
    busLocation?: Coordinate | null;
    routeStops?: RouteStop[];
    polylineCoordinates?: { latitude: number; longitude: number }[];
    showGeofences?: boolean;
}

export function MapSurface({
    location,
    busLocation,
    routeStops = [],
    polylineCoordinates = [],
    showGeofences = false,
}: MapSurfaceProps) {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;
    const mapRef = useRef<MapView | null>(null);
    const lastFollowedRef = useRef<string | null>(null);

    // Pulse animation for bus marker
    useEffect(() => {
        if (!busLocation) return;
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [busLocation, pulseAnim]);

    // Recenter map on bus when it moves (follow mode)
    // Throttle by 4-decimal precision (~11m) to avoid GPS-noise jitter + re-animation jank
    useEffect(() => {
        if (!busLocation || !mapRef.current) return;
        const key = `${busLocation.latitude.toFixed(4)},${busLocation.longitude.toFixed(4)}`;
        if (key === lastFollowedRef.current) return;
        lastFollowedRef.current = key;
        // Guard: ref may be nulled between throttle check + call if unmounted mid-frame
        if (!mapRef.current) return;
        try {
            mapRef.current.animateToRegion({
                latitude: busLocation.latitude,
                longitude: busLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.015,
            }, 600);
        } catch (e) {
            if (__DEV__) console.warn('animateToRegion failed:', e);
        }
    }, [busLocation]);

    // Polyline re-render key (refresh if stops change)
    const polylineKey = polylineCoordinates
        .map(c => `${c.latitude.toFixed(4)}-${c.longitude.toFixed(4)}`)
        .join('|');

    return (
        <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            customMapStyle={CustomMapStyle}
            initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.03,
                longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
        >
            {/* ── Route polyline ── */}
            {polylineCoordinates.length > 1 && (
                <Polyline
                    key={polylineKey}
                    coordinates={polylineCoordinates}
                    strokeColor={Colors.accent}
                    strokeWidth={4}
                    geodesic={true}
                    lineDashPattern={[0]}
                />
            )}

            {/* ── Route stops markers ── */}
            {routeStops
                .filter(stop => stop.latitude != null && stop.longitude != null)
                .map((stop, index) => (
                    <React.Fragment key={stop.id}>
                        <Marker
                            coordinate={{
                                latitude: stop.latitude!,
                                longitude: stop.longitude!,
                            }}
                            title={stop.name}
                            description={stop.isOrigin ? 'Origen' : stop.isDestination ? 'Destino' : `Parada ${stop.stopOrder}`}
                            pinColor={
                                stop.isOrigin
                                    ? Colors.accentSuccess
                                    : stop.isDestination
                                        ? Colors.accentDanger
                                        : Colors.accentLight
                            }
                        />
                        {/* Geofence circles */}
                        {showGeofences && (
                            <Circle
                                center={{
                                    latitude: stop.latitude!,
                                    longitude: stop.longitude!,
                                }}
                                radius={stop.geofenceRadiusMeters || 50}
                                fillColor="rgba(67, 56, 202, 0.08)"
                                strokeColor="rgba(67, 56, 202, 0.25)"
                                strokeWidth={1}
                            />
                        )}
                    </React.Fragment>
                ))}

            {/* ── Bus marker (driver live location) ── */}
            {busLocation && (
                <Marker
                    coordinate={{
                        latitude: busLocation.latitude,
                        longitude: busLocation.longitude,
                    }}
                    title="Tu Unidad"
                    description="Posición en tiempo real"
                >
                    <View style={styles.busMarkerOuter}>
                        <View style={styles.busMarkerInner}>
                            <View style={styles.busIcon} />
                        </View>
                    </View>
                </Marker>
            )}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    busMarkerOuter: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(67, 56, 202, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    busMarkerInner: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
    },
    busIcon: {
        width: 14,
        height: 14,
        borderRadius: 3,
        backgroundColor: Colors.white,
    },
});
