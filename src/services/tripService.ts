// Trip Management Service with Firebase integration

import firestore from '@react-native-firebase/firestore';
import { Location, TripStatus } from '../types';
import apiAuthService from './apiAuth';

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

export interface TripLocationUpdate {
  tripId: string;
  location: Location;
  timestamp: number;
  speed?: number;
  heading?: number;
}

class TripService {
  private readonly TRIPS_COLLECTION = 'trips';
  private readonly TRIP_LOCATIONS_COLLECTION = 'trip_locations';
  private readonly ACTIVE_DRIVERS_COLLECTION = 'active_drivers';

  // Create a new trip
  async createTrip(destination?: Location): Promise<Trip> {
    try {
      const userData = await apiAuthService.getUserData();
      if (!userData) {
        throw new Error('User not authenticated');
      }

      const tripId = `trip_${Date.now()}_${userData.id}`;
      const now = Date.now();

      const trip: Trip = {
        id: tripId,
        driverId: userData.id,
        driverName: userData.name,
        status: 'pending',
        destination,
        waypoints: [],
        createdAt: now,
        updatedAt: now,
      };

      await firestore().collection(this.TRIPS_COLLECTION).doc(tripId).set(trip);
      
      // Update driver status to active
      await this.updateDriverStatus(userData.id, 'active', tripId);

      console.log('Trip created successfully:', tripId);
      return trip;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw new Error('Failed to create trip');
    }
  }

  // Start a trip
  async startTrip(tripId: string, startLocation: Location): Promise<void> {
    try {
      const updates = {
        status: 'active',
        startLocation,
        currentLocation: startLocation,
        startTime: Date.now(),
        updatedAt: Date.now(),
      };

      await firestore()
        .collection(this.TRIPS_COLLECTION)
        .doc(tripId)
        .update(updates);

      // Log the trip start
      await this.logLocationUpdate(tripId, startLocation, 'trip_started');

      console.log('Trip started successfully:', tripId);
    } catch (error) {
      console.error('Error starting trip:', error);
      throw new Error('Failed to start trip');
    }
  }

  // Update trip location during active trip
  async updateTripLocation(tripId: string, location: Location): Promise<void> {
    try {
      const updates = {
        currentLocation: location,
        updatedAt: Date.now(),
      };

      // Add location to waypoints array
      await firestore()
        .collection(this.TRIPS_COLLECTION)
        .doc(tripId)
        .update({
          ...updates,
          waypoints: firestore.FieldValue.arrayUnion(location),
        });

      // Log detailed location update
      await this.logLocationUpdate(tripId, location, 'location_update');

    } catch (error) {
      console.error('Error updating trip location:', error);
      // Don't throw error here to avoid disrupting location tracking
    }
  }

  // End a trip
  async endTrip(tripId: string, endLocation: Location, notes?: string): Promise<Trip> {
    try {
      const tripRef = firestore().collection(this.TRIPS_COLLECTION).doc(tripId);
      const tripDoc = await tripRef.get();
      
      if (!tripDoc.exists) {
        throw new Error('Trip not found');
      }

      const tripData = tripDoc.data() as Trip;
      const now = Date.now();
      const duration = tripData.startTime ? now - tripData.startTime : 0;

      // Calculate total distance
      const distance = this.calculateTotalDistance(tripData.waypoints);

      const updates = {
        status: 'completed',
        endLocation,
        endTime: now,
        duration,
        distance,
        notes,
        updatedAt: now,
      };

      await tripRef.update(updates);

      // Log trip completion
      await this.logLocationUpdate(tripId, endLocation, 'trip_ended');

      // Update driver status to idle
      await this.updateDriverStatus(tripData.driverId, 'idle');

      const completedTrip = { ...tripData, ...updates } as Trip;
      console.log('Trip completed successfully:', tripId);
      return completedTrip;
    } catch (error) {
      console.error('Error ending trip:', error);
      throw new Error('Failed to end trip');
    }
  }

  // Cancel a trip
  async cancelTrip(tripId: string, reason?: string): Promise<void> {
    try {
      const updates = {
        status: 'cancelled',
        notes: reason,
        endTime: Date.now(),
        updatedAt: Date.now(),
      };

      await firestore()
        .collection(this.TRIPS_COLLECTION)
        .doc(tripId)
        .update(updates);

      // Update driver status
      const tripDoc = await firestore()
        .collection(this.TRIPS_COLLECTION)
        .doc(tripId)
        .get();

      if (tripDoc.exists) {
        const tripData = tripDoc.data() as Trip;
        await this.updateDriverStatus(tripData.driverId, 'idle');
      }

      console.log('Trip cancelled:', tripId);
    } catch (error) {
      console.error('Error cancelling trip:', error);
      throw new Error('Failed to cancel trip');
    }
  }

