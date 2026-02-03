// Simplified Active Trip screen without Google Maps for testing

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { NavigationStackParamList, Location } from '../types';
import { lightTheme } from '../theme';
import { Button, Card } from '../components/UI';
import { useDimensions } from '../hooks/useDimensions';
import locationService from '../services/location';
import mockTripService, { Trip } from '../services/mockTripService'; // Using mock service to avoid Firebase crashes
import whatsappService from '../services/whatsappService';

type ActiveTripNavigationProp = StackNavigationProp<NavigationStackParamList, 'ActiveTrip'>;
type ActiveTripRouteProp = RouteProp<NavigationStackParamList, 'ActiveTrip'>;

interface ActiveTripProps {
  navigation: ActiveTripNavigationProp;
  route: ActiveTripRouteProp;
}

const ActiveTripSimple: React.FC<ActiveTripProps> = ({ navigation, route }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
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
        unsubscribe = mockTripService.subscribeToTrip(tripId, (updatedTrip) => {
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
      const tripData = await mockTripService.getTrip(tripId);
      setTrip(tripData);
      
      if (tripData?.destination) {
        setDestination(tripData.destination);
      }
      
      if (tripData?.startTime) {
        setElapsedTime(Date.now() - tripData.startTime);
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const success = await locationService.startLocationTracking(
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
        const location = await locationService.getCurrentLocation();
        setCurrentLocation(location);
        
        // Set a mock destination for demo
        if (location) {
          setDestination({
            latitude: location.latitude + 0.01,
            longitude: location.longitude + 0.01,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    locationService.stopLocationTracking();
    setIsTracking(false);
  };

  const handleLocationUpdate = async (location: Location) => {
    setCurrentLocation(location);
    
    if (trip?.id) {
      try {
        await mockTripService.updateTripLocation(trip.id, location);
      } catch (error) {
        console.error('Error updating trip location:', error);
      }
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
    return `${(distance * 1000).toFixed(0)}m`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Trip Header */}
        <Card style={styles.headerCard} padding="lg">
          <Text style={styles.tripTitle}>🚐 Viaje Activo</Text>
          <Text style={styles.tripId}>ID: #{trip?.id.slice(-6) || 'N/A'}</Text>
          <Text style={styles.driverName}>{trip?.driverName || 'Conductor'}</Text>
        </Card>

        {/* Current Location */}
        <Card style={styles.locationCard} padding="md">
          <Text style={styles.cardTitle}>📍 Ubicación Actual</Text>
          <Text style={styles.locationText}>
            {currentLocation 
              ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
              : 'Obteniendo ubicación...'
            }
          </Text>
          {currentLocation?.accuracy && (
            <Text style={styles.accuracyText}>
              Precisión: {Math.round(currentLocation.accuracy)}m
            </Text>
          )}
        </Card>

        {/* Destination */}
        <Card style={styles.destinationCard} padding="md">
          <Text style={styles.cardTitle}>🎯 Destino</Text>
          <Text style={styles.locationText}>
            {destination 
              ? `${destination.latitude.toFixed(6)}, ${destination.longitude.toFixed(6)}`
              : 'Sin destino establecido'
            }
          </Text>
          <Text style={styles.distanceText}>
            Distancia aproximada: {calculateDistance()}
          </Text>
        </Card>

        {/* Trip Stats */}
        <Card style={styles.statsCard} padding="md">
          <Text style={styles.cardTitle}>📊 Estadísticas del Viaje</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tiempo</Text>
              <Text style={styles.statValue}>{formatElapsedTime(elapsedTime)}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distancia</Text>
              <Text style={styles.statValue}>{calculateDistance()}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Estado</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isTracking ? theme.colors.success : theme.colors.error },
                  ]}
                />
                <Text style={styles.statValue}>
                  {isTracking ? 'Activo' : 'Detenido'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <Button
            title="Actualizar Ubicación"
            onPress={async () => {
              try {
                const location = await locationService.getCurrentLocation({
                  enableHighAccuracy: true,
                  timeout: 15000,
                  maximumAge: 10000,
                });
                setCurrentLocation(location);
                Alert.alert(
                  'Ubicación actualizada',
                  `Nueva ubicación: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                );
              } catch (error) {
                console.error('Error updating location:', error);
                Alert.alert(
                  'Error de ubicación',
                  'No se pudo actualizar la ubicación. Verifica que el GPS esté habilitado.'
                );
              }
            }}
            variant="info"
            style={styles.controlButton}
            fullWidth
          />
          
          <Button
            title="Finalizar Viaje"
            onPress={handleEndTrip}
            variant="error"
            style={styles.endButton}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  scrollContent: {
    padding: lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing['2xl'],
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: lightTheme.spacing.md,
  },
  tripTitle: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
  },
  tripId: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing.xs,
  },
  driverName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.primary,
  },
  locationCard: {
    marginBottom: lightTheme.spacing.md,
  },
  destinationCard: {
    marginBottom: lightTheme.spacing.md,
  },
  statsCard: {
    marginBottom: lightTheme.spacing.lg,
  },
  cardTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.sm,
  },
  locationText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing.xs,
  },
  accuracyText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textDisabled,
  },
  distanceText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing.xs,
  },
  statValue: {
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
  controlsContainer: {
    gap: lightTheme.spacing.md,
  },
  controlButton: {
    marginBottom: lightTheme.spacing.md,
  },
  endButton: {
    // Style will be handled by variant="error"
  },
});

export default ActiveTripSimple;
