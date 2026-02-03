// Enhanced Active Trip screen with full Google Maps integration
// Optimized for Android Studio Emulator

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import MapView, { 
  Marker, 
  PROVIDER_GOOGLE, 
  Polyline,
  Circle,
  Region,
  MarkerAnimated 
} from 'react-native-maps';

import { NavigationStackParamList, Location } from '../types';
import { lightTheme } from '../theme';
import { Button, Card } from '../components/UI';
import { useDimensions } from '../hooks/useDimensions';
import locationEmulatorService from '../services/locationEmulator';
import mockTripService, { Trip } from '../services/mockTripService';
import tripLocationService from '../services/tripLocationService';
import tripApiService from '../services/tripApiService';
import whatsappService from '../services/whatsappService';

type ActiveTripNavigationProp = StackNavigationProp<NavigationStackParamList, 'ActiveTrip'>;
type ActiveTripRouteProp = RouteProp<NavigationStackParamList, 'ActiveTrip'>;

interface ActiveTripProps {
  navigation: ActiveTripNavigationProp;
  route: ActiveTripRouteProp;
}

const ActiveTripMaps: React.FC<ActiveTripProps> = ({ navigation, route }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [routePath, setRoutePath] = useState<Location[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [showAccuracy, setShowAccuracy] = useState(true);
  
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<any>(null);
  const theme = lightTheme;
  const { width, height } = useDimensions();
  const { tripId } = route.params;

  // Map style for better visibility
  const mapStyle = [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ];

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timer: NodeJS.Timeout | null = null;

    const initializeTrip = async () => {
      try {
        console.log('🚀 [MAPS] Initializing trip:', tripId);
        
        // Set current tripId in tripLocationService
        tripLocationService.setCurrentTripId(tripId);
        
        await loadTripData();
        await startLocationTracking();
        
        // Subscribe to trip updates
        unsubscribe = mockTripService.subscribeToTrip(tripId, (updatedTrip) => {
          console.log('📊 [MAPS] Trip updated:', updatedTrip?.status);
          setTrip(updatedTrip);
          if (updatedTrip?.destination) {
            setDestination(updatedTrip.destination);
          }
        });

        // Update elapsed time every second
        timer = setInterval(() => {
          if (trip?.startTime) {
            setElapsedTime(Date.now() - trip.startTime);
          }
        }, 1000);
      } catch (error) {
        console.error('❌ [MAPS] Error initializing trip:', error);
        Alert.alert('Error', 'No se pudo inicializar el viaje correctamente.');
      }
    };

    initializeTrip();

    return () => {
      try {
        stopLocationTracking();
        if (timer) clearInterval(timer);
        if (unsubscribe) unsubscribe();
      } catch (error) {
        console.error('❌ [MAPS] Error cleaning up:', error);
      }
    };
  }, [tripId]);

  const loadTripData = async () => {
    try {
      console.log('📄 [MAPS] Loading trip data...');
      const tripData = await mockTripService.getTrip(tripId);
      setTrip(tripData);
      
      if (tripData?.destination) {
        setDestination(tripData.destination);
      } else {
        // Generate a mock destination for demo
        console.log('🎯 [MAPS] Generating mock destination...');
        const mockDest = locationEmulatorService.getMockDestination({
          latitude: 19.4326,
          longitude: -99.1332,
          timestamp: Date.now(),
        });
        setDestination(mockDest);
      }
      
      if (tripData?.startTime) {
        setElapsedTime(Date.now() - tripData.startTime);
      }
    } catch (error) {
      console.error('❌ [MAPS] Error loading trip data:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      console.log('📍 [MAPS] Starting location tracking...');
      const success = await locationEmulatorService.startLocationTracking(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          interval: 3000,
          fastestInterval: 1000,
        }
      );
      
      if (success) {
        setIsTracking(true);
        // Get initial location
        const location = await locationEmulatorService.getCurrentLocation();
        setCurrentLocation(location);
        setRoutePath([location]);
        
        // Center map on current location
        if (mapRef.current && mapReady) {
          animateToLocation(location);
        }
      }
    } catch (error) {
      console.error('❌ [MAPS] Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    console.log('🛑 [MAPS] Stopping location tracking...');
    locationEmulatorService.stopLocationTracking();
    setIsTracking(false);
  };

  const handleLocationUpdate = async (location: Location) => {
    console.log('📍 [MAPS] Location update:', location);
    setCurrentLocation(location);
    
    // Add to route path
    setRoutePath(prev => [...prev, location]);
    
    // Update trip location using new tripId-based service
    if (tripId) {
      try {
        // Update using new tripLocationService (Firebase with tripId)
        await tripLocationService.updateCurrentLocation(tripId, {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
          accuracy: location.accuracy,
        });
        
        // Also sync to backend API
        await tripApiService.sendLocation(tripId, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date(location.timestamp).toISOString(),
        });
      } catch (error) {
        console.error('❌ [MAPS] Error updating trip location:', error);
        // Location will be queued for retry by tripLocationService
      }
    }
    
    // Animate marker and center map
    if (mapRef.current && mapReady) {
      animateToLocation(location);
    }
  };

  const handleLocationError = (error: any) => {
    console.error('❌ [MAPS] Location tracking error:', error);
  };

  const animateToLocation = (location: Location) => {
    if (!mapRef.current) return;

    const region: Region = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    mapRef.current.animateToRegion(region, 1000);
  };

  const handleEndTrip = () => {
    Alert.alert(
      'Finalizar Viaje',
      '¿Estás seguro de que quieres finalizar el viaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Finalizar', onPress: endTrip, style: 'destructive' },
      ]
    );
  };

  const endTrip = async () => {
    if (!currentLocation || !trip) {
      Alert.alert('Error', 'No se puede finalizar el viaje sin ubicación actual.');
      return;
    }

    try {
      console.log('🏁 [MAPS] Ending trip...');
      stopLocationTracking();
      
      // Complete trip in Firebase (using tripId)
      try {
        await tripLocationService.completeTripLocation(tripId);
        console.log('✅ [MAPS] Trip completed in Firebase');
      } catch (firebaseError) {
        console.warn('⚠️ [MAPS] Firebase complete error:', firebaseError);
      }
      
      // Finish trip in backend API
      try {
        await tripApiService.finishTrip(tripId);
        console.log('✅ [MAPS] Trip finished in backend');
      } catch (apiError) {
        console.warn('⚠️ [MAPS] API finish error:', apiError);
      }
      
      const completedTrip = await mockTripService.endTrip(trip.id, currentLocation);
      
      // Send WhatsApp notification
      try {
        const notificationSettings = await whatsappService.getNotificationSettings(trip.driverId);
        if (notificationSettings.enabled && notificationSettings.tripCompletion) {
          await whatsappService.sendTripNotification({
            type: 'trip_completed',
            trip: completedTrip,
            location: currentLocation,
            recipients: notificationSettings.recipients.supervisors,
          });
        }
      } catch (notificationError) {
        console.warn('⚠️ [MAPS] Failed to send WhatsApp notification:', notificationError);
      }
      
      const duration = completedTrip.duration ? formatElapsedTime(completedTrip.duration) : 'N/A';
      const distance = completedTrip.distance ? `${completedTrip.distance.toFixed(2)} km` : 'N/A';
      
      Alert.alert(
        'Viaje Finalizado',
        `El viaje se ha completado exitosamente.\n\nDuración: ${duration}\nDistancia: ${distance}`,
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('❌ [MAPS] Error ending trip:', error);
      Alert.alert('Error', 'No se pudo finalizar el viaje correctamente.');
    }
  };

  const formatElapsedTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateDistance = (): string => {
    if (!currentLocation || !destination) return '--';
    
    const distance = locationEmulatorService.calculateDistance(currentLocation, destination);
    return `${(distance * 1000).toFixed(0)}m`;
  };

  const getMapRegion = (): Region => {
    if (!currentLocation) {
      return {
        latitude: 19.4326, // Mexico City
        longitude: -99.1332,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    return {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  };

  const centerOnUser = () => {
    if (currentLocation && mapRef.current) {
      animateToLocation(currentLocation);
    }
  };

  const toggleMapType = () => {
    // This could cycle through different map types
    console.log('🗺️ [MAPS] Toggle map type (not implemented)');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Google Maps View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getMapRegion()}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={false}
        followsUserLocation={false}
        showsCompass={true}
        showsScale={true}
        showsTraffic={true}
        showsBuildings={false}
        showsIndoors={false}
        mapType="standard"
        customMapStyle={mapStyle}
        onMapReady={() => {
          console.log('🗺️ [MAPS] Map is ready');
          setMapReady(true);
          if (currentLocation) {
            animateToLocation(currentLocation);
          }
        }}
        onError={(error) => {
          console.error('❌ [MAPS] Map error:', error);
        }}
      >
        {/* Current Location Marker with Accuracy Circle */}
        {currentLocation && (
          <>
            {/* Accuracy Circle */}
            {showAccuracy && currentLocation.accuracy && (
              <Circle
                center={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                radius={currentLocation.accuracy}
                fillColor="rgba(39, 174, 96, 0.2)"
                strokeColor="rgba(39, 174, 96, 0.5)"
                strokeWidth={1}
              />
            )}
            
            {/* Current Location Marker */}
            <Marker
              ref={markerRef}
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Mi Ubicación"
              description={`Precisión: ${Math.round(currentLocation.accuracy || 0)}m`}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.customMarker}>
                <View style={styles.markerDot} />
                <View style={styles.markerPulse} />
              </View>
            </Marker>
          </>
        )}
        
        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destino"
            description="Punto de destino del viaje"
            pinColor={theme.colors.error}
            anchor={{ x: 0.5, y: 1 }}
          />
        )}

        {/* Route Path */}
        {routePath.length > 1 && (
          <Polyline
            coordinates={routePath.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            strokePattern={[1]}
          />
        )}
      </MapView>

      {/* Trip Info Overlay */}
      <View style={styles.overlay}>
        <Card style={styles.tripInfoCard} padding="md">
          <View style={styles.tripInfoRow}>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoLabel}>Tiempo</Text>
              <Text style={styles.tripInfoValue}>{formatElapsedTime(elapsedTime)}</Text>
            </View>
            
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoLabel}>Distancia</Text>
              <Text style={styles.tripInfoValue}>{calculateDistance()}</Text>
            </View>
            
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoLabel}>Estado</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isTracking ? theme.colors.success : theme.colors.error },
                  ]}
                />
                <Text style={styles.tripInfoValue}>
                  {isTracking ? 'Activo' : 'Parado'}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Control Buttons */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnUser}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>📍</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowAccuracy(!showAccuracy)}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          <Button
            title="Centrar"
            onPress={centerOnUser}
            variant="info"
            style={styles.actionButton}
          />
          
          <Button
            title="Finalizar Viaje"
            onPress={handleEndTrip}
            variant="error"
            style={styles.endTripButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: lightTheme.spacing.md,
    left: lightTheme.spacing.md,
    right: lightTheme.spacing.md,
  },
  tripInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...lightTheme.shadows.md,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  tripInfoLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing.xs,
  },
  tripInfoValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: lightTheme.spacing.xs,
  },
  customMarker: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: lightTheme.colors.primary,
    borderWidth: 2,
    borderColor: lightTheme.colors.white,
    position: 'absolute',
    zIndex: 2,
  },
  markerPulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${lightTheme.colors.primary}30`,
    position: 'absolute',
    zIndex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: lightTheme.spacing.md,
    top: height * 0.3,
    gap: lightTheme.spacing.sm,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...lightTheme.shadows.md,
  },
  controlButtonText: {
    fontSize: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: lightTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.border,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing.lg,
    ...lightTheme.shadows.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: lightTheme.spacing.md,
  },
  actionButton: {
    flex: 0.3,
  },
  endTripButton: {
    flex: 0.65,
  },
});

export default ActiveTripMaps;
