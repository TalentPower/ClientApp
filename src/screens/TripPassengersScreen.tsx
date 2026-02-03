// ============================================================
// Trip Passengers Screen
// Manage passenger boarding, new entries, and attendance
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';

import {
  NavigationStackParamList,
  TripPassenger,
  AttendanceStatus,
  Coordinate,
} from '../types';
import { lightTheme } from '../theme';
import { Button, Card } from '../components/UI';
import tripApiService from '../services/tripApiService';
import locationService from '../services/location';

type TripPassengersNavigationProp = StackNavigationProp<NavigationStackParamList, 'TripPassengers'>;
type TripPassengersRouteProp = RouteProp<NavigationStackParamList, 'TripPassengers'>;

interface TripPassengersScreenProps {
  navigation: TripPassengersNavigationProp;
  route: TripPassengersRouteProp;
}

const TripPassengersScreen: React.FC<TripPassengersScreenProps> = ({ navigation, route }) => {
  const { tripId, stopId } = route.params;
  
  const [passengers, setPassengers] = useState<TripPassenger[]>([]);
  const [filteredPassengers, setFilteredPassengers] = useState<TripPassenger[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'expected' | 'boarded' | 'no_show'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [newEntryName, setNewEntryName] = useState('');
  const [newEntryPhone, setNewEntryPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  
  const theme = lightTheme;

  useFocusEffect(
    useCallback(() => {
      loadPassengers();
      getCurrentLocation();
    }, [tripId])
  );

  useEffect(() => {
    filterPassengers();
  }, [passengers, searchQuery, filter]);

  const loadPassengers = async () => {
    setLoading(true);
    try {
      const data = await tripApiService.getTripPassengers(tripId);
      setPassengers(data);
    } catch (error) {
      console.error('Error loading passengers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const filterPassengers = () => {
    let filtered = [...passengers];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.employeeName.toLowerCase().includes(query) ||
        p.stopName?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    switch (filter) {
      case 'expected':
        filtered = filtered.filter(p => p.status === 'EXPECTED' || p.status === 'CONFIRMED');
        break;
      case 'boarded':
        filtered = filtered.filter(p => p.status === 'BOARDED');
        break;
      case 'no_show':
        filtered = filtered.filter(p => p.status === 'NO_SHOW');
        break;
    }
    
    // Sort: boarded first, then expected, then others
    filtered.sort((a, b) => {
      const priority = { BOARDED: 0, CONFIRMED: 1, EXPECTED: 2, NO_SHOW: 3, CANCELLED: 4 };
      return (priority[a.status] || 5) - (priority[b.status] || 5);
    });
    
    setFilteredPassengers(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPassengers();
    setRefreshing(false);
  };

  const handleBoardPassenger = async (passenger: TripPassenger) => {
    if (passenger.status === 'BOARDED') {
      Alert.alert('Ya abordó', 'Este pasajero ya fue registrado como abordado.');
      return;
    }
    
    Alert.alert(
      'Confirmar Abordaje',
      `¿${passenger.employeeName} ha abordado la unidad?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await tripApiService.markPassengerBoarding(
                tripId,
                passenger.employeeId.toString(),
                currentLocation || undefined
              );
              
              // Update local state
              setPassengers(prev => prev.map(p => 
                p.id === passenger.id 
                  ? { ...p, status: 'BOARDED' as AttendanceStatus, boardingTime: new Date().toISOString() }
                  : p
              ));
              
            } catch (error) {
              console.error('Error marking boarding:', error);
              Alert.alert('Error', 'No se pudo registrar el abordaje.');
            }
          },
        },
      ]
    );
  };

  const handleMarkNoShow = async (passenger: TripPassenger) => {
    Alert.alert(
      'Marcar como No Show',
      `¿${passenger.employeeName} no se presentó?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () => {
            setPassengers(prev => prev.map(p => 
              p.id === passenger.id 
                ? { ...p, status: 'NO_SHOW' as AttendanceStatus }
                : p
            ));
          },
        },
      ]
    );
  };

  const handleAddNewEntry = async () => {
    if (!newEntryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del pasajero.');
      return;
    }
    
    try {
      const newPassenger = await tripApiService.registerNewPassenger(tripId, {
        name: newEntryName.trim(),
        phone: newEntryPhone.trim() || undefined,
        stopId,
      });
      
      if (newPassenger) {
        setPassengers(prev => [
          ...prev,
          { ...newPassenger, isNewEntry: true, status: 'BOARDED' as AttendanceStatus },
        ]);
      }
      
      setShowNewEntryModal(false);
      setNewEntryName('');
      setNewEntryPhone('');
      
      Alert.alert(
        'Nuevo Ingreso Registrado',
        `${newEntryName} ha sido registrado. Pendiente de aprobación por el supervisor.`
      );
    } catch (error) {
      console.error('Error adding new entry:', error);
      Alert.alert('Error', 'No se pudo registrar el nuevo ingreso.');
    }
  };

  const getStatusConfig = (status: AttendanceStatus) => {
    const configs = {
      EXPECTED: { color: theme.colors.warning, icon: '⏳', label: 'Esperado' },
      CONFIRMED: { color: theme.colors.info, icon: '✓', label: 'Confirmó' },
      BOARDED: { color: theme.colors.success, icon: '✅', label: 'Abordó' },
      NO_SHOW: { color: theme.colors.error, icon: '❌', label: 'No Show' },
      CANCELLED: { color: theme.colors.textMuted, icon: '🚫', label: 'Cancelado' },
    };
    return configs[status] || configs.EXPECTED;
  };

  const stats = {
    total: passengers.length,
    boarded: passengers.filter(p => p.status === 'BOARDED').length,
    expected: passengers.filter(p => ['EXPECTED', 'CONFIRMED'].includes(p.status)).length,
    noShow: passengers.filter(p => p.status === 'NO_SHOW').length,
  };

  const renderPassengerItem = ({ item }: { item: TripPassenger }) => {
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <TouchableOpacity
        style={styles.passengerCard}
        onPress={() => handleBoardPassenger(item)}
        onLongPress={() => item.status !== 'BOARDED' && handleMarkNoShow(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]}>
          <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
        </View>
        
        <View style={styles.passengerInfo}>
          <View style={styles.passengerHeader}>
            <Text style={styles.passengerName}>{item.employeeName}</Text>
            {item.isNewEntry && (
              <View style={styles.newEntryBadge}>
                <Text style={styles.newEntryText}>NUEVO</Text>
              </View>
            )}
          </View>
          
          {item.stopName && (
            <Text style={styles.passengerStop}>📍 {item.stopName}</Text>
          )}
          
          <View style={styles.passengerMeta}>
            <Text style={[styles.passengerStatus, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            {item.boardingTime && (
              <Text style={styles.boardingTime}>
                {new Date(item.boardingTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            )}
          </View>
        </View>
        
        {item.status !== 'BOARDED' && item.status !== 'NO_SHOW' && (
          <TouchableOpacity
            style={styles.boardBtn}
            onPress={() => handleBoardPassenger(item)}
          >
            <Text style={styles.boardBtnText}>Abordar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderNewEntryModal = () => (
    <Modal
      visible={showNewEntryModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowNewEntryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Registrar Nuevo Ingreso</Text>
          <Text style={styles.modalSubtitle}>
            Este pasajero quedará pendiente de aprobación por el supervisor.
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nombre completo *"
            value={newEntryName}
            onChangeText={setNewEntryName}
            autoFocus
          />
          
          <TextInput
            style={styles.input}
            placeholder="Teléfono (opcional)"
            value={newEntryPhone}
            onChangeText={setNewEntryPhone}
            keyboardType="phone-pad"
          />
          
          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              variant="ghost"
              onPress={() => setShowNewEntryModal(false)}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Registrar"
              onPress={handleAddNewEntry}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.boarded}</Text>
          <Text style={styles.statLabel}>Abordados</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.expected}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.error }]}>{stats.noShow}</Text>
          <Text style={styles.statLabel}>No Show</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
      
      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar pasajero..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filters}>
          {(['all', 'expected', 'boarded', 'no_show'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Todos' : 
                 f === 'expected' ? 'Pendientes' :
                 f === 'boarded' ? 'Abordados' : 'No Show'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Passenger List */}
      <FlatList
        data={filteredPassengers}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPassengerItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Sin pasajeros</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'No se encontraron pasajeros con ese nombre.' 
                : 'No hay pasajeros registrados para este viaje.'}
            </Text>
          </View>
        }
      />
      
      {/* New Entry Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNewEntryModal(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Nuevo Ingreso</Text>
      </TouchableOpacity>
      
      {renderNewEntryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  
  // Stats Header
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: lightTheme.colors.surface,
    paddingVertical: lightTheme.spacing.lg,
    paddingHorizontal: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: lightTheme.colors.border,
  },
  statNumber: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  statLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textMuted,
    marginTop: 2,
  },
  
  // Search & Filter
  searchSection: {
    padding: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },
  searchInput: {
    backgroundColor: lightTheme.colors.background,
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    fontSize: lightTheme.typography.fontSize.base,
    marginBottom: lightTheme.spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    gap: lightTheme.spacing.xs,
  },
  filterBtn: {
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.background,
  },
  filterBtnActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  filterText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: '500',
    color: lightTheme.colors.textSecondary,
  },
  filterTextActive: {
    color: lightTheme.colors.white,
  },
  
  // List
  listContent: {
    padding: lightTheme.spacing.md,
    paddingBottom: 100,
  },
  
  // Passenger Card
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.sm,
    ...lightTheme.shadows.sm,
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: lightTheme.spacing.md,
  },
  statusIcon: {
    fontSize: 18,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  passengerName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: '600',
    color: lightTheme.colors.text,
  },
  newEntryBadge: {
    backgroundColor: lightTheme.colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: lightTheme.borderRadius.sm,
    marginLeft: lightTheme.spacing.xs,
  },
  newEntryText: {
    fontSize: 10,
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  passengerStop: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textMuted,
  },
  passengerMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: lightTheme.spacing.md,
  },
  passengerStatus: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: '600',
  },
  boardingTime: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textMuted,
  },
  boardBtn: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
  },
  boardBtnText: {
    color: lightTheme.colors.white,
    fontWeight: '600',
    fontSize: lightTheme.typography.fontSize.sm,
  },
  
  // Empty State
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
  },
  emptySubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: lightTheme.spacing.xs,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.lg,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.full,
    ...lightTheme.shadows.lg,
  },
  fabIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: lightTheme.colors.white,
    marginRight: lightTheme.spacing.xs,
  },
  fabText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: '600',
    color: lightTheme.colors.white,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: lightTheme.colors.overlay,
    justifyContent: 'center',
    padding: lightTheme.spacing.lg,
  },
  modalContent: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing.xl,
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: '700',
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
  },
  modalSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textMuted,
    marginBottom: lightTheme.spacing.lg,
  },
  input: {
    backgroundColor: lightTheme.colors.background,
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.base,
    marginBottom: lightTheme.spacing.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: lightTheme.spacing.md,
  },
});

export default TripPassengersScreen;

