// ============================================================
// Core Types for Driver Tracker App
// Aligned with Spring Boot Backend DTOs
// ============================================================

// ============ LOCATION & COORDINATES ============

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string | number;
}

// ============ TRIP STATUS ============

export type TripStatus = 
  | 'PLANNED'
  | 'PRE_CHECKLIST'
  | 'CHECKLIST_FAILED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type AttendanceStatus =
  | 'EXPECTED'
  | 'CONFIRMED'
  | 'BOARDED'
  | 'NO_SHOW'
  | 'CANCELLED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ChecklistItemStatus = 'PENDING' | 'OK' | 'ISSUE' | 'NA';

// ============ ROUTE & TRIP ============

export interface Route {
  id: number;
  name: string;
  description?: string;
  companyId: number;
  companyName?: string;
  originName?: string;
  destinationName?: string;
  estimatedDurationMinutes?: number;
  distanceKm?: number;
  isActive: boolean;
  stops?: RouteStop[];
}

export interface RouteStop {
  id: number;
  routeId: number;
  name: string;
  address?: string;
  description?: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  estimatedArrivalMinutes?: number;
  geofenceRadiusMeters: number;
  isOrigin: boolean;
  isDestination: boolean;
  isActive: boolean;
}

export interface Trip {
  id: number;
  routeId: number;
  routeName: string;
  /**
   * Driver's user ID from user_entity.user_id table.
   * Note: Despite the name, this is NOT an employee ID - it's the userId.
   */
  driverEmployeeId: number;
  driverName: string;
  vehicleId?: number;
  vehiclePlate?: string;
  vehicleName?: string;
  companyId: number;
  companyName?: string;
  date: string;
  turn?: string;
  status: TripStatus;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  startedAt?: string;
  finishedAt?: string;
  notes?: string;
  passengersExpected?: number;
  passengersBoarded?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripWithDetails extends Trip {
  route?: Route;
  stops?: TripStop[];
  passengers?: TripPassenger[];
  checklistItems?: ChecklistItem[];
  incidents?: TripIncident[];
  currentLocation?: Coordinate;
}

// ============ TRIP STOPS (Runtime) ============

export interface TripStop {
  stopId: number;
  tripId: number;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  estimatedArrivalTime?: string;
  actualArrivalTime?: string;
  status: 'PENDING' | 'ARRIVED' | 'DEPARTED' | 'SKIPPED';
  passengersBoarded?: number;
  passengersDropped?: number;
  notes?: string;
}

// ============ PASSENGERS / ATTENDANCE ============

export interface TripPassenger {
  id: number;
  employeeId: number;
  employeeName: string;
  tripId: number;
  stopId?: number;
  stopName?: string;
  status: AttendanceStatus;
  confirmationTime?: string;
  boardingTime?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  isNewEntry?: boolean; // Nuevo ingreso registrado por conductor
}

export interface AttendanceRequest {
  tripId: number;
  employeeId: number;
  status: AttendanceStatus;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

// ============ CHECKLIST ============

export interface ChecklistTemplate {
  code: string;
  description: string;
  itemType: 'CHECKBOX' | 'SELECTOR' | 'TEXT' | 'PHOTO_ONLY';
  phase: 'PRE_TRIP' | 'POST_TRIP';
  isRequired: boolean;
  requiresPhoto: boolean;
  selectorOptions?: string[];
}

export interface ChecklistItem {
  id?: number;
  tripId: number;
  itemCode: string;
  description: string;
  itemType: 'CHECKBOX' | 'SELECTOR' | 'TEXT' | 'PHOTO_ONLY';
  status: ChecklistItemStatus;
  selectedValue?: string;
  observations?: string;
  photoUrl?: string;
  isRequired: boolean;
  createdAt?: string;
}

export interface ChecklistSubmission {
  tripId: number;
  items: ChecklistItemSubmission[];
}

export interface ChecklistItemSubmission {
  itemCode: string;
  status: ChecklistItemStatus;
  selectedValue?: string;
  observations?: string;
  photoUrl?: string;
}

export interface ChecklistValidationResult {
  tripId: number;
  passed: boolean;
  newStatus: TripStatus;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  failedItemCodes: string[];
  message: string;
  requiresOverride: boolean;
}

// ============ INCIDENTS ============

export interface TripIncident {
  id: number;
  tripId: number;
  companyId: number;
  reporterEmployeeId: number;
  reporterName?: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  latitude?: number;
  longitude?: number;
  evidences?: IncidentEvidence[];
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentEvidence {
  id: number;
  incidentId: number;
  fileUrl: string;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  description?: string;
  createdAt: string;
}

export interface CreateIncidentRequest {
  tripId: number;
  companyId: number;
  reporterEmployeeId: number;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  latitude?: number;
  longitude?: number;
}

// ============ VEHICLE ============

export interface Vehicle {
  id: number;
  companyId: number;
  name: string;
  plate: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  capacity: number;
  fuelType?: 'GASOLINE' | 'DIESEL' | 'GAS' | 'ELECTRIC' | 'HYBRID';
  isActive: boolean;
}

// ============ DRIVER ============

export interface Driver {
  id: string;
  employeeId: number;
  name: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  vehicleId?: number;
  vehiclePlate?: string;
  isActive: boolean;
  currentLocation?: Location;
}

// ============ REALTIME MONITORING ============

export interface RealtimeRoute {
  routeId: number;
  tripId: number;
  routeName: string;
  driverName: string;
  driverId: string;
  vehiclePlate?: string;
  companyId: number;
  status: TripStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  lastUpdate?: string;
  passengersExpected?: number;
  passengersBoarded?: number;
  currentStopId?: number;
  currentStopName?: string;
  nextStopId?: number;
  nextStopName?: string;
  nextStopEta?: number;
  hasActiveIncidents?: boolean;
  isDelayed?: boolean;
  isOffRoute?: boolean;
}

export interface TripLocationData {
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

// ============ AUTHENTICATION ============

export interface AuthUser {
  /**
   * User ID from user_entity.user_id table.
   * This is used as driverEmployeeId when creating trips.
   */
  id: string;
  name: string;
  email?: string;
  role: string;
  companies: string[];
  companiesId: string[];
  jwt: string;
  /**
   * @deprecated Employee ID is no longer used for trip assignment.
   * Use `id` (userId) instead.
   */
  employeeId?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error?: string;
}

export interface LoginResponse {
  id: string;
  name: string;
  role: string;
  companies: string;
  companiesId: string;
  jwt: string;
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  message: string;
  data: T;
  success?: boolean;
}

export interface ApiListResponse<T> {
  message: string;
  data: T[];
  totalCount?: number;
}

// ============ NOTIFICATIONS ============

export interface NotificationPayload {
  type: 'TRIP_START' | 'TRIP_END' | 'STOP_ARRIVAL' | 'PASSENGER_BOARDING' | 'INCIDENT' | 'DELAY';
  tripId: number;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// ============ NAVIGATION ============

export interface NavigationStackParamList {
  // Auth
  Login: undefined;
  
