// Configuración y servicios de Firebase

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Driver, Location, Route, User } from '../types';

class FirebaseService {
  // Autenticación
  async signIn(email: string, password: string) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, userData: Partial<User>) {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Guardar información adicional del usuario en Firestore
      await this.createUser(user.uid, {
        id: user.uid,
        email: user.email || email,
        name: userData.name || '',
        role: userData.role || 'driver',
        createdAt: Date.now(),
      });
      
      return user;
    } catch (error) {
      console.error('Error al registrarse:', error);
      throw error;
    }
  }

  // Usuarios
  async createUser(userId: string, userData: User) {
    try {
      await firestore().collection('users').doc(userId).set(userData);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const doc = await firestore().collection('users').doc(userId).get();
      return doc.exists ? (doc.data() as User) : null;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  // Conductores
  async createDriver(driverData: Driver) {
    try {
      await firestore().collection('drivers').doc(driverData.id).set(driverData);
    } catch (error) {
      console.error('Error al crear conductor:', error);
      throw error;
    }
  }

  async updateDriverLocation(driverId: string, location: Location) {
    try {
      await firestore().collection('drivers').doc(driverId).update({
        currentLocation: location,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error al actualizar ubicación del conductor:', error);
      throw error;
    }
  }

  async getActiveDrivers(): Promise<Driver[]> {
    try {
      const snapshot = await firestore()
        .collection('drivers')
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map(doc => doc.data() as Driver);
    } catch (error) {
      console.error('Error al obtener conductores activos:', error);
      return [];
    }
  }

  // Rutas
  async createRoute(routeData: Route) {
    try {
      await firestore().collection('routes').doc(routeData.id).set(routeData);
    } catch (error) {
      console.error('Error al crear ruta:', error);
      throw error;
    }
  }

  async updateRoute(routeId: string, updates: Partial<Route>) {
    try {
      await firestore().collection('routes').doc(routeId).update(updates);
    } catch (error) {
      console.error('Error al actualizar ruta:', error);
      throw error;
    }
  }

  async getDriverRoutes(driverId: string): Promise<Route[]> {
    try {
      const snapshot = await firestore()
        .collection('routes')
        .where('driverId', '==', driverId)
        .orderBy('startTime', 'desc')
        .get();
      
      return snapshot.docs.map(doc => doc.data() as Route);
    } catch (error) {
      console.error('Error al obtener rutas del conductor:', error);
      return [];
    }
  }

  // Escuchar cambios en tiempo real
  subscribeToDriverUpdates(callback: (drivers: Driver[]) => void) {
    return firestore()
      .collection('drivers')
      .where('isActive', '==', true)
      .onSnapshot(snapshot => {
        const drivers = snapshot.docs.map(doc => doc.data() as Driver);
        callback(drivers);
      });
  }

  subscribeToRouteUpdates(driverId: string, callback: (routes: Route[]) => void) {
    return firestore()
      .collection('routes')
      .where('driverId', '==', driverId)
      .orderBy('startTime', 'desc')
      .onSnapshot(snapshot => {
        const routes = snapshot.docs.map(doc => doc.data() as Route);
        callback(routes);
      });
  }
}

export default new FirebaseService();
