// ── Trip Domain Types ──
// Mapped from backend DTOs: EmployeeRouteSummaryDto, RealtimeRouteDto, TripDirectionsDTO, EtaUpdateDTO

export type TripStatus = 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PRE_CHECKLIST' | 'CHECKLIST_FAILED';
export type Turn = 'MATUTINO' | 'VESPERTINO' | 'NOCTURNO';

export interface DriverInfo {
    name: string;
    phone: string;
}

export interface Trip {
    tripId: number;
    routeId: number;
    routeName: string;
    status: TripStatus;
    turn?: Turn;
    driverInfo?: DriverInfo;
    etaMinutes?: number;
    passengersExpected?: number;
    passengersBoarded?: number;
}

export interface Coordinate {
    latitude: number;
    longitude: number;
    timestamp?: string;
}

// Maps to RouteStop data from GET /api/trip-locations/{tripId}/route-stops
export interface RouteStop {
    id: number;
    name: string;
    address?: string;
    latitude: number | null;
    longitude: number | null;
    stopOrder: number;
    isOrigin: boolean;
    isDestination: boolean;
    geofenceRadiusMeters: number;
    estimatedArrivalMinutes?: number;
}

// Maps to response from GET /api/trip-locations/{tripId}/route-stops
export interface RouteStopsResponse {
    tripId: number;
    routeId: number;
    routeName: string;
    totalStops: number;
    stops: RouteStop[];
}

// Maps to EtaUpdateDTO from GET /api/trip-locations/{tripId}/eta
export interface EtaUpdate {
    tripId: number;
    nextStopId: number;
    nextStopName: string;
    etaMinutes: number;
    etaText?: string;
    distanceMeters: number;
    distanceText?: string;
    isEstimate: boolean;
    timestamp: string;
}

// Maps to response from GET /api/trip-locations/{tripId}/full-route
export interface FullRouteData {
    tripId: number;
    routeId: number;
    routeName: string;
    currentLat: number;
    currentLng: number;
    destinationStopId: number;
    destinationStopName: string;
    destinationLat: number;
    destinationLng: number;
    totalRemainingStops: number;
    waypointsCount: number;
    encodedPolyline: string;
    etaMinutes: number;
    etaText: string;
    distanceMeters: number;
    distanceText: string;
    success: boolean;
}

// Maps to RealtimeRouteDto from GET /api/routes/realtime/{routeId}/live
export interface RealtimeRouteData {
    routeId: number;
    tripId: number;
    routeName: string;
    driverName: string;
    status: TripStatus;
    currentLatitude: number | null;
    currentLongitude: number | null;
    passengersExpected: number;
    passengersBoarded: number;
    isDelayed: boolean;
    isOffRoute: boolean;
    hasActiveIncidents: boolean;
    lastUpdate: string;
}

// Stop visit status from GET /api/trip-locations/{tripId}/stop-visits
export interface StopVisit {
    stopId: number;
    stopName: string;
    status: 'PENDING' | 'ARRIVED' | 'DEPARTED' | 'SKIPPED';
    arrivedAt?: string;
    departedAt?: string;
}

// ── Notifications & Forecast ──
export type NotificationType = 'INFO' | 'ATTENDANCE_FORECAST' | 'ALERT' | 'SYSTEM';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
    // Relational data if needed
    entityId?: number;
}

export type AttendanceForecastStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export interface AttendanceForecast {
    forecastId: number;
    tripDate: string; // YYYY-MM-DD
    routeName: string;
    status: AttendanceForecastStatus;
}
