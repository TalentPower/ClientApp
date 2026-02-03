/**
 * Driver Route Service
 * Manages driver routes and coordinates in Firebase
 * 
 * @deprecated Este servicio usa la colección driver_routes/{driverId} que es problemática:
 * - Múltiples viajes del mismo conductor sobrescriben datos
 * - No hay vinculación directa con tripId
 * - Puede causar conflictos de sincronización
 * 
 * USE EN SU LUGAR:
 * - tripApiService.sendLocation(tripId, coordinate) para enviar ubicaciones al backend
 * - tripLocationService para operaciones Firebase con tripId
 * 
 * El backend (Spring Boot) usa:
 * - POST /api/trip-locations/{tripId}/coordinates (recomendado)
 * - trip_locations/{tripId} en Firebase
 * 
 * @see tripApiService
 * @see tripLocationService
 */

import firestore from '@react-native-firebase/firestore';
import { LoginResponse } from './apiAuth';

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface DriverRoute {
  driverId: string;
  driverName: string;
  coordinates: Coordinate[];
  lastUpdate: number;
  createdAt: number;
  isActive: boolean;
}

/**
 * @deprecated Use tripApiService y tripLocationService en su lugar.
 * Este servicio se mantiene solo para compatibilidad con código antiguo.
 */
class DriverRouteService {
  private readonly COLLECTION_NAME = 'driver_routes';

  /**
   * Initialize or update driver route document in Firebase
   * Called after login to create/update the driver's route record
   * 
   * @deprecated Use tripLocationService.initializeTripLocation(tripId) en su lugar.
   * El backend inicializa automáticamente cuando se inicia un viaje con POST /api/route-trips/{tripId}/start
   */
  async initializeDriverRoute(userData: LoginResponse): Promise<void> {
    console.warn('⚠️ [DEPRECATED] initializeDriverRoute() is deprecated. Use tripApiService instead.');
    try {
      console.log('🔄 [DRIVER-ROUTE] Initializing route for driver:', userData.id);

      const driverRouteRef = firestore().collection(this.COLLECTION_NAME).doc(userData.id);

      // Check if document exists
      const doc = await driverRouteRef.get();

      if (doc.exists) {
        // Update existing document
        await driverRouteRef.update({
          driverName: userData.name,
          lastUpdate: Date.now(),
          isActive: true,
        });
        console.log('✅ [DRIVER-ROUTE] Updated existing route for driver:', userData.id);
      } else {
        // Create new document
        const newRoute: DriverRoute = {
          driverId: userData.id,
          driverName: userData.name,
          coordinates: [],
          lastUpdate: Date.now(),
          createdAt: Date.now(),
          isActive: true,
        };

        await driverRouteRef.set(newRoute);
        console.log('✅ [DRIVER-ROUTE] Created new route for driver:', userData.id);
      }
    } catch (error) {
      console.error('❌ [DRIVER-ROUTE] Error initializing driver route:', error);
      throw new Error('Failed to initialize driver route');
    }
  }

  /**
   * Add a coordinate to the driver's route
   * This appends a new coordinate to the coordinates array
   * 
   * @deprecated Use tripApiService.sendLocation(tripId, coordinate) en su lugar.
   * Esto envía la ubicación al backend que la sincroniza con PostgreSQL y Firebase.
   */
  async addCoordinate(driverId: string, coordinate: Coordinate): Promise<void> {
    console.warn('⚠️ [DEPRECATED] addCoordinate() is deprecated. Use tripApiService.sendLocation(tripId, coordinate) instead.');
    try {
      console.log('📍 [DRIVER-ROUTE] Adding coordinate for driver:', driverId, coordinate);

      const driverRouteRef = firestore().collection(this.COLLECTION_NAME).doc(driverId);

      // Check if document exists first
      const doc = await driverRouteRef.get();

      if (!doc.exists) {
        // Document doesn't exist, create it first
        console.log('⚠️ [DRIVER-ROUTE] Document does not exist, creating it...');
        await driverRouteRef.set({
          driverId: driverId,
          driverName: 'Unknown', // Will be updated on next login
          coordinates: [coordinate],
          lastUpdate: Date.now(),
          createdAt: Date.now(),
          isActive: true,
        });
        console.log('✅ [DRIVER-ROUTE] Document created and coordinate added');
        return;
      }

      // Document exists, use arrayUnion to add coordinate
      await driverRouteRef.update({
        coordinates: firestore.FieldValue.arrayUnion(coordinate),
        lastUpdate: Date.now(),
      });

      console.log('✅ [DRIVER-ROUTE] Coordinate added successfully');
    } catch (error) {
      console.error('❌ [DRIVER-ROUTE] Error adding coordinate:', error);
      // Log the full error for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      throw new Error('Failed to add coordinate to route');
    }
  }

