import { apiClient } from './apiClient';
import {
    Trip,
    Coordinate,
    RouteStop,
    RouteStopsResponse,
    EtaUpdate,
    FullRouteData,
    RealtimeRouteData,
    StopVisit,
    NotificationItem,
    AttendanceForecast,
} from '../domain/Trip';
import * as SecureStore from 'expo-secure-store';

// ── Standard backend wrapper ──
interface BackendApiResponse<T> {
    message: string;
    data: T;
    success: boolean;
}

export class TripRepository {

    // ─────────────────────────────────────────
    //  ACTIVE TRIPS (ClientTripController)
    // ─────────────────────────────────────────

    /**
     * GET /api/client/trips/active
     * Returns trips assigned to the authenticated client for today.
     * The backend resolves the user by JWT → email → RouteAssignment.
     */
    static async getActiveTrips(): Promise<Trip[]> {
        const response = await apiClient.get<any>(
            '/api/client/trips/active'
        );

        const dataArray = Array.isArray(response.data) 
            ? response.data 
            : (Array.isArray(response.data?.data) ? response.data.data : []);

        return dataArray.map((trip: any) => ({
            tripId: trip.tripId,
            routeId: trip.routeId,
            routeName: trip.routeName,
            status: trip.status ?? 'READY',
            driverInfo: trip.driverInfo
                ? { name: trip.driverInfo.name, phone: trip.driverInfo.phone }
                : undefined,
        }));
    }

    /**
     * GET /api/client/trips/{tripId}/live-location
     * Current bus location from the client-specific controller.
     */
    static async getLiveLocation(tripId: number): Promise<Coordinate> {
        const response = await apiClient.get<BackendApiResponse<any>>(
            `/api/client/trips/${tripId}/live-location`
        );
        const loc = response.data.data;
        return {
            latitude: loc.latitude,
            longitude: loc.longitude,
            timestamp: loc.timestamp,
        };
    }

    // ─────────────────────────────────────────
    //  ATTENDANCE (ClientAttendanceController)
    // ─────────────────────────────────────────

    /**
     * POST /api/client/attendance/status
     * Confirms or declines attendance for a trip.
     * Backend maps CONFIRMED→PRESENT, DECLINED→EXCUSED.
     */
    static async updateAttendanceStatus(
        tripId: number,
        status: 'CONFIRMED' | 'DECLINED'
    ): Promise<void> {
        await apiClient.post('/api/client/attendance/status', {
            tripId,
            status,
        });
    }

    // ─────────────────────────────────────────
    //  TRIP LOCATIONS (shared TripLocationController)
    //  Authorized for CLIENTE role via SecurityConfig
    // ─────────────────────────────────────────

    /**
     * GET /api/trip-locations/{tripId}/route-stops
     * All route stops with coordinates for map markers.
     */
    static async getRouteStops(tripId: number): Promise<RouteStopsResponse> {
        const response = await apiClient.get<BackendApiResponse<RouteStopsResponse>>(
            `/api/trip-locations/${tripId}/route-stops`
        );
        return response.data.data;
    }

    /**
     * GET /api/trip-locations/{tripId}/eta
     * Lightweight ETA to next stop.
     */
    static async getEta(tripId: number): Promise<EtaUpdate> {
        const response = await apiClient.get<BackendApiResponse<EtaUpdate>>(
            `/api/trip-locations/${tripId}/eta`
        );
        return response.data.data;
    }

    /**
     * GET /api/trip-locations/{tripId}/full-route
     * Full encoded polyline from current location through all remaining stops.
     */
    static async getFullRoute(tripId: number): Promise<FullRouteData> {
        const response = await apiClient.get<BackendApiResponse<FullRouteData>>(
            `/api/trip-locations/${tripId}/full-route`
        );
        return response.data.data;
    }

    /**
     * GET /api/trip-locations/{tripId}/stop-visits
     * Visit status for each stop (PENDING, ARRIVED, DEPARTED, SKIPPED).
     */
    static async getStopVisits(tripId: number): Promise<StopVisit[]> {
        const response = await apiClient.get<BackendApiResponse<StopVisit[]>>(
            `/api/trip-locations/${tripId}/stop-visits`
        );
        return response.data.data;
    }

    // ─────────────────────────────────────────
    //  REALTIME MONITORING (shared RealtimeMonitoringController)
    // ─────────────────────────────────────────

    /**
     * GET /api/routes/realtime/{routeId}/live
     */
    static async getRealtimeData(routeId: number): Promise<RealtimeRouteData> {
        const response = await apiClient.get<BackendApiResponse<RealtimeRouteData>>(
            `/api/routes/realtime/${routeId}/live`
        );
        return response.data.data;
    }

    // ─────────────────────────────────────────
    //  NOTIFICATIONS & FORECAST (MOCK)
    // ─────────────────────────────────────────

    static async getNotificationHistory(): Promise<NotificationItem[]> {
        const response = await apiClient.get<any>('/api/notifications/history');
        const dataArray = Array.isArray(response.data) 
            ? response.data 
            : (Array.isArray(response.data?.data) ? response.data.data : []);
        return dataArray as NotificationItem[];
    }

    static async getTomorrowForecast(): Promise<AttendanceForecast | null> {
        try {
            const response = await apiClient.get<BackendApiResponse<AttendanceForecast>>('/api/client/attendance/forecast/tomorrow');
            return response.data.data;
        } catch {
            // Usually returns 404 if no forecast exists for tomorrow
            return null;
        }
    }

    static async confirmForecastAttendance(forecastId: number): Promise<void> {
        await apiClient.post(`/api/client/attendance/forecast/${forecastId}/confirm`);
    }

    static async declineForecastAttendance(forecastId: number): Promise<void> {
        await apiClient.post(`/api/client/attendance/forecast/${forecastId}/decline`);
    }
}