  // Get trip by ID
  async getTrip(tripId: string): Promise<Trip | null> {
    try {
      const doc = await firestore()
        .collection(this.TRIPS_COLLECTION)
        .doc(tripId)
        .get();

      return doc.exists ? (doc.data() as Trip) : null;
    } catch (error) {
      console.error('Error getting trip:', error);
      return null;
    }
  }

  // Get driver's active trip
  async getActiveTrip(driverId: string): Promise<Trip | null> {
    try {
      const snapshot = await firestore()
        .collection(this.TRIPS_COLLECTION)
        .where('driverId', '==', driverId)
        .where('status', 'in', ['pending', 'active'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      // Better null checking
      if (!snapshot || !snapshot.docs || snapshot.docs.length === 0) {
        return null;
      }

      return snapshot.docs[0].data() as Trip;
    } catch (error) {
      console.error('Error getting active trip:', error);
      return null;
    }
  }

  // Get driver's trip history
  async getDriverTrips(driverId: string, limit: number = 10): Promise<Trip[]> {
    try {
      const snapshot = await firestore()
        .collection(this.TRIPS_COLLECTION)
        .where('driverId', '==', driverId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as Trip);
    } catch (error) {
      console.error('Error getting driver trips:', error);
      return [];
    }
  }

  // Subscribe to trip updates
  subscribeToTrip(tripId: string, callback: (trip: Trip | null) => void) {
    return firestore()
      .collection(this.TRIPS_COLLECTION)
      .doc(tripId)
      .onSnapshot(doc => {
        callback(doc.exists ? (doc.data() as Trip) : null);
      });
  }

  // Subscribe to driver's active trip
  subscribeToActiveTrip(driverId: string, callback: (trip: Trip | null) => void) {
    return firestore()
      .collection(this.TRIPS_COLLECTION)
      .where('driverId', '==', driverId)
      .where('status', 'in', ['pending', 'active'])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot(
        snapshot => {
          // Better null checking for snapshot
          if (!snapshot || !snapshot.docs || snapshot.docs.length === 0) {
            callback(null);
            return;
          }
          callback(snapshot.docs[0].data() as Trip);
        },
        error => {
          console.error('Error in active trip subscription:', error);
          callback(null);
        }
      );
  }

  // Log detailed location updates
  private async logLocationUpdate(
    tripId: string,
    location: Location,
    type: 'trip_started' | 'location_update' | 'trip_ended'
  ): Promise<void> {
    try {
      const locationUpdate: TripLocationUpdate = {
        tripId,
        location,
        timestamp: Date.now(),
        speed: location.speed,
        heading: location.heading,
      };

      await firestore()
        .collection(this.TRIP_LOCATIONS_COLLECTION)
        .add({
          ...locationUpdate,
          type,
        });
    } catch (error) {
      console.error('Error logging location update:', error);
    }
  }

  // Update driver status
  private async updateDriverStatus(
    driverId: string,
    status: 'idle' | 'active' | 'offline',
    activeTrip?: string
  ): Promise<void> {
    try {
      const driverStatus = {
        driverId,
        status,
        activeTrip: activeTrip || null,
        lastUpdated: Date.now(),
      };

      await firestore()
        .collection(this.ACTIVE_DRIVERS_COLLECTION)
        .doc(driverId)
        .set(driverStatus, { merge: true });
    } catch (error) {
      console.error('Error updating driver status:', error);
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

  // Get trip statistics
  async getTripStats(driverId: string, days: number = 7): Promise<{
    totalTrips: number;
    totalDistance: number;
    totalDuration: number;
    averageDistance: number;
    averageDuration: number;
  }> {
    try {
      const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      const snapshot = await firestore()
        .collection(this.TRIPS_COLLECTION)
        .where('driverId', '==', driverId)
        .where('status', '==', 'completed')
        .where('createdAt', '>=', startDate)
        .get();

      const trips = snapshot.docs.map(doc => doc.data() as Trip);
      const totalTrips = trips.length;
      const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
      const totalDuration = trips.reduce((sum, trip) => sum + (trip.duration || 0), 0);

      return {
        totalTrips,
        totalDistance,
        totalDuration,
        averageDistance: totalTrips > 0 ? totalDistance / totalTrips : 0,
        averageDuration: totalTrips > 0 ? totalDuration / totalTrips : 0,
      };
    } catch (error) {
      console.error('Error getting trip stats:', error);
      return {
        totalTrips: 0,
        totalDistance: 0,
        totalDuration: 0,
        averageDistance: 0,
        averageDuration: 0,
      };
    }
  }
}

export default new TripService();
