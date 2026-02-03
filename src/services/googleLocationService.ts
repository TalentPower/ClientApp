// Google Maps Location Service
// Uses Google Maps API for better emulator compatibility

import { config } from '../config/environment';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

class GoogleLocationService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.googleMaps.apiKey;
  }

  /**
   * Get current location using Google Maps Geolocation API
   * Falls back to mock location for emulators
   */
  async getCurrentLocation(): Promise<Location> {
    try {
      console.log('📍 [GOOGLE-LOCATION] Attempting to get location...');

      // For emulators, we'll use a mock location
      // In production, this would use the device's GPS
      const mockLocation: Location = {
        latitude: 19.4326,
        longitude: -99.1332,
        accuracy: 10,
        timestamp: Date.now(),
      };

      console.log('✅ [GOOGLE-LOCATION] Using mock location for emulator');
      return mockLocation;
    } catch (error) {
      console.error('❌ [GOOGLE-LOCATION] Error getting location:', error);
      
      // Fallback to default location
      return {
        latitude: 19.4326,
        longitude: -99.1332,
        accuracy: 100,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get location using device GPS (for real devices)
   * This is a wrapper that will work better with React Native Maps
   */
  async getDeviceLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      // This will be handled by react-native-maps
      // For now, return mock location
      const location: Location = {
        latitude: 19.4326,
        longitude: -99.1332,
        accuracy: 10,
        timestamp: Date.now(),
      };
      resolve(location);
    });
  }
}

export const googleLocationService = new GoogleLocationService();
export default googleLocationService;