  /**
   * Get driver's route
   */
  async getDriverRoute(driverId: string): Promise<DriverRoute | null> {
    try {
      const doc = await firestore().collection(this.COLLECTION_NAME).doc(driverId).get();

      if (doc.exists) {
        return doc.data() as DriverRoute;
      }

      return null;
    } catch (error) {
      console.error('❌ [DRIVER-ROUTE] Error getting driver route:', error);
      return null;
    }
  }

  /**
   * Clear driver's route coordinates
   * Useful when starting a new trip
   * 
   * @deprecated No hay equivalente directo. El nuevo sistema usa tripId único por viaje,
   * por lo que no es necesario limpiar coordenadas.
   */
  async clearRoute(driverId: string): Promise<void> {
    console.warn('⚠️ [DEPRECATED] clearRoute() is deprecated. Use tripId-based tracking instead.');
    try {
      console.log('🗑️ [DRIVER-ROUTE] Clearing route for driver:', driverId);

      await firestore().collection(this.COLLECTION_NAME).doc(driverId).update({
        coordinates: [],
        lastUpdate: Date.now(),
      });

      console.log('✅ [DRIVER-ROUTE] Route cleared successfully');
    } catch (error) {
      console.error('❌ [DRIVER-ROUTE] Error clearing route:', error);
      throw new Error('Failed to clear route');
    }
  }

  /**
   * Set driver as inactive
   * 
   * @deprecated Use tripApiService.finishTrip(tripId) que marca el viaje como completado
   * y actualiza el estado en Firebase automáticamente.
   */
  async setDriverInactive(driverId: string): Promise<void> {
    console.warn('⚠️ [DEPRECATED] setDriverInactive() is deprecated. Use tripApiService.finishTrip(tripId) instead.');
    try {
      await firestore().collection(this.COLLECTION_NAME).doc(driverId).update({
        isActive: false,
        lastUpdate: Date.now(),
      });

      console.log('✅ [DRIVER-ROUTE] Driver set as inactive');
    } catch (error) {
      console.error('❌ [DRIVER-ROUTE] Error setting driver inactive:', error);
      throw new Error('Failed to set driver inactive');
    }
  }

  /**
   * Set driver as active
   * 
   * @deprecated Use tripApiService.startTrip(tripId) que inicia el viaje
   * y configura el tracking en Firebase automáticamente.
   */
  async setDriverActive(driverId: string): Promise<void> {
    console.warn('⚠️ [DEPRECATED] setDriverActive() is deprecated. Use tripApiService.startTrip(tripId) instead.');
    try {
      await firestore().collection(this.COLLECTION_NAME).doc(driverId).update({
        isActive: true,
        lastUpdate: Date.now(),
      });

      console.log('✅ [DRIVER-ROUTE] Driver set as active');
    } catch (error) {
      console.error('❌ [DRIVER-ROUTE] Error setting driver active:', error);
      throw new Error('Failed to set driver active');
    }
  }

  /**
   * Subscribe to driver route updates in real-time
   */
  subscribeToDriverRoute(
    driverId: string,
    callback: (route: DriverRoute | null) => void
  ): () => void {
    const unsubscribe = firestore()
      .collection(this.COLLECTION_NAME)
      .doc(driverId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback(doc.data() as DriverRoute);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('❌ [DRIVER-ROUTE] Error in subscription:', error);
          callback(null);
        }
      );

    return unsubscribe;
  }
}

export default new DriverRouteService();

