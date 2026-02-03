/**
 * Dashboard with Google Maps integration
 * Uses react-native-maps instead of geolocation-service to avoid crashes
 * 
 * @deprecated Este dashboard usa el sistema antiguo basado en driverId.
 * Para tracking de viajes reales, use TripDashboard que usa tripId.
 * 
 * Este componente se mantiene para:
 * - Pruebas básicas de ubicación
 * - Demo sin conexión al backend
 * 
 * Para viajes de producción, use TripDashboard + ActiveTripMaps
 * que usan tripApiService y tripLocationService correctamente.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { config } from '../config/environment';
// @deprecated - Use tripApiService para viajes reales
import driverRouteService from '../services/driverRouteService';

interface SimpleDashboardProps {
  userName: string;
  userId?: string;
  onLogout: () => void;
}

interface Location {
  latitude: number;
  longitude: number;
}

const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ userName, userId, onLogout }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationString, setLocationString] = useState('Ubicación no obtenida');
  const [tripActive, setTripActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeprecationWarning, setShowDeprecationWarning] = useState(true);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 19.4326,
    longitude: -99.1332,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const mapRef = useRef<MapView>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Mostrar advertencia de deprecación al montar
    console.warn('⚠️ [DEPRECATED] SimpleDashboard uses deprecated driverRouteService. Use TripDashboard for production.');
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  console.log('📱 [SIMPLE-DASHBOARD] Component rendering...');

  // Request location permissions
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (checkResult) {
        console.log('✅ [SIMPLE-DASHBOARD] Permission already granted');
        return true;
      }

      console.log('🔄 [SIMPLE-DASHBOARD] Requesting permission...');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicación',
          message: 'Esta app necesita acceso a tu ubicación para funcionar correctamente.',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Aceptar',
        }
      );

      const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      console.log('📋 [SIMPLE-DASHBOARD] Permission result:', granted);
      return hasPermission;
    } catch (error) {
      console.error('❌ [SIMPLE-DASHBOARD] Permission error:', error);
      return false;
    }
  };

  // Get location using Google Maps
  const handleLocationUpdate = async () => {
    console.log('📍 [SIMPLE-DASHBOARD] Updating location...');

    if (!isMountedRef.current) {
      return;
    }

    setLoading(true);

    try {
      // Request permissions
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        if (isMountedRef.current) {
          Alert.alert(
            'Permisos Requeridos',
            'Necesitas otorgar permisos de ubicación para usar esta función.\n\nVe a Configuración > Apps > DriverTracker > Permisos',
            [{ text: 'OK' }]
          );
        }
        setLoading(false);
        return;
      }

      // Use mock location for emulator (Google Maps will handle real location on device)
      // In a real device, the map will automatically get the user's location
      const mockLocation: Location = {
        latitude: 19.4326 + (Math.random() - 0.5) * 0.01, // Add slight variation
        longitude: -99.1332 + (Math.random() - 0.5) * 0.01,
      };

      console.log('✅ [SIMPLE-DASHBOARD] Location obtained:', mockLocation);

      if (isMountedRef.current) {
        setLocation(mockLocation);
        const locationStr = `${mockLocation.latitude.toFixed(6)}, ${mockLocation.longitude.toFixed(6)}`;
        setLocationString(locationStr);

        // Update map region
        const newRegion: Region = {
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(newRegion);

        // Animate map to location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }

        // Save coordinate to Firebase if userId is available
        if (userId) {
          try {
            await driverRouteService.addCoordinate(userId, {
              latitude: mockLocation.latitude,
              longitude: mockLocation.longitude,
              timestamp: Date.now(),
              accuracy: 10,
            });
            console.log('✅ [SIMPLE-DASHBOARD] Coordinate saved to Firebase');
          } catch (error) {
            console.error('❌ [SIMPLE-DASHBOARD] Error saving coordinate to Firebase:', error);
            // Don't show error to user, just log it
          }
        } else {
          console.warn('⚠️ [SIMPLE-DASHBOARD] No userId available, coordinate not saved');
        }

        Alert.alert('Ubicación Actualizada', `Nueva ubicación:\n${locationStr}`, [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ [SIMPLE-DASHBOARD] Error getting location:', error);

      // Fallback to default location
      const fallbackLocation: Location = {
        latitude: 19.4326,
        longitude: -99.1332,
      };

      if (isMountedRef.current) {
        setLocation(fallbackLocation);
        setLocationString(`${fallbackLocation.latitude.toFixed(6)}, ${fallbackLocation.longitude.toFixed(6)}`);

        const newRegion: Region = {
          latitude: fallbackLocation.latitude,
          longitude: fallbackLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(newRegion);

        Alert.alert(
          'Ubicación Simulada',
          'No se pudo obtener la ubicación GPS.\n\nUsando ubicación de prueba.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleStartTrip = async () => {
    console.log('🚐 [SIMPLE-DASHBOARD] Starting trip...');
    
    // Clear previous route coordinates when starting a new trip
    if (userId) {
      try {
        await driverRouteService.clearRoute(userId);
        await driverRouteService.setDriverActive(userId);
        console.log('✅ [SIMPLE-DASHBOARD] Route cleared and driver set as active');
      } catch (error) {
        console.error('❌ [SIMPLE-DASHBOARD] Error clearing route:', error);
      }
    }
    
    setTripActive(true);
    Alert.alert('Viaje', 'Viaje iniciado exitosamente');
  };

  const handleEndTrip = async () => {
    console.log('🏁 [SIMPLE-DASHBOARD] Ending trip...');
    
    // Set driver as inactive when ending trip
    if (userId) {
      try {
        await driverRouteService.setDriverInactive(userId);
        console.log('✅ [SIMPLE-DASHBOARD] Driver set as inactive');
      } catch (error) {
        console.error('❌ [SIMPLE-DASHBOARD] Error setting driver inactive:', error);
      }
    }
    
    setTripActive(false);
    Alert.alert('Viaje', 'Viaje finalizado exitosamente');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚐 Dashboard</Text>
        <Text style={styles.subtitle}>¡Hola {userName}!</Text>
      </View>

      {/* Deprecation Warning Banner */}
      {showDeprecationWarning && (
        <TouchableOpacity
          style={styles.deprecationBanner}
          onPress={() => setShowDeprecationWarning(false)}
        >
          <Text style={styles.deprecationText}>
            ⚠️ Este dashboard usa el sistema antiguo. Para viajes reales, use "TripDashboard".
          </Text>
          <Text style={styles.deprecationDismiss}>Toca para cerrar</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={false}
            showsCompass={true}
            showsScale={true}
            mapType="standard"
            onMapReady={() => {
              console.log('✅ [SIMPLE-DASHBOARD] Map is ready');
            }}
            onError={(error) => {
              console.error('❌ [SIMPLE-DASHBOARD] Map error:', error);
            }}
          >
            {location && (
              <Marker
                coordinate={location}
                title="Mi Ubicación"
                description="Ubicación actual del conductor"
                pinColor="#27AE60"
              />
            )}
          </MapView>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Ubicación</Text>
          <Text style={styles.locationText}>{locationString}</Text>

          <TouchableOpacity
            style={[styles.buttonSecondary, loading && styles.buttonDisabled]}
            onPress={handleLocationUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonSecondaryText}>Actualizar Ubicación</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Trip Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚐 Estado del Viaje</Text>
          <Text style={styles.statusText}>
            {tripActive ? '🟢 Viaje Activo' : '🔴 Sin Viajes'}
          </Text>

          {!tripActive ? (
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleStartTrip}>
              <Text style={styles.buttonPrimaryText}>Iniciar Viaje</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.buttonDanger} onPress={handleEndTrip}>
              <Text style={styles.buttonDangerText}>Finalizar Viaje</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Estadísticas</Text>
          <Text style={styles.statText}>Viajes hoy: 3</Text>
          <Text style={styles.statText}>Distancia: 45.2 km</Text>
          <Text style={styles.statText}>Tiempo: 2h 15m</Text>
        </View>

        {/* Logout Button */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={onLogout}>
            <Text style={styles.buttonSecondaryText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: '#27AE60',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: '#111827',
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  buttonPrimary: {
    backgroundColor: '#27AE60',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#2D9CDB',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDanger: {
    backgroundColor: '#EB5757',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDangerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  actions: {
    padding: 20,
    paddingTop: 0,
  },
  deprecationBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  deprecationText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  deprecationDismiss: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 4,
    textAlign: 'right',
  },
});

export default SimpleDashboard;
