// Servicio de geolocalización para rastreo de conductores

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

class LocationService {
  private watchId: number | null = null;
  private isTracking = false;

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
        console.log('📍 Permission Check:', {
          fineLocation: fineLocationStatus,
          coarseLocation: coarseLocationStatus,
          hasPermission: hasPermission
        });

        return hasPermission;
      } catch (error) {
        console.error('Error al verificar permisos de ubicación:', error);
        return false;
      }
    }
    return true; // iOS maneja permisos automáticamente
  }

  // Solicitar permisos de ubicación (mejorado)
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // Primero verificar si ya tenemos permisos
        const hasExistingPermission = await this.checkLocationPermission();
        if (hasExistingPermission) {
          console.log('✅ Permisos de ubicación ya otorgados');
          return true;
        }

        console.log('🔄 Solicitando permisos de ubicación...');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const fineLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        const coarseLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        const hasPermission = fineLocationGranted || coarseLocationGranted;

        console.log('📍 Resultado de solicitud de permisos:', {
          fineLocation: granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION],
          coarseLocation: granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION],
          hasPermission: hasPermission
        });

        return hasPermission;
      } catch (error) {
        console.error('Error al solicitar permisos de ubicación:', error);
        return false;
      }
    }
    return true; // iOS maneja permisos automáticamente
  }

  // Solicitar permiso de ubicación en segundo plano (Android 10+)
  async requestBackgroundLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Permiso de ubicación en segundo plano',
            message: 'Esta app necesita acceso a la ubicación en segundo plano para rastrear conductores.',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar',
          }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Error al solicitar permiso de ubicación en segundo plano:', error);
        return false;
      }
    }
    return true;
  }

  // Obtener ubicación actual
  async getCurrentLocation(options?: LocationOptions): Promise<Location> {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Permisos de ubicación no otorgados');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };
          resolve(location);
        },
        (error) => {
          console.error('Error al obtener ubicación:', error);
          reject(error);
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 15000,
          maximumAge: options?.maximumAge ?? 10000,
        }
      );
    });
  }

  // Iniciar rastreo de ubicación
  async startLocationTracking(
    onLocationUpdate: (location: Location) => void,
    onError?: (error: any) => void,
    options?: LocationOptions
  ): Promise<boolean> {
    if (this.isTracking) {
      console.warn('El rastreo de ubicación ya está activo');
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
      this.watchId = Geolocation.watchPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };
          onLocationUpdate(location);
        },
        (error) => {
          console.error('Error en rastreo de ubicación:', error);
          if (onError) {
            onError(error);
          }
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 20000,
          maximumAge: options?.maximumAge ?? 5000,
          interval: options?.interval ?? 5000,
          fastestInterval: options?.fastestInterval ?? 2000,
          distanceFilter: 10, // Actualizar cada 10 metros
        }
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error al iniciar rastreo de ubicación:', error);
      return false;
    }
  }

  // Detener rastreo de ubicación
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
  }

  // Verificar si el rastreo está activo
  isLocationTracking(): boolean {
    return this.isTracking;
  }

  // Calcular distancia entre dos puntos (fórmula de Haversine)
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distancia en km
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  // Formatear coordenadas para mostrar
  formatCoordinates(location: Location): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }
}

export default new LocationService();
