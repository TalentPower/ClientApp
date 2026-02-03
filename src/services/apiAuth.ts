// Custom API Authentication Service
// Integrates with api-sipe.com for authentication and Firebase for session management

import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { config } from '../config/environment';
import driverRouteService from './driverRouteService';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  companies: string;
  role: string;
  jwt: string;
  name: string;
  id: string;
  companiesId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: LoginResponse | null;
  loading: boolean;
}

class ApiAuthService {
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly USER_DATA_KEY = 'user_data';

  // Login with custom API
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Login failed: ${response.status} - ${errorData}`);
      }

      const userData: LoginResponse = await response.json();

      // Store authentication data
      await this.storeAuthData(userData);

      // Create Firebase anonymous session for security rules
      await this.createFirebaseSession(userData);

      // Initialize driver route in Firebase using the user's id
      try {
        await driverRouteService.initializeDriverRoute(userData);
        console.log('✅ [AUTH] Driver route initialized in Firebase');
      } catch (error) {
        console.error('⚠️ [AUTH] Failed to initialize driver route:', error);
        // Don't throw error here - login should still succeed even if route init fails
      }

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  // Create Firebase session - simplified approach
  private async createFirebaseSession(userData: LoginResponse): Promise<void> {
    try {
      // For now, we'll skip Firebase Auth and use Firestore directly
      // This avoids admin-restricted-operation errors
      console.log('Skipping Firebase Auth - using Firestore directly for user:', userData.name);
    } catch (error) {
      console.error('Firebase session creation failed:', error);
      // Don't throw error here as the main auth is with custom API
    }
  }

  // Store authentication data locally
  private async storeAuthData(userData: LoginResponse): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.AUTH_TOKEN_KEY, userData.jwt],
        [this.USER_DATA_KEY, JSON.stringify(userData)],
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  // Get stored JWT token
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  // Get stored user data
  async getUserData(): Promise<LoginResponse | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const userData = await this.getUserData();
      
      if (!token || !userData) {
        return false;
      }

      // Check token expiration
      return this.isTokenValid(token);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  // Validate JWT token
  private isTokenValid(token: string): boolean {
    try {
      // Decode JWT payload (basic validation)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Simple base64 decode for React Native
      const payload = JSON.parse(this.base64Decode(base64));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Simple base64 decode implementation for React Native
  private base64Decode(str: string): string {
    try {
      // Add padding if needed
      while (str.length % 4) {
        str += '=';
      }
      
      // For React Native, we'll use a simple approach
      // In a real implementation, you might want to use a proper base64 library
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      let i = 0;
      
      while (i < str.length) {
        const a = chars.indexOf(str.charAt(i++));
        const b = chars.indexOf(str.charAt(i++));
        const c = chars.indexOf(str.charAt(i++));
        const d = chars.indexOf(str.charAt(i++));
        
        const bitmap = (a << 18) | (b << 12) | (c << 6) | d;
        
        result += String.fromCharCode((bitmap >> 16) & 255);
        if (c !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
        if (d !== 64) result += String.fromCharCode(bitmap & 255);
      }
      
      return result;
    } catch (error) {
      console.error('Base64 decode error:', error);
      return '';
    }
  }

  // Get authorization header for API requests
  async getAuthHeader(): Promise<{ Authorization: string } | {}> {
    const token = await this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Clear local storage
      await AsyncStorage.multiRemove([this.AUTH_TOKEN_KEY, this.USER_DATA_KEY]);
      
      // Skip Firebase signout since we're not using Firebase Auth
      // await auth().signOut();
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  // Refresh token (if API supports it)
  async refreshToken(): Promise<boolean> {
    try {
      const userData = await this.getUserData();
      if (!userData) {
        return false;
      }

      // For now, we don't have refresh endpoint, so return false
      // This can be implemented when refresh token endpoint is available
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Get user companies as array
  async getUserCompanies(): Promise<string[]> {
    const userData = await this.getUserData();
    if (!userData || !userData.companies) {
      return [];
    }
    
    return userData.companies.split(', ').map(company => company.trim());
  }

  // Get user company IDs as array
  async getUserCompanyIds(): Promise<string[]> {
    const userData = await this.getUserData();
    if (!userData || !userData.companiesId) {
      return [];
    }
    
    return userData.companiesId.split(', ').map(id => id.trim());
  }

  // Get user role
  async getUserRole(): Promise<string | null> {
    const userData = await this.getUserData();
    return userData?.role || null;
  }
}

export default new ApiAuthService();
