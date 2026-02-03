// Trip Location Service
// Manages trip tracking using tripId as identifier (not driverId or routeId)
// Implements optimized Firebase structure with separate current location and history

import firestore from '@react-native-firebase/firestore';

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface TripLocation {
  tripId: string;
  routeId: number;
  driverId: string;
  driverName: string;
  companyId: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentLocation?: Coordinate;
  startedAt: number;
  lastUpdate: number;
  coordinateCount: number;
}

class TripLocationService {
  private readonly COLLECTION_NAME = 'trip_locations';
  private readonly COORDINATES_SUBCOLLECTION = 'coordinates';

  // Local cache for offline support
  private pendingUpdates: Coordinate[] = [];
  private currentTripId: string | null = null;

  /**
   * Initialize trip tracking in Firebase.
   * Called when a trip starts (after checklist is completed).
   */
  async initializeTripLocation(
    tripId: string,
    routeId: number,
    driverId: string,
    driverName: string,
    companyId: number
  ): Promise<void> {
    try {
      console.log('🔄 [TRIP-LOCATION] Initializing trip:', tripId);

      const tripLocationRef = firestore().collection(this.COLLECTION_NAME).doc(tripId);

      const tripLocation: TripLocation = {
        tripId,
        routeId,
        driverId,
        driverName,
        companyId,
        status: 'ACTIVE',
        startedAt: Date.now(),
        lastUpdate: Date.now(),
        coordinateCount: 0,
      };

      await tripLocationRef.set(tripLocation);
      this.currentTripId = tripId;

      console.log('✅ [TRIP-LOCATION] Trip initialized:', tripId);
    } catch (error) {
      console.error('❌ [TRIP-LOCATION] Error initializing trip:', error);
      throw new Error('Failed to initialize trip location');
    }
  }

  /**
   * Update current location for a trip.
   * This is an optimized operation that only updates the currentLocation field.
   */
  async updateCurrentLocation(tripId: string, coordinate: Coordinate): Promise<void> {
    try {
      const tripLocationRef = firestore().collection(this.COLLECTION_NAME).doc(tripId);

      // Update only currentLocation field (atomic, fast operation)
      await tripLocationRef.update({
        currentLocation: coordinate,
        lastUpdate: Date.now(),
        coordinateCount: firestore.FieldValue.increment(1),
      });

      // Add to history subcollection
      await this.addToHistory(tripId, coordinate);

      console.log('📍 [TRIP-LOCATION] Location updated for trip:', tripId);
    } catch (error) {
      console.error('❌ [TRIP-LOCATION] Error updating location:', error);
      // Queue for retry
      this.pendingUpdates.push(coordinate);
      throw error;
    }
  }

  /**
   * Add coordinate to history subcollection.
   */
  private async addToHistory(tripId: string, coordinate: Coordinate): Promise<void> {
    try {
      const historyRef = firestore()
        .collection(this.COLLECTION_NAME)
        .doc(tripId)
        .collection(this.COORDINATES_SUBCOLLECTION);

      await historyRef.add({
        ...coordinate,
        recordedAt: Date.now(),
      });
    } catch (error) {
      console.warn('⚠️ [TRIP-LOCATION] Error adding to history:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Get current trip location.
   */
  async getTripLocation(tripId: string): Promise<TripLocation | null> {
    try {
      const doc = await firestore().collection(this.COLLECTION_NAME).doc(tripId).get();

      if (doc.exists) {
        return doc.data() as TripLocation;
      }

      return null;
    } catch (error) {
      console.error('❌ [TRIP-LOCATION] Error getting trip location:', error);
      return null;
    }
  }

  /**
   * Get coordinate history for a trip.
   */
  async getCoordinateHistory(tripId: string): Promise<Coordinate[]> {
    try {
      const snapshot = await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(tripId)
        .collection(this.COORDINATES_SUBCOLLECTION)
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map(doc => doc.data() as Coordinate);
    } catch (error) {
      console.error('❌ [TRIP-LOCATION] Error getting history:', error);
      return [];
    }
  }

  /**
   * Complete trip tracking.
   */
  async completeTripLocation(tripId: string): Promise<void> {
    try {
      console.log('🏁 [TRIP-LOCATION] Completing trip:', tripId);

      await firestore().collection(this.COLLECTION_NAME).doc(tripId).update({
        status: 'COMPLETED',
        lastUpdate: Date.now(),
      });

      this.currentTripId = null;
      console.log('✅ [TRIP-LOCATION] Trip completed:', tripId);
    } catch (error) {
      console.error('❌ [TRIP-LOCATION] Error completing trip:', error);
      throw error;
    }
  }

  /**
   * Subscribe to trip location updates in real-time.
   */
  subscribeToTripLocation(
    tripId: string,
    callback: (tripLocation: TripLocation | null) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection(this.COLLECTION_NAME)
      .doc(tripId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback(doc.data() as TripLocation);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('❌ [TRIP-LOCATION] Subscription error:', error);
          callback(null);
        }
      );

    return unsubscribe;
  }

  /**
   * Get all active trips for a company (for dashboard).
   */
  async getActiveTripsForCompany(companyId: number): Promise<TripLocation[]> {
    try {
      const snapshot = await firestore()
        .collection(this.COLLECTION_NAME)
        .where('companyId', '==', companyId)
        .where('status', '==', 'ACTIVE')
        .get();

      return snapshot.docs.map(doc => doc.data() as TripLocation);
    } catch (error) {
      console.error('❌ [TRIP-LOCATION] Error getting active trips:', error);
      return [];
    }
  }

  /**
   * Retry pending updates (for offline support).
   */
  async retryPendingUpdates(): Promise<void> {
    if (this.pendingUpdates.length === 0 || !this.currentTripId) {
      return;
    }

    console.log('🔄 [TRIP-LOCATION] Retrying', this.pendingUpdates.length, 'pending updates');

    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];

    for (const coordinate of updates) {
      try {
        await this.updateCurrentLocation(this.currentTripId, coordinate);
      } catch (error) {
        console.error('❌ [TRIP-LOCATION] Retry failed:', error);
        // Re-queue failed update
        this.pendingUpdates.push(coordinate);
      }
    }
  }

  /**
   * Get pending updates count.
   */
  getPendingUpdatesCount(): number {
    return this.pendingUpdates.length;
  }

  /**
   * Get current trip ID.
   */
  getCurrentTripId(): string | null {
    return this.currentTripId;
  }

  /**
   * Set current trip ID (for resuming a trip).
   */
  setCurrentTripId(tripId: string): void {
    this.currentTripId = tripId;
  }
}

export default new TripLocationService();

