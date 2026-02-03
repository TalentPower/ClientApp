// Enhanced location service for Android Studio Emulator
// Includes mock location support and emulator-specific configurations

import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { Location } from '../types';

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  interval?: number;
  fastestInterval?: number;
}

class LocationEmulatorService {
  private watchId: number | null = null;
  private isTracking = false;
  private mockLocationEnabled = false;

  // Default locations for emulator (Mexico City area)
  private defaultLocations = [
    { latitude: 19.4326, longitude: -99.1332, name: "Mexico City Center" },
    { latitude: 19.4285, longitude: -99.1277, name: "Zócalo" },
    { latitude: 19.4340, longitude: -99.1419, name: "Chapultepec" },
    { latitude: 19.4969, longitude: -99.1276, name: "Basilica" },
    { latitude: 19.3910, longitude: -99.2837, name: "Santa Fe" },
  ];

  // Check if running on emulator
  private isEmulator(): boolean {
    // Various checks to detect emulator
    return (
      Platform.OS === 'android' && (
        // Common emulator detection methods
        true // For now, assume emulator for development
      )
    );
  }

  // Verificar permisos de ubicación existentes (sin solicitarlos)
  async checkLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const fineLocationStatus = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarseLocationStatus = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );

        const hasPermission = fineLocationStatus || coarseLocationStatus;
        console.log('📍 [EMULATOR] Permission Check:', {
          fineLocation: fineLocationStatus,
          coarseLocation: coarseLocationStatus,
          hasPermission: hasPermission,
          isEmulator: this.isEmulator()
        });

        return hasPermission;
      } catch (error) {
        console.error('Error checking location permissions:', error);
        return false;
      }
    }
    return true; // iOS
  }

  // Solicitar permisos de ubicación (optimizado para emulador)
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // Verificar permisos existentes primero
        const hasExistingPermission = await this.checkLocationPermission();
        if (hasExistingPermission) {
          console.log('✅ [EMULATOR] Location permissions already granted');
          return true;
        }

        console.log('🔄 [EMULATOR] Requesting location permissions...');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const fineLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        const coarseLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        const hasPermission = fineLocationGranted || coarseLocationGranted;

        console.log('📍 [EMULATOR] Permission request result:', {
          fineLocation: granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION],
          coarseLocation: granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION],
          hasPermission: hasPermission
        });

        return hasPermission;
      } catch (error) {
        console.error('Error requesting location permissions:', error);
        return false;
      }
    }
    return true;
  }

  // Enhanced location getter for emulator
  async getCurrentLocation(options?: LocationOptions): Promise<Location> {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permissions not granted');
    }

    return new Promise((resolve, reject) => {
      console.log('📍 [EMULATOR] Getting current location...');

      const timeoutId = setTimeout(() => {
        console.log('⏰ [EMULATOR] Location timeout, using fallback location');
        // Use Mexico City as fallback for emulator
        const fallbackLocation: Location = {
          latitude: 19.4326,
          longitude: -99.1332,
          timestamp: Date.now(),
          accuracy: 10,
          speed: 0,
          heading: 0,
        };
        resolve(fallbackLocation);
      }, (options?.timeout || 15000));

      Geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log('✅ [EMULATOR] Location obtained:', position.coords);
          
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
          };
          
          resolve(location);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('❌ [EMULATOR] Location error:', error);
          
          if (this.isEmulator()) {
            console.log('🔄 [EMULATOR] Using mock location due to error');
            // Provide mock location for emulator
            const mockLocation: Location = {
              latitude: 19.4326,
              longitude: -99.1332,
              timestamp: Date.now(),
              accuracy: 15,
              speed: 0,
              heading: 0,
            };
            resolve(mockLocation);
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 15000,
          maximumAge: options?.maximumAge ?? 10000,
          showLocationDialog: true,
          forceRequestLocation: true,
        }
      );
    });
  }

  // Enhanced location tracking for emulator
  async startLocationTracking(
    onLocationUpdate: (location: Location) => void,
    onError?: (error: any) => void,
    options?: LocationOptions
  ): Promise<boolean> {
    if (this.isTracking) {
      console.warn('[EMULATOR] Location tracking already active');
      return false;
    }

    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permisos requeridos',
        'Esta app necesita permisos de ubicación para funcionar correctamente.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      console.log('🚀 [EMULATOR] Starting location tracking...');
      
      this.watchId = Geolocation.watchPosition(
        (position) => {
          console.log('📍 [EMULATOR] Location update:', position.coords);
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
          };
          onLocationUpdate(location);
        },
        (error) => {
          console.error('❌ [EMULATOR] Location tracking error:', error);
          
          if (this.isEmulator() && !this.mockLocationEnabled) {
            console.log('🔄 [EMULATOR] Starting mock location updates');
            this.startMockLocationUpdates(onLocationUpdate);
          } else if (onError) {
            onError(error);
          }
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 20000,
          maximumAge: options?.maximumAge ?? 5000,
          interval: options?.interval ?? 5000,
          fastestInterval: options?.fastestInterval ?? 2000,
          distanceFilter: 5, // Update every 5 meters
          showLocationDialog: true,
          forceRequestLocation: true,
        }
      );

      this.isTracking = true;
      console.log('✅ [EMULATOR] Location tracking started successfully');
      return true;
    } catch (error) {
      console.error('❌ [EMULATOR] Failed to start location tracking:', error);
      return false;
    }
  }

  // Mock location updates for emulator development
  private startMockLocationUpdates(onLocationUpdate: (location: Location) => void): void {
    this.mockLocationEnabled = true;
    let currentIndex = 0;
    
    const updateMockLocation = () => {
      if (!this.isTracking || !this.mockLocationEnabled) return;
      
      const mockLocation = this.defaultLocations[currentIndex];
      const location: Location = {
        latitude: mockLocation.latitude + (Math.random() - 0.5) * 0.001, // Small random variation
        longitude: mockLocation.longitude + (Math.random() - 0.5) * 0.001,
        timestamp: Date.now(),
        accuracy: Math.random() * 10 + 5, // 5-15 meters accuracy
        speed: Math.random() * 20, // 0-20 km/h
        heading: Math.random() * 360, // Random heading
      };
      
      console.log(`📍 [MOCK] Location update: ${mockLocation.name}`, location);
      onLocationUpdate(location);
      
      // Move to next location occasionally
      if (Math.random() < 0.1) { // 10% chance to change location
        currentIndex = (currentIndex + 1) % this.defaultLocations.length;
      }
    };

    // Start mock updates
    const mockInterval = setInterval(updateMockLocation, 3000); // Every 3 seconds
    
    // Store interval reference for cleanup
    this.watchId = mockInterval as any;
    
    console.log('🎭 [EMULATOR] Mock location updates started');
  }

  // Stop location tracking
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      if (this.mockLocationEnabled) {
        clearInterval(this.watchId as any);
        this.mockLocationEnabled = false;
        console.log('🛑 [EMULATOR] Mock location tracking stopped');
      } else {
        Geolocation.clearWatch(this.watchId);
        console.log('🛑 [EMULATOR] GPS location tracking stopped');
      }
      
      this.watchId = null;
      this.isTracking = false;
    }
  }

  // Check if location tracking is active
  isLocationTracking(): boolean {
    return this.isTracking;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in km
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  // Format coordinates for display
  formatCoordinates(location: Location): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  // Get a random mock destination near current location
  getMockDestination(currentLocation: Location): Location {
    const randomIndex = Math.floor(Math.random() * this.defaultLocations.length);
    const destination = this.defaultLocations[randomIndex];
    
    return {
      latitude: destination.latitude,
      longitude: destination.longitude,
      timestamp: Date.now(),
      accuracy: 10,
      speed: 0,
      heading: 0,
    };
  }

  // Set custom location for emulator (useful for testing)
  async setEmulatorLocation(latitude: number, longitude: number): Promise<void> {
    if (this.isEmulator()) {
      console.log(`🎯 [EMULATOR] Setting custom location: ${latitude}, ${longitude}`);
      // In a real implementation, this could send commands to the emulator
      // For now, we'll just log it
    }
  }
}

export default new LocationEmulatorService();