  // Main
  TripDashboard: undefined;
  ActiveTrip: { tripId: string };
  TripStops: { tripId: string };
  TripPassengers: { tripId: string; stopId?: string };
  TripIncidents: { tripId: string };
  CreateIncident: { tripId: string };
  Profile: undefined;
  
  // Legacy - to be removed
  Home: undefined;
  MapView: undefined;
  DriverList: undefined;
  DriverDetail: { driverId: string };
  RouteDetail: { routeId: string };
  
  // Deprecated - PreTripChecklist removed, trips start directly
  // PreTripChecklist: { tripId: string };
}

// ============ DASHBOARD STATS ============

export interface DashboardStats {
  todayTrips: number;
  completedTrips: number;
  activeTrip?: Trip;
  totalPassengersToday: number;
  totalDistanceToday: number;
  totalIncidentsToday: number;
}

export interface DriverDayStats {
  date: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalPassengers: number;
  totalDistance: number;
  totalDuration: number;
  incidents: number;
  onTimePercentage: number;
}

// ============ GEOFENCE ============

export interface GeofenceCheckResult {
  onRoute: boolean;
  deviationKm?: number;
  arrivedAtStop?: boolean;
  stopName?: string;
  alerts?: string[];
}

// ============ UTILITY TYPES ============

export type DateString = string; // ISO date format: YYYY-MM-DD
export type DateTimeString = string; // ISO datetime format: YYYY-MM-DDTHH:mm:ss

export interface SelectOption {
  label: string;
  value: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
