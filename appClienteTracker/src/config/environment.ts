// Configuración de ambiente - Endpoints reales del Backend SIPE (Spring Boot)
// Uses the dedicated /api/client/* controllers for passenger-specific operations
// and the shared /api/trip-locations/* + /api/routes/realtime/* for tracking data.
export const config = {
    api: {
        baseUrl: 'https://api-sipe.com',
        timeoutMs: 15000,
        endpoints: {
            auth: {
                // ClientAuthController → POST /api/client/auth/login
                login: '/api/client/auth/login',
                // ClientAuthController → POST /api/client/auth/register/auto
                registerAuto: '/api/client/auth/register/auto',
                // ClientAuthController → POST /api/client/auth/register/explicit
                registerExplicit: '/api/client/auth/register/explicit',
            },
            trips: {
                // ClientTripController → GET /api/client/trips/active
                active: '/api/client/trips/active',
                // ClientTripController → GET /api/client/trips/{tripId}/live-location
                liveLocation: (tripId: number) => `/api/client/trips/${tripId}/live-location`,
                // ClientTripController → GET /api/client/trips/assigned-route
                assignedRoute: '/api/client/trips/assigned-route',
            },
            attendance: {
                // ClientAttendanceController → POST /api/client/attendance/status
                updateStatus: '/api/client/attendance/status',
            },
            // Shared controllers (authorized for CLIENTE role via SecurityConfiguration)
            tripLocations: {
                current: (tripId: number) => `/api/trip-locations/${tripId}/current`,
                eta: (tripId: number) => `/api/trip-locations/${tripId}/eta`,
                routeStops: (tripId: number) => `/api/trip-locations/${tripId}/route-stops`,
                fullRoute: (tripId: number) => `/api/trip-locations/${tripId}/full-route`,
                directions: (tripId: number) => `/api/trip-locations/${tripId}/directions`,
                stopVisits: (tripId: number) => `/api/trip-locations/${tripId}/stop-visits`,
            },
            realtime: {
                live: (routeId: number) => `/api/routes/realtime/${routeId}/live`,
                mapData: '/api/routes/realtime/map-data',
            },
            notifications: {
                // ClientNotificationController → POST /api/notifications/fcm-token
                registerToken: '/api/notifications/fcm-token',
                // NotificationController -> GET /api/notifications
                list: '/api/notifications',
            },
        },
    },
    polling: {
        tripLiveMs: 5000,       // active-trip map refresh
    },
    location: {
        foregroundIntervalMs: 3000,
        foregroundDistanceM: 5,
        backgroundIntervalMs: 10000,
        backgroundDistanceM: 10,
    },
    qr: {
        expirySeconds: 60,
    },
    i18n: {
        locale: 'es-MX',
    },
};
