// ============================================================
// Professional Driver Dashboard
// Shows today's routes, active trip status, and quick actions
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';

import {
  NavigationStackParamList,
  AuthUser,
  Trip,
  TripStatus,
} from '../types';
import { lightTheme, getTripStatusColor, getTripStatusLabel, getTripStatusIcon } from '../theme';
import { Button, Card } from '../components/UI';
import tripApiService from '../services/tripApiService';
import locationEmulatorService from '../services/locationEmulator';

type TripDashboardNavigationProp = StackNavigationProp<NavigationStackParamList, 'TripDashboard'>;
type TripDashboardRouteProp = RouteProp<NavigationStackParamList, 'TripDashboard'>;

interface TripDashboardProps {
  navigation: TripDashboardNavigationProp;
  route: TripDashboardRouteProp;
  user: AuthUser | null;
  onLogout: () => void;
}

const TripDashboard: React.FC<TripDashboardProps> = ({
  navigation,
  user,
  onLogout,
}) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const theme = lightTheme;
  const pulseAnim = new Animated.Value(1);

  // Pulse animation for active trip
  useEffect(() => {
    if (activeTrip?.status === 'IN_PROGRESS') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [activeTrip?.status]);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's trips for the authenticated driver
      // Uses the new /my-trips endpoint that automatically uses the logged-in user
      const driverTrips = await tripApiService.getMyTrips(today);
      
      console.log('📋 [DASHBOARD] Loaded trips:', driverTrips.length);
      setTrips(driverTrips);
      
      // Find active trip (IN_PROGRESS has priority over READY)
      const inProgressTrip = driverTrips.find(t => t.status === 'IN_PROGRESS');
      const readyTrip = driverTrips.find(t => t.status === 'READY');
      setActiveTrip(inProgressTrip || readyTrip || null);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocationPermission = async () => {
    try {
      const hasPermission = await locationEmulatorService.checkLocationPermission();
      setLocationPermission(hasPermission);
      
      if (!hasPermission) {
        const granted = await locationEmulatorService.requestLocationPermission();
        setLocationPermission(granted);
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await checkLocationPermission();
    setRefreshing(false);
  };

  const handleStartTrip = async (trip: Trip) => {
    try {
      setLoading(true);
      console.log('🚀 [DASHBOARD] Starting trip:', trip.id);
      
      // Iniciar el viaje directamente (sin checklist)
      await tripApiService.startTrip(trip.id.toString());
      
      console.log('✅ [DASHBOARD] Trip started successfully');
      
      // Navegar al viaje activo
      navigation.navigate('ActiveTrip', { tripId: trip.id.toString() });
    } catch (error) {
      console.error('❌ [DASHBOARD] Error starting trip:', error);
      Alert.alert(
        'Error',
        'No se pudo iniciar el viaje. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTripPress = (trip: Trip) => {
    switch (trip.status) {
      case 'PLANNED':
      case 'PRE_CHECKLIST':
      case 'CHECKLIST_FAILED':
      case 'READY':
        // Para todos estos estados, preguntar si quiere iniciar el viaje
        Alert.alert(
          'Iniciar Viaje',
          `¿Deseas iniciar la ruta "${trip.routeName}"?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Iniciar',
              onPress: () => handleStartTrip(trip)
            },
          ]
        );
        break;
      case 'IN_PROGRESS':
        // Si ya está en progreso, ir directamente
        navigation.navigate('ActiveTrip', { tripId: trip.id.toString() });
        break;
      case 'COMPLETED':
        Alert.alert('Viaje Completado', 'Este viaje ya fue finalizado.');
        break;
      case 'CANCELLED':
        Alert.alert('Viaje Cancelado', 'Este viaje fue cancelado.');
        break;
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'C'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>¡Buen día!</Text>
            <Text style={styles.userName}>{user?.name || 'Conductor'}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeSection}>
        <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
        <Text style={styles.currentDate}>{formatDate(currentTime)}</Text>
      </View>
      
      {!locationPermission && (
        <TouchableOpacity 
          style={styles.permissionBanner}
          onPress={checkLocationPermission}
        >
          <Text style={styles.permissionIcon}>📍</Text>
          <View style={styles.permissionTextContainer}>
            <Text style={styles.permissionTitle}>Ubicación requerida</Text>
            <Text style={styles.permissionSubtitle}>Toca para habilitar</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActiveTrip = () => {
    if (!activeTrip) return null;
    
    const isInProgress = activeTrip.status === 'IN_PROGRESS';
    const statusColor = getTripStatusColor(activeTrip.status, theme);

    return (
      <Animated.View style={[
        styles.activeTripContainer,
        { transform: [{ scale: isInProgress ? pulseAnim : 1 }] }
      ]}>
        <TouchableOpacity 
          style={[styles.activeTripCard, { borderLeftColor: statusColor }]}
          onPress={() => handleTripPress(activeTrip)}
          activeOpacity={0.9}
        >
          <View style={styles.activeTripHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusBadgeText}>
                {getTripStatusIcon(activeTrip.status)} {getTripStatusLabel(activeTrip.status)}
              </Text>
            </View>
            {isInProgress && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>EN VIVO</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.activeTripName}>{activeTrip.routeName}</Text>
          
          <View style={styles.activeTripDetails}>
            <View style={styles.activeTripDetailItem}>
              <Text style={styles.detailLabel}>Turno</Text>
              <Text style={styles.detailValue}>{activeTrip.turn || 'Mañana'}</Text>
            </View>
            <View style={styles.activeTripDetailItem}>
              <Text style={styles.detailLabel}>Pasajeros</Text>
              <Text style={styles.detailValue}>
                {activeTrip.passengersBoarded || 0}/{activeTrip.passengersExpected || 0}
              </Text>
            </View>
            <View style={styles.activeTripDetailItem}>
              <Text style={styles.detailLabel}>Vehículo</Text>
              <Text style={styles.detailValue}>{activeTrip.vehiclePlate || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.activeTripAction}>
            <Text style={styles.actionText}>
              {isInProgress ? 'Ver viaje activo →' : 'Continuar →'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTripCard = (trip: Trip) => {
    const statusColor = getTripStatusColor(trip.status, theme);
    const isActive = trip.status === 'IN_PROGRESS' || trip.status === 'READY';
    
    return (
      <TouchableOpacity
        key={trip.id}
        style={[
          styles.tripCard,
          isActive && styles.tripCardActive,
          { borderLeftColor: statusColor }
        ]}
        onPress={() => handleTripPress(trip)}
        activeOpacity={0.7}
      >
        <View style={styles.tripCardHeader}>
          <View style={styles.tripInfo}>
            <Text style={styles.tripName}>{trip.routeName}</Text>
            <Text style={styles.tripTime}>
              {trip.scheduledStartTime || trip.turn || 'Por programar'}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIcon}>{getTripStatusIcon(trip.status)}</Text>
          </View>
        </View>
        
        <View style={styles.tripCardFooter}>
          <Text style={styles.tripStatus}>{getTripStatusLabel(trip.status)}</Text>
          <Text style={styles.tripPassengers}>
            👥 {trip.passengersExpected || 0} esperados
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Sin viajes programados</Text>
      <Text style={styles.emptySubtitle}>
        No tienes rutas asignadas para hoy.
        {'\n'}Contacta a tu supervisor si esto es un error.
      </Text>
    </View>
  );

  const renderStats = () => {
    const completed = trips.filter(t => t.status === 'COMPLETED').length;
    const pending = trips.filter(t => ['PLANNED', 'READY'].includes(t.status)).length;
    const totalPassengers = trips.reduce((acc, t) => acc + (t.passengersBoarded || 0), 0);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Rutas Hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>{completed}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{pending}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalPassengers}</Text>
          <Text style={styles.statLabel}>Pasajeros</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        
        {/* Active Trip Highlight */}
        {renderActiveTrip()}
        
        {/* Stats Overview */}
        {trips.length > 0 && renderStats()}
        
        {/* Today's Trips List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rutas de Hoy</Text>
          
          {loading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Cargando rutas...</Text>
            </View>
          ) : trips.length > 0 ? (
            <View style={styles.tripsList}>
              {trips
                .filter(t => t.id !== activeTrip?.id)
                .map(renderTripCard)
              }
            </View>
          ) : (
            renderEmptyState()
          )}
        </View>
        
        {/* Quick Actions */}
        {activeTrip && (
          <View style={styles.quickActions}>
            <Button
              title="🚨 Reportar Incidente"
              variant="error"
              onPress={() => navigation.navigate('CreateIncident', { tripId: activeTrip.id.toString() })}
              style={styles.quickActionBtn}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: lightTheme.spacing['3xl'],
  },
  
  // Header
  header: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.lg,
    paddingTop: lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing['2xl'],
    borderBottomLeftRadius: lightTheme.borderRadius['2xl'],
    borderBottomRightRadius: lightTheme.borderRadius['2xl'],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: '700',
    color: lightTheme.colors.white,
  },
  userInfo: {
    marginLeft: lightTheme.spacing.md,
  },
  greeting: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: '600',
    color: lightTheme.colors.white,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  timeSection: {
    marginTop: lightTheme.spacing.xl,
    alignItems: 'center',
  },
  currentTime: {
    fontSize: lightTheme.typography.fontSize['4xl'],
    fontWeight: '300',
    color: lightTheme.colors.white,
    letterSpacing: 2,
  },
  currentDate: {
    fontSize: lightTheme.typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
    marginTop: lightTheme.spacing.xs,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.md,
    marginTop: lightTheme.spacing.lg,
  },
  permissionIcon: {
    fontSize: 24,
    marginRight: lightTheme.spacing.sm,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: '600',
    color: lightTheme.colors.white,
  },
  permissionSubtitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Active Trip
  activeTripContainer: {
    marginTop: -lightTheme.spacing.xl,
    marginHorizontal: lightTheme.spacing.md,
  },
  activeTripCard: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing.lg,
    borderLeftWidth: 4,
    ...lightTheme.shadows.lg,
  },
  activeTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.full,
  },
  statusBadgeText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: '600',
    color: lightTheme.colors.white,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: lightTheme.colors.error,
    marginRight: lightTheme.spacing.xs,
  },
  liveText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: '600',
    color: lightTheme.colors.error,
  },
  activeTripName: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.md,
  },
  activeTripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: lightTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.border,
  },
  activeTripDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textMuted,
    marginBottom: lightTheme.spacing['2xs'],
  },
  detailValue: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: '600',
    color: lightTheme.colors.text,
  },
  activeTripAction: {
    marginTop: lightTheme.spacing.lg,
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: '600',
    color: lightTheme.colors.primary,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: lightTheme.spacing.md,
    marginTop: lightTheme.spacing.lg,
    gap: lightTheme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.md,
    alignItems: 'center',
    ...lightTheme.shadows.sm,
  },
  statNumber: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  statLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textMuted,
    marginTop: lightTheme.spacing['2xs'],
    textAlign: 'center',
  },
  
  // Section
  section: {
    marginTop: lightTheme.spacing.xl,
    paddingHorizontal: lightTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: '700',
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.md,
  },
  
  // Trip List
  tripsList: {
    gap: lightTheme.spacing.sm,
  },
  tripCard: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.md,
    borderLeftWidth: 3,
    ...lightTheme.shadows.sm,
  },
  tripCardActive: {
    ...lightTheme.shadows.md,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: '600',
    color: lightTheme.colors.text,
  },
  tripTime: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textSecondary,
    marginTop: lightTheme.spacing['2xs'],
  },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 14,
  },
  tripCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: lightTheme.spacing.sm,
    paddingTop: lightTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.borderLight,
  },
  tripStatus: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: '500',
    color: lightTheme.colors.textSecondary,
  },
  tripPassengers: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textMuted,
  },
  
  // Empty & Loading States
  emptyState: {
    alignItems: 'center',
    paddingVertical: lightTheme.spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: lightTheme.spacing.md,
  },
  emptyTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: '600',
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: lightTheme.spacing['2xl'],
  },
  loadingText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.textSecondary,
  },
  
  // Quick Actions
  quickActions: {
    marginTop: lightTheme.spacing.xl,
    paddingHorizontal: lightTheme.spacing.md,
  },
  quickActionBtn: {
    marginBottom: lightTheme.spacing.sm,
  },
});

export default TripDashboard;
