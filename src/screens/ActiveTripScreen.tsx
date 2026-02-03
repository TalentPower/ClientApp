// ============================================================
// Active Trip Screen - Simple Version (No Map Required)
// Manages active trip with stop tracking and controls
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import {
  NavigationStackParamList,
  TripWithDetails,
  RouteStop,
  TripStatus,
} from '../types';
import { lightTheme, getTripStatusColor, getTripStatusLabel } from '../theme';
import { Button, Card } from '../components/UI';
import tripApiService from '../services/tripApiService';

type ActiveTripNavigationProp = StackNavigationProp<NavigationStackParamList, 'ActiveTrip'>;
type ActiveTripRouteProp = RouteProp<NavigationStackParamList, 'ActiveTrip'>;

interface ActiveTripScreenProps {
  navigation: ActiveTripNavigationProp;
  route: ActiveTripRouteProp;
}

interface StopWithStatus extends RouteStop {
  status: 'PENDING' | 'ARRIVED' | 'DEPARTED' | 'SKIPPED';
  arrivedAt?: string;
  departedAt?: string;
  boardedCount?: number;
}

const ActiveTripScreen: React.FC<ActiveTripScreenProps> = ({ navigation, route }) => {
  const { tripId } = route.params;
  
  // State
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [stops, setStops] = useState<StopWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const theme = lightTheme;

  // Load trip data
  useEffect(() => {
    loadTripData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tripId]);

  // Timer for elapsed time
  useEffect(() => {
    if (trip?.startedAt && trip.status === 'IN_PROGRESS') {
      timerRef.current = setInterval(() => {
        const start = new Date(trip.startedAt!).getTime();
        setElapsedTime(Date.now() - start);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trip?.startedAt, trip?.status]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading trip data:', tripId);
      const tripData = await tripApiService.getTripById(tripId);
      
      if (tripData) {
        setTrip(tripData);
        
        // Load stops
        if (tripData.routeId) {
          try {
            const routeStops = await tripApiService.getRouteStops(tripData.routeId.toString());
            const stopsWithStatus: StopWithStatus[] = routeStops.map((stop, index) => ({
              ...stop,
              status: index === 0 ? 'ARRIVED' : 'PENDING',
              boardedCount: 0,
            }));
            setStops(stopsWithStatus);
          } catch (error) {
            console.log('No stops found for route');
            setStops([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      Alert.alert('Error', 'No se pudo cargar la información del viaje.');
    } finally {
      setLoading(false);
    }
  };

  const markStopArrival = async (index: number) => {
    const stop = stops[index];
    if (!stop) return;
    
    try {
      setStops(prev => prev.map((s, i) => 
        i === index 
          ? { ...s, status: 'ARRIVED', arrivedAt: new Date().toISOString() }
          : s
      ));
      setCurrentStopIndex(index);
    } catch (error) {
      console.error('Error marking stop arrival:', error);
    }
  };

  const markStopDeparture = async (index: number) => {
    const stop = stops[index];
    if (!stop) return;
    
    try {
      setStops(prev => prev.map((s, i) => 
        i === index 
          ? { ...s, status: 'DEPARTED', departedAt: new Date().toISOString() }
          : s
      ));
      
      // Move to next stop
      if (index < stops.length - 1) {
        setCurrentStopIndex(index + 1);
      }
    } catch (error) {
      console.error('Error marking stop departure:', error);
    }
  };

  const handleFinishTrip = () => {
    Alert.alert(
      'Finalizar Viaje',
      '¿Estás seguro de que deseas finalizar este viaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Finalizar', style: 'destructive', onPress: finishTrip },
      ]
    );
  };

  const finishTrip = async () => {
    try {
      await tripApiService.finishTrip(tripId);
      
      Alert.alert(
        '✅ Viaje Completado',
        'El viaje se ha finalizado exitosamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error finishing trip:', error);
      Alert.alert('Error', 'No se pudo finalizar el viaje.');
    }
  };

  const formatElapsedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStopStatusColor = (status: string) => {
    switch (status) {
      case 'DEPARTED': return theme.colors.success;
      case 'ARRIVED': return theme.colors.primary;
      case 'SKIPPED': return theme.colors.error;
      default: return theme.colors.textMuted;
    }
  };

  const getStopStatusIcon = (status: string) => {
    switch (status) {
      case 'DEPARTED': return '✅';
      case 'ARRIVED': return '📍';
      case 'SKIPPED': return '⏭️';
      default: return '⏳';
    }
  };

  const renderStopItem = (stop: StopWithStatus, index: number) => {
    const isCurrentStop = index === currentStopIndex;
    const statusColor = getStopStatusColor(stop.status);
    
    return (
      <View
        key={stop.id}
        style={[
          styles.stopItem,
          isCurrentStop && styles.stopItemCurrent,
        ]}
      >
        <View style={[styles.stopIndicator, { backgroundColor: statusColor }]}>
          {stop.isOrigin && <Text style={styles.stopIndicatorText}>🏁</Text>}
          {stop.isDestination && <Text style={styles.stopIndicatorText}>🎯</Text>}
          {!stop.isOrigin && !stop.isDestination && (
            <Text style={styles.stopIndicatorText}>{stop.stopOrder}</Text>
          )}
        </View>
        
        <View style={styles.stopContent}>
          <View style={styles.stopHeader}>
            <Text style={styles.stopName}>{stop.name}</Text>
            <Text style={styles.stopStatusIcon}>{getStopStatusIcon(stop.status)}</Text>
          </View>
          {stop.address && (
            <Text style={styles.stopAddress} numberOfLines={1}>{stop.address}</Text>
          )}
          <View style={styles.stopMeta}>
            {stop.status === 'ARRIVED' && stop.arrivedAt && (
              <Text style={styles.stopTime}>
                ⏰ Llegada: {new Date(stop.arrivedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {stop.status === 'DEPARTED' && stop.departedAt && (
              <Text style={styles.stopTimeDeparted}>
                ✓ Salida: {new Date(stop.departedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </View>
        
        {/* Action buttons */}
        <View style={styles.stopActions}>
          {stop.status === 'PENDING' && (
            <TouchableOpacity
              style={styles.arriveBtn}
              onPress={() => markStopArrival(index)}
            >
              <Text style={styles.arriveBtnText}>Llegar</Text>
            </TouchableOpacity>
          )}
          {stop.status === 'ARRIVED' && (
            <TouchableOpacity
              style={styles.departBtn}
              onPress={() => markStopDeparture(index)}
            >
              <Text style={styles.departBtnText}>Salir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando viaje...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Header Info Card */}
      <Card style={styles.headerCard} padding="lg">
        <View style={styles.tripHeader}>
          <View style={styles.tripInfo}>
            <Text style={styles.tripName}>{trip?.routeName || 'Viaje Activo'}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {getTripStatusLabel(trip?.status || 'IN_PROGRESS')}
              </Text>
            </View>
          </View>
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Tiempo</Text>
            <Text style={styles.timerValue}>{formatElapsedTime(elapsedTime)}</Text>
          </View>
        </View>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentStopIndex + 1}/{stops.length || 0}</Text>
            <Text style={styles.statLabel}>Paradas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{trip?.passengersBoarded || 0}</Text>
            <Text style={styles.statLabel}>Abordados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{trip?.passengersExpected || 0}</Text>
            <Text style={styles.statLabel}>Esperados</Text>
          </View>
        </View>
      </Card>
      
      {/* Stops List */}
      <View style={styles.stopsSection}>
        <Text style={styles.sectionTitle}>📍 Paradas de la Ruta</Text>
        
        {stops.length > 0 ? (
          <ScrollView 
            style={styles.stopsList}
            showsVerticalScrollIndicator={false}
          >
            {stops.map(renderStopItem)}
          </ScrollView>
        ) : (
          <View style={styles.noStopsContainer}>
            <Text style={styles.noStopsIcon}>🗺️</Text>
            <Text style={styles.noStopsText}>No hay paradas configuradas</Text>
            <Text style={styles.noStopsSubtext}>El viaje no tiene paradas definidas</Text>
          </View>
        )}
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('TripPassengers', { tripId })}
        >
          <Text style={styles.actionBtnIcon}>👥</Text>
          <Text style={styles.actionBtnText}>Pasajeros</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('CreateIncident', { tripId })}
        >
          <Text style={styles.actionBtnIcon}>🚨</Text>
          <Text style={styles.actionBtnText}>Incidente</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={loadTripData}
        >
          <Text style={styles.actionBtnIcon}>🔄</Text>
          <Text style={styles.actionBtnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>
      
      {/* Finish Button */}
      <View style={styles.bottomControls}>
        <Button
          title="🏁 Finalizar Viaje"
          variant="error"
          onPress={handleFinishTrip}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.background,
  },
  loadingText: {
    marginTop: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.textSecondary,
  },
  
  // Header Card
  headerCard: {
    margin: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.xl,
    ...lightTheme.shadows.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: lightTheme.spacing.md,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: '700',
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
  },
  statusBadge: {
    backgroundColor: lightTheme.colors.success,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: lightTheme.colors.white,
    fontWeight: '600',
    fontSize: lightTheme.typography.fontSize.xs,
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.primaryLight,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
  },
  timerLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.primary,
    marginBottom: 2,
  },
  timerValue: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: lightTheme.colors.primary,
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: lightTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  statLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: lightTheme.colors.border,
  },
  
  // Stops Section
  stopsSection: {
    flex: 1,
    paddingHorizontal: lightTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: '700',
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.md,
  },
  stopsList: {
    flex: 1,
  },
  noStopsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: lightTheme.spacing['3xl'],
  },
  noStopsIcon: {
    fontSize: 48,
    marginBottom: lightTheme.spacing.md,
  },
  noStopsText: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: '600',
    color: lightTheme.colors.text,
  },
  noStopsSubtext: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textMuted,
    marginTop: lightTheme.spacing.xs,
  },
  
  // Stop Item
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing.sm,
    ...lightTheme.shadows.sm,
  },
  stopItemCurrent: {
    borderWidth: 2,
    borderColor: lightTheme.colors.primary,
    backgroundColor: `${lightTheme.colors.primary}08`,
  },
  stopIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: lightTheme.spacing.md,
  },
  stopIndicatorText: {
    color: lightTheme.colors.white,
    fontWeight: '700',
    fontSize: lightTheme.typography.fontSize.base,
  },
  stopContent: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: '600',
    color: lightTheme.colors.text,
    flex: 1,
  },
  stopStatusIcon: {
    fontSize: 18,
    marginLeft: lightTheme.spacing.sm,
  },
  stopAddress: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textMuted,
    marginTop: 2,
  },
  stopMeta: {
    marginTop: lightTheme.spacing.xs,
  },
  stopTime: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.primary,
    fontWeight: '500',
  },
  stopTimeDeparted: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.success,
    fontWeight: '500',
  },
  stopActions: {
    marginLeft: lightTheme.spacing.sm,
  },
  arriveBtn: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
  },
  arriveBtnText: {
    color: lightTheme.colors.white,
    fontWeight: '600',
    fontSize: lightTheme.typography.fontSize.sm,
  },
  departBtn: {
    backgroundColor: lightTheme.colors.success,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
  },
  departBtnText: {
    color: lightTheme.colors.white,
    fontWeight: '600',
    fontSize: lightTheme.typography.fontSize.sm,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.border,
  },
  actionBtn: {
    alignItems: 'center',
    padding: lightTheme.spacing.sm,
  },
  actionBtnIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  actionBtnText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textSecondary,
    fontWeight: '500',
  },
  
  // Bottom Controls
  bottomControls: {
    padding: lightTheme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
  },
});

export default ActiveTripScreen;
