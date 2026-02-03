// ============================================================
// Trip API Service - Complete Backend Integration
// Communicates with Spring Boot backend for all trip operations
// Server: http://98.93.56.182:8080/
// ============================================================

import apiAuth from './apiAuth';
import { config } from '../config/environment';
import {
  Trip,
  TripWithDetails,
  TripStop,
  TripPassenger,
  TripIncident,
  RouteStop,
  Coordinate,
  TripStatus,
  AttendanceRequest,
  CreateIncidentRequest,
  ChecklistSubmission,
  ChecklistValidationResult,
  RealtimeRoute,
  GeofenceCheckResult,
} from '../types';

class TripApiService {
  private readonly BASE_URL = config.api.baseUrl;

  // ============ HELPER METHODS ============

  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const authHeader = await apiAuth.getAuthHeader();
    
    const response = await fetch(`${this.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.data ?? data;
  }

  // ============ TRIP OPERATIONS ============

  /**
   * Get trips for the currently authenticated driver on a specific date.
   * Uses the new /my-trips endpoint that doesn't require passing driver ID.
   */
  async getMyTrips(date: string): Promise<Trip[]> {
    try {
      console.log('🔄 [TRIP-API] Getting my trips for date:', date);
      const trips = await this.fetchWithAuth<Trip[]>(
        `/api/route-trips/my-trips?date=${date}`
      );
      console.log('✅ [TRIP-API] My trips retrieved:', trips.length);
      return trips;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting my trips:', error);
      return [];
    }
  }

  /**
   * Get driver's trips for a specific date by userId.
   * Note: driverUserId is the ID from user_entity table, NOT employee table.
   */
  async getDriverTrips(driverUserId: string, date: string): Promise<Trip[]> {
    try {
      console.log('🔄 [TRIP-API] Getting trips for driver userId:', driverUserId, 'date:', date);
      const trips = await this.fetchWithAuth<Trip[]>(
        `/api/route-trips/driver/${driverUserId}?date=${date}`
      );
      console.log('✅ [TRIP-API] Driver trips retrieved:', trips.length);
      return trips;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting driver trips:', error);
      return [];
    }
  }

  /**
   * Get today's trips for authenticated driver (legacy endpoint)
   * @deprecated Use getMyTrips() instead
   */
  async getTodayTrips(companyId: string): Promise<Trip[]> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const authHeader = await apiAuth.getAuthHeader();
      const response = await fetch(
        `${this.BASE_URL}/api/driver/routes?companyId=${companyId}&date=${today}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...authHeader,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get today trips: ${response.status}`);
      }

      const data = await response.json();
      return data.data ?? [];
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting today trips:', error);
      return [];
    }
  }

  /**
   * Get trip by ID with full details
   */
  async getTripById(tripId: string): Promise<TripWithDetails | null> {
    try {
      console.log('🔄 [TRIP-API] Getting trip:', tripId);
      const trip = await this.fetchWithAuth<TripWithDetails>(
        `/api/route-trips/${tripId}`
      );
      console.log('✅ [TRIP-API] Trip retrieved:', trip.id);
      return trip;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting trip:', error);
      return null;
    }
  }

  // ============ CHECKLIST OPERATIONS ============

  /**
   * Start the checklist process for a trip
   */
  async startChecklist(tripId: string): Promise<{ status: string; message: string }> {
    try {
      console.log('🔄 [TRIP-API] Starting checklist for trip:', tripId);
      const result = await this.fetchWithAuth<{ status: string; message: string }>(
        `/api/route-trips/${tripId}/checklist/start`,
        { method: 'POST' }
      );
      console.log('✅ [TRIP-API] Checklist started');
      return result;
    } catch (error) {
      console.error('❌ [TRIP-API] Error starting checklist:', error);
      throw error;
    }
  }

  /**
   * Submit completed checklist
   */
  async submitChecklist(submission: ChecklistSubmission): Promise<ChecklistValidationResult> {
    try {
      console.log('🔄 [TRIP-API] Submitting checklist for trip:', submission.tripId);
      const result = await this.fetchWithAuth<ChecklistValidationResult>(
        `/api/route-trips/${submission.tripId}/checklist/submit`,
        {
          method: 'POST',
          body: JSON.stringify(submission),
        }
      );
      console.log('✅ [TRIP-API] Checklist submitted, passed:', result.passed);
      return result;
    } catch (error) {
      console.error('❌ [TRIP-API] Error submitting checklist:', error);
      throw error;
    }
  }

  /**
   * Get checklist items for a trip
   */
  async getChecklistItems(tripId: string): Promise<any[]> {
    try {
      const items = await this.fetchWithAuth<any[]>(
        `/api/route-trips/${tripId}/checklist`
      );
      return items;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting checklist items:', error);
      return [];
    }
  }

  // ============ TRIP LIFECYCLE ============

  /**
   * Start a trip (after checklist is completed)
   */
  async startTrip(tripId: string): Promise<Trip> {
    try {
      console.log('🔄 [TRIP-API] Starting trip:', tripId);
      const trip = await this.fetchWithAuth<Trip>(
        `/api/route-trips/${tripId}/start`,
        { method: 'POST' }
      );
      console.log('✅ [TRIP-API] Trip started');
      return trip;
    } catch (error) {
      console.error('❌ [TRIP-API] Error starting trip:', error);
      throw error;
    }
  }

  /**
   * Finish a trip
   */
  async finishTrip(tripId: string): Promise<Trip> {
    try {
      console.log('🔄 [TRIP-API] Finishing trip:', tripId);
      const trip = await this.fetchWithAuth<Trip>(
        `/api/route-trips/${tripId}/finish`,
        { method: 'POST' }
      );
      console.log('✅ [TRIP-API] Trip finished');
      return trip;
    } catch (error) {
      console.error('❌ [TRIP-API] Error finishing trip:', error);
      throw error;
    }
  }

  // ============ LOCATION TRACKING ============

  /**
   * Start location tracking for a trip
   */
  async startTracking(tripId: string): Promise<void> {
    try {
      console.log('🔄 [TRIP-API] Starting tracking for trip:', tripId);
      await this.fetchWithAuth<any>(
        `/api/trip-locations/${tripId}/start`,
        { method: 'POST' }
      );
      console.log('✅ [TRIP-API] Tracking started');
    } catch (error) {
      console.error('❌ [TRIP-API] Error starting tracking:', error);
      throw error;
    }
  }

  /**
   * Stop location tracking for a trip
   */
  async stopTracking(tripId: string): Promise<void> {
    try {
      console.log('🔄 [TRIP-API] Stopping tracking for trip:', tripId);
      await this.fetchWithAuth<any>(
        `/api/trip-locations/${tripId}/stop`,
        { method: 'POST' }
      );
      console.log('✅ [TRIP-API] Tracking stopped');
    } catch (error) {
      console.error('❌ [TRIP-API] Error stopping tracking:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Send current location to backend
   * Uses the new tripId-based endpoint
   */
  async sendLocation(tripId: string, coordinate: Coordinate): Promise<GeofenceCheckResult | null> {
    try {
      const authHeader = await apiAuth.getAuthHeader();
      
      const response = await fetch(
        `${this.BASE_URL}/api/trip-locations/${tripId}/coordinates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            accuracy: coordinate.accuracy,
            timestamp: coordinate.timestamp || new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send location: ${response.status}`);
      }

      const data = await response.json();
      return {
        onRoute: data.data?.onRoute ?? true,
        deviationKm: data.data?.deviationKm,
        arrivedAtStop: data.data?.arrivedAtStop,
        stopName: data.data?.arrivedAtStop,
        alerts: data.data?.alerts,
      };
    } catch (error) {
      console.error('❌ [TRIP-API] Error sending location:', error);
      return null;
    }
  }

  /**
   * Get current trip location
   */
  async getCurrentLocation(tripId: string): Promise<Coordinate | null> {
    try {
      const location = await this.fetchWithAuth<Coordinate>(
        `/api/trip-locations/${tripId}/current`
      );
      return location;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get coordinate history for a trip
   */
  async getCoordinateHistory(tripId: string): Promise<Coordinate[]> {
    try {
      const history = await this.fetchWithAuth<Coordinate[]>(
        `/api/trip-locations/${tripId}/history`
      );
      return history;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting coordinate history:', error);
      return [];
    }
  }

  // ============ ROUTE STOPS ============

  /**
   * Get stops for a route
   */
  async getRouteStops(routeId: string): Promise<RouteStop[]> {
    try {
      console.log('🔄 [TRIP-API] Getting stops for route:', routeId);
      const stops = await this.fetchWithAuth<RouteStop[]>(
        `/api/route-stops/route/${routeId}`
      );
      console.log('✅ [TRIP-API] Stops retrieved:', stops.length);
      return stops;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting route stops:', error);
      return [];
    }
  }

  /**
   * Mark arrival at a stop
   */
  async markStopArrival(
    tripId: string,
    stopId: string,
    coordinate: Coordinate
  ): Promise<TripStop | null> {
    try {
      console.log('🔄 [TRIP-API] Marking arrival at stop:', stopId);
      // This endpoint would need to be created in backend
      const result = await this.fetchWithAuth<TripStop>(
        `/api/route-trips/${tripId}/stops/${stopId}/arrive`,
        {
          method: 'POST',
          body: JSON.stringify({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            arrivalTime: new Date().toISOString(),
          }),
        }
      );
      console.log('✅ [TRIP-API] Stop arrival marked');
      return result;
    } catch (error) {
      console.error('❌ [TRIP-API] Error marking stop arrival:', error);
      return null;
    }
  }

  /**
   * Mark departure from a stop
   */
  async markStopDeparture(
    tripId: string,
    stopId: string
  ): Promise<TripStop | null> {
    try {
      console.log('🔄 [TRIP-API] Marking departure from stop:', stopId);
      const result = await this.fetchWithAuth<TripStop>(
        `/api/route-trips/${tripId}/stops/${stopId}/depart`,
        { method: 'POST' }
      );
      console.log('✅ [TRIP-API] Stop departure marked');
      return result;
    } catch (error) {
      console.error('❌ [TRIP-API] Error marking stop departure:', error);
      return null;
    }
  }

  // ============ ATTENDANCE / PASSENGERS ============

  /**
   * Get passengers for a trip
   */
  async getTripPassengers(tripId: string): Promise<TripPassenger[]> {
    try {
      console.log('🔄 [TRIP-API] Getting passengers for trip:', tripId);
      // This would use the attendance endpoint
      const passengers = await this.fetchWithAuth<TripPassenger[]>(
        `/api/attendance/trip/${tripId}`
      );
      console.log('✅ [TRIP-API] Passengers retrieved:', passengers.length);
      return passengers;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting passengers:', error);
      return [];
    }
  }

  /**
   * Mark passenger boarding (driver's push-in)
   */
  async markPassengerBoarding(
    tripId: string,
    employeeId: string,
    coordinate?: Coordinate
  ): Promise<TripPassenger | null> {
    try {
      console.log('🔄 [TRIP-API] Marking boarding for employee:', employeeId);
      const authHeader = await apiAuth.getAuthHeader();
      
      const response = await fetch(
        `${this.BASE_URL}/api/attendance/check-in`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            tripId: parseInt(tripId, 10),
            employeeId: parseInt(employeeId, 10),
            latitude: coordinate?.latitude,
            longitude: coordinate?.longitude,
            checkInTime: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark boarding: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [TRIP-API] Passenger boarding marked');
      return data.data;
    } catch (error) {
      console.error('❌ [TRIP-API] Error marking boarding:', error);
      return null;
    }
  }

  /**
   * Register new passenger entry (temporary until approved)
   */
  async registerNewPassenger(
    tripId: string,
    passengerData: {
      name: string;
      phone?: string;
      stopId?: string;
    }
  ): Promise<TripPassenger | null> {
    try {
      console.log('🔄 [TRIP-API] Registering new passenger:', passengerData.name);
      // This would create a temporary employee entry
      const result = await this.fetchWithAuth<TripPassenger>(
        `/api/route-trips/${tripId}/passengers/new-entry`,
        {
          method: 'POST',
          body: JSON.stringify(passengerData),
        }
      );
      console.log('✅ [TRIP-API] New passenger registered');
      return result;
    } catch (error) {
      console.error('❌ [TRIP-API] Error registering new passenger:', error);
      return null;
    }
  }

  // ============ INCIDENTS ============

  /**
   * Get incidents for a trip
   */
  async getTripIncidents(tripId: string): Promise<TripIncident[]> {
    try {
      console.log('🔄 [TRIP-API] Getting incidents for trip:', tripId);
      const incidents = await this.fetchWithAuth<TripIncident[]>(
        `/api/route-trips/${tripId}/incidents`
      );
      console.log('✅ [TRIP-API] Incidents retrieved:', incidents.length);
      return incidents;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting incidents:', error);
      return [];
    }
  }

  /**
   * Create an incident
   */
  async createIncident(request: CreateIncidentRequest): Promise<TripIncident | null> {
    try {
      console.log('🔄 [TRIP-API] Creating incident for trip:', request.tripId);
      const incident = await this.fetchWithAuth<TripIncident>(
        `/api/route-trips/${request.tripId}/incidents`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      console.log('✅ [TRIP-API] Incident created:', incident.id);
      return incident;
    } catch (error) {
      console.error('❌ [TRIP-API] Error creating incident:', error);
      throw error;
    }
  }

  /**
   * Upload incident evidence file
   */
  async uploadIncidentEvidence(
    incidentId: string,
    fileUri: string,
    fileType: 'image' | 'video'
  ): Promise<string | null> {
    try {
      console.log('🔄 [TRIP-API] Uploading evidence for incident:', incidentId);
      const authHeader = await apiAuth.getAuthHeader();
      
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: fileType === 'image' ? 'image/jpeg' : 'video/mp4',
        name: `evidence_${incidentId}_${Date.now()}.${fileType === 'image' ? 'jpg' : 'mp4'}`,
      } as any);

      const response = await fetch(
        `${this.BASE_URL}/api/route-trips/incidents/${incidentId}/evidences/upload`,
        {
          method: 'POST',
          headers: authHeader,
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload evidence: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [TRIP-API] Evidence uploaded');
      return data.data?.fileUrl || null;
    } catch (error) {
      console.error('❌ [TRIP-API] Error uploading evidence:', error);
      return null;
    }
  }

  // ============ REALTIME MONITORING ============

  /**
   * Get active routes for a company
   */
  async getActiveRoutes(companyId: string): Promise<RealtimeRoute[]> {
    try {
      console.log('🔄 [TRIP-API] Getting active routes for company:', companyId);
      const routes = await this.fetchWithAuth<RealtimeRoute[]>(
        `/api/routes/realtime/active?companyId=${companyId}`
      );
      console.log('✅ [TRIP-API] Active routes retrieved:', routes.length);
      return routes;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting active routes:', error);
      return [];
    }
  }

  /**
   * Get dashboard summary for a company
   */
  async getDashboardSummary(companyId: string): Promise<any> {
    try {
      console.log('🔄 [TRIP-API] Getting dashboard summary for company:', companyId);
      const summary = await this.fetchWithAuth<any>(
        `/api/routes/realtime/summary?companyId=${companyId}`
      );
      console.log('✅ [TRIP-API] Dashboard summary retrieved');
      return summary;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting dashboard summary:', error);
      return null;
    }
  }

  /**
   * Get live data for a specific route
   */
  async getRouteLiveData(routeId: string): Promise<RealtimeRoute | null> {
    try {
      const liveData = await this.fetchWithAuth<RealtimeRoute>(
        `/api/routes/realtime/${routeId}/live`
      );
      return liveData;
    } catch (error) {
      console.error('❌ [TRIP-API] Error getting route live data:', error);
      return null;
    }
  }

  // ============ NOTIFICATIONS ============

  /**
   * Send route status notification
   */
  async sendStatusNotification(
    tripId: string,
    status: string,
    message?: string
  ): Promise<boolean> {
    try {
      console.log('🔄 [TRIP-API] Sending status notification for trip:', tripId);
      await this.fetchWithAuth<any>(
        `/api/driver/routes/trips/${tripId}/notify-status`,
        {
          method: 'POST',
          body: JSON.stringify({ status, message }),
        }
      );
      console.log('✅ [TRIP-API] Status notification sent');
      return true;
    } catch (error) {
      console.error('❌ [TRIP-API] Error sending status notification:', error);
      return false;
    }
  }

  // ============ CHECKLIST PHOTO UPLOAD ============

  /**
   * Upload checklist photo
   */
  async uploadChecklistPhoto(tripId: string, photoUri: string): Promise<string | null> {
    try {
      console.log('🔄 [TRIP-API] Uploading checklist photo for trip:', tripId);
      const authHeader = await apiAuth.getAuthHeader();
      
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `checklist_${tripId}_${Date.now()}.jpg`,
      } as any);

      const response = await fetch(
        `${this.BASE_URL}/api/driver/routes/trips/${tripId}/checklist/upload`,
        {
          method: 'POST',
          headers: authHeader,
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload photo: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [TRIP-API] Checklist photo uploaded');
      return data.data?.fileUrl || null;
    } catch (error) {
      console.error('❌ [TRIP-API] Error uploading checklist photo:', error);
      return null;
    }
  }
}

export default new TripApiService();
