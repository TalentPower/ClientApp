// Mock Trip Service - Funciona sin Firebase para evitar crashes
// Este servicio simula las operaciones sin depender de Firestore

import { Location } from '../types';

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startLocation?: Location;
  endLocation?: Location;
  currentLocation?: Location;
  destination?: Location;
  startTime?: number;
  endTime?: number;
  duration?: number;
  distance?: number;
  waypoints: Location[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

class MockTripService {
  private trips: Map<string, Trip> = new Map();
  private listeners: Map<string, (trip: Trip | null) => void> = new Map();

  // Create a new trip (sin Firebase)
  async createTrip(destination?: Location): Promise<Trip> {
    try {
      // Simular un pequeño delay como si fuera una operación de red
      await new Promise(resolve => setTimeout(resolve, 500));

      const tripId = `trip_${Date.now()}_mock`;
      const now = Date.now();

      const trip: Trip = {
        id: tripId,
        driverId: 'mock_driver_id',
        driverName: 'Conductor Demo',
        status: 'pending',
        destination,
        waypoints: [],
        createdAt: now,
        updatedAt: now,
      };

      this.trips.set(tripId, trip);
      console.log('Mock trip created successfully:', tripId);
      return trip;
    } catch (error) {
      console.error('Error creating mock trip:', error);
      throw new Error('Failed to create trip');
    }
  }

  // Start a trip
  async startTrip(tripId: string, startLocation: Location): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const trip = this.trips.get(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const updates = {
        ...trip,
        status: 'active' as const,
        startLocation,
        currentLocation: startLocation,
        startTime: Date.now(),
        updatedAt: Date.now(),
      };

      this.trips.set(tripId, updates);
      this.notifyListeners(tripId, updates);

      console.log('Mock trip started successfully:', tripId);
    } catch (error) {
      console.error('Error starting mock trip:', error);
      throw new Error('Failed to start trip');
    }
  }

  // Update trip location during active trip
  async updateTripLocation(tripId: string, location: Location): Promise<void> {
    try {
      const trip = this.trips.get(tripId);
      if (!trip) {
        console.warn('Trip not found for location update:', tripId);
        return;
      }

      const updates = {
        ...trip,
        currentLocation: location,
        waypoints: [...trip.waypoints, location],
        updatedAt: Date.now(),
      };

      this.trips.set(tripId, updates);
      this.notifyListeners(tripId, updates);

      // No lanzar error aquí para evitar interrumpir el tracking
    } catch (error) {
      console.error('Error updating mock trip location:', error);
      // No lanzar error para mantener el tracking funcionando
    }
  }

  // End a trip
  async endTrip(tripId: string, endLocation: Location, notes?: string): Promise<Trip> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const trip = this.trips.get(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const now = Date.now();
      const duration = trip.startTime ? now - trip.startTime : 0;
      const distance = this.calculateTotalDistance(trip.waypoints);

      const updates = {
        ...trip,
        status: 'completed' as const,
        endLocation,
        endTime: now,
        duration,
        distance,
        notes,
        updatedAt: now,
      };

      this.trips.set(tripId, updates);
      this.notifyListeners(tripId, updates);

      console.log('Mock trip completed successfully:', tripId);
      return updates;
    } catch (error) {
      console.error('Error ending mock trip:', error);
      throw new Error('Failed to end trip');
    }
  }

  // Get trip by ID
  async getTrip(tripId: string): Promise<Trip | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.trips.get(tripId) || null;
    } catch (error) {
      console.error('Error getting mock trip:', error);
      return null;
    }
  }

  // Get driver's active trip
  async getActiveTrip(driverId: string): Promise<Trip | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      // Buscar trip activo en memoria
      for (const trip of this.trips.values()) {
        if (trip.driverId === driverId && ['pending', 'active'].includes(trip.status)) {
          return trip;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting active mock trip:', error);
      return null;
    }
  }

  // Get trip statistics
  async getTripStats(driverId: string, days: number = 7): Promise<{
    totalTrips: number;
    totalDistance: number;
    totalDuration: number;
    averageDistance: number;
    averageDuration: number;
  }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      // Datos mock para estadísticas
      const mockStats = {
        totalTrips: Math.floor(Math.random() * 10) + 5, // 5-15 trips
        totalDistance: Math.random() * 500 + 100, // 100-600 km
        totalDuration: Math.random() * 36000000 + 7200000, // 2-12 hours in ms
        averageDistance: 0,
        averageDuration: 0,
      };

      mockStats.averageDistance = mockStats.totalTrips > 0 ? mockStats.totalDistance / mockStats.totalTrips : 0;
      mockStats.averageDuration = mockStats.totalTrips > 0 ? mockStats.totalDuration / mockStats.totalTrips : 0;

      return mockStats;
    } catch (error) {
      console.error('Error getting mock trip stats:', error);
      return {
        totalTrips: 0,
        totalDistance: 0,
        totalDuration: 0,
        averageDistance: 0,
        averageDuration: 0,
      };
    }
  }

  // Subscribe to trip updates (mock implementation)
  subscribeToTrip(tripId: string, callback: (trip: Trip | null) => void) {
    this.listeners.set(tripId, callback);

    // Enviar trip actual inmediatamente
    const trip = this.trips.get(tripId);
    callback(trip || null);

    // Retornar función de unsubscribe
    return () => {
      this.listeners.delete(tripId);
    };
  }

  // Subscribe to driver's active trip (mock implementation)
  subscribeToActiveTrip(driverId: string, callback: (trip: Trip | null) => void) {
    const subscriptionKey = `active_${driverId}`;
    this.listeners.set(subscriptionKey, callback);

    // Buscar y enviar trip activo inmediatamente
    this.getActiveTrip(driverId).then(callback);

    return () => {
      this.listeners.delete(subscriptionKey);
    };
  }

  // Notify listeners (helper method)
  private notifyListeners(tripId: string, trip: Trip): void {
    const listener = this.listeners.get(tripId);
    if (listener) {
      listener(trip);
    }

    // También notificar listener de active trip si aplica
    const activeListener = this.listeners.get(`active_${trip.driverId}`);
    if (activeListener && ['pending', 'active'].includes(trip.status)) {
      activeListener(trip);
    }
  }

  // Calculate total distance from waypoints
  private calculateTotalDistance(waypoints: Location[]): number {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prevPoint = waypoints[i - 1];
      const currentPoint = waypoints[i];
      totalDistance += this.haversineDistance(prevPoint, currentPoint);
    }

    return totalDistance;
  }

  // Haversine distance calculation
  private haversineDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}

export default new MockTripService();
