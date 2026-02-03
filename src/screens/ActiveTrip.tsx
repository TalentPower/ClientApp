// Active trip screen with navigation and controls

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { NavigationStackParamList, Location } from '../types';
import { lightTheme } from '../theme';
import { Button, Card } from '../components/UI';
import { useDimensions } from '../hooks/useDimensions';
import locationService from '../services/location';
import tripService, { Trip } from '../services/tripService';
import whatsappService from '../services/whatsappService';

type ActiveTripNavigationProp = StackNavigationProp<NavigationStackParamList, 'ActiveTrip'>;
type ActiveTripRouteProp = RouteProp<NavigationStackParamList, 'ActiveTrip'>;

interface ActiveTripProps {
  navigation: ActiveTripNavigationProp;
  route: ActiveTripRouteProp;
}

const ActiveTrip: React.FC<ActiveTripProps> = ({ navigation, route }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const mapRef = useRef<MapView>(null);
  const theme = lightTheme;
  const { width, height } = useDimensions();
  const { tripId } = route.params;

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timer: NodeJS.Timeout | null = null;

    const initializeTrip = async () => {
      try {
        await loadTripData();
        await startLocationTracking();
        
        // Subscribe to trip updates with error handling
        unsubscribe = tripService.subscribeToTrip(tripId, (updatedTrip) => {
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
        console.error('Error initializing trip:', error);
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
        console.error('Error cleaning up trip screen:', error);
      }
    };
  }, [tripId]);

  const loadTripData = async () => {
    try {
      const tripData = await tripService.getTrip(tripId);
      setTrip(tripData);
      
      if (tripData?.destination) {
        setDestination(tripData.destination);
      }
      
      if (tripData?.startTime) {
        setElapsedTime(Date.now() - tripData.startTime);
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del viaje.');
    }
  };

  const startLocationTracking = async () => {
    try {
      const success = await locationService.startLocationTracking(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          interval: 3000, // Update every 3 seconds
          fastestInterval: 1000,
        }
      );
      
      if (success) {
        setIsTracking(true);
        // Get initial location
        const location = await locationService.getCurrentLocation();
        setCurrentLocation(location);
        
        // Set a mock destination for demo (this would come from route data)
        setDestination({
          latitude: location.latitude + 0.01,
          longitude: location.longitude + 0.01,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'No se pudo iniciar el rastreo de ubicación.');
    }
  };

  const stopLocationTracking = () => {
    locationService.stopLocationTracking();
    setIsTracking(false);
  };

  const handleLocationUpdate = async (location: Location) => {
    setCurrentLocation(location);
    
    // Update trip location in Firebase
    if (trip?.id) {
      try {
        await tripService.updateTripLocation(trip.id, location);
      } catch (error) {
        console.error('Error updating trip location:', error);
      }
    }
    
    // Center map on current location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const handleLocationError = (error: any) => {
    console.error('Location tracking error:', error);
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
      stopLocationTracking();
      
      // End trip in Firebase
      const completedTrip = await tripService.endTrip(trip.id, currentLocation);
      
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
        console.warn('Failed to send WhatsApp notification:', notificationError);
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
      console.error('Error ending trip:', error);
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
    
    const distance = locationService.calculateDistance(currentLocation, destination);
    return `${(distance * 1000).toFixed(0)}m`; // Convert to meters
  };

  const getMapRegion = () => {
    if (!currentLocation) {
      return {
        latitude: 25.686614, // Default to Mexico City area
        longitude: -100.316113,
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={getMapRegion()}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        showsCompass={true}
        showsScale={true}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        mapType="standard"
        onMapReady={() => {
          console.log('Map is ready');
        }}
        onError={(error) => {
          console.error('Map error:', error);
        }}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Mi Ubicación"
            description="Ubicación actual del conductor"
          />
        )}
        
        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destino"
            description="Punto de destino"
            pinColor="red"
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
                  {isTracking ? 'Activo' : 'Detenido'}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          <Button
            title="Centrar"
            onPress={() => {
              if (currentLocation && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                });
              }
            }}
            variant="outline"
            style={styles.controlButton}
          />
          
          <Button
            title="Finalizar Viaje"
            onPress={handleEndTrip}
            variant="primary"
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
    paddingBottom: lightTheme.spacing.lg, // Safe area padding
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    flex: 0.3,
    marginRight: lightTheme.spacing.md,
  },
  endTripButton: {
    flex: 0.65,
  },
});

export default ActiveTrip;
