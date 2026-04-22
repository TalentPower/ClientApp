import { useState, useCallback, useEffect } from 'react';
import { TripRepository } from '../infrastructure/TripRepository';
import { Trip, Coordinate, RouteStop, EtaUpdate, FullRouteData, StopVisit, NotificationItem, AttendanceForecast, AssignedRoute } from '../domain/Trip';

// ─── Hook: useTrips ───
export function useTrips() {
    const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
    const [liveLocation, setLiveLocation] = useState<Coordinate | null>(null);
    const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
    const [etaData, setEtaData] = useState<EtaUpdate | null>(null);
    const [fullRoute, setFullRoute] = useState<FullRouteData | null>(null);
    const [stopVisits, setStopVisits] = useState<StopVisit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActiveTrips = useCallback(async () => {
        try {
            setIsLoading(true);
            const trips = await TripRepository.getActiveTrips();
            setActiveTrips(trips);
        } catch (err: any) {
            if (__DEV__) console.error('Failed fetching trips', err);
            setError(err?.isOffline ? 'Sin conexión. Verifica tu red.' : 'No se pudieron cargar tus rutas.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchLiveLocation = useCallback(async (tripId: number) => {
        try {
            const coord = await TripRepository.getLiveLocation(tripId);
            setLiveLocation(coord);
        } catch (err) {
            // Silent — driver may not have started tracking yet
        }
    }, []);

    const fetchRouteStops = useCallback(async (tripId: number) => {
        try {
            const data = await TripRepository.getRouteStops(tripId);
            setRouteStops(data.stops);
        } catch (err) {
            if (__DEV__) console.warn('No route stops available');
        }
    }, []);

    const fetchEta = useCallback(async (tripId: number) => {
        try {
            const eta = await TripRepository.getEta(tripId);
            setEtaData(eta);
        } catch (err) {
            // ETA may fail if trip hasn't started
        }
    }, []);

    const fetchFullRoute = useCallback(async (tripId: number) => {
        try {
            const route = await TripRepository.getFullRoute(tripId);
            setFullRoute(route);
        } catch (err) {
            if (__DEV__) console.warn('Full route not available yet');
        }
    }, []);

    const fetchStopVisits = useCallback(async (tripId: number) => {
        try {
            const visits = await TripRepository.getStopVisits(tripId);
            setStopVisits(visits);
        } catch (err) {
            // Not critical
        }
    }, []);

    // Auto-fetch trips on mount
    useEffect(() => {
        fetchActiveTrips();
    }, [fetchActiveTrips]);

    return {
        activeTrips,
        liveLocation,
        routeStops,
        etaData,
        fullRoute,
        stopVisits,
        fetchLiveLocation,
        fetchActiveTrips,
        fetchRouteStops,
        fetchEta,
        fetchFullRoute,
        fetchStopVisits,
        isLoading,
        error,
    };
}

// ─── Hook: useAttendance ───
// Uses ClientAttendanceController → POST /api/client/attendance/status
export function useAttendance() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirmAttendance = async (tripId: number) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await TripRepository.updateAttendanceStatus(tripId, 'CONFIRMED');
            return true;
        } catch (err: any) {
            const msg = err?.message || 'No se pudo confirmar tu asistencia. Revisa tu conexión.';
            setError(msg);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const declineAttendance = async (tripId: number) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await TripRepository.updateAttendanceStatus(tripId, 'DECLINED');
            return true;
        } catch (err: any) {
            const msg = err?.message || 'No se pudo registrar la cancelación. Revisa tu conexión.';
            setError(msg);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        confirmAttendance,
        declineAttendance,
        isSubmitting,
        error,
        clearError: () => setError(null),
    };
}

// ─── Hook: useNotifications ───
export function useNotifications() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await TripRepository.getNotificationHistory();
            setNotifications(data);
        } catch (err) {
            if (__DEV__) console.error('Failed fetching notifications', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        isLoading,
        refresh: fetchNotifications,
    };
}

// ─── Hook: useAssignedRoute ───
// Fetches today's route assignment(s) for the current client.
export function useAssignedRoute() {
    const [assignedRoutes, setAssignedRoutes] = useState<AssignedRoute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await TripRepository.getAssignedRoute();
            setAssignedRoutes(data);
        } catch (err: any) {
            if (__DEV__) console.warn('Failed fetching assigned route', err);
            setError(err?.message || 'No se pudo cargar tu ruta asignada.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return {
        assignedRoutes,
        primary: assignedRoutes[0] ?? null,
        isLoading,
        error,
        refresh: fetch,
    };
}

// ─── Hook: useAttendanceForecast ───
export function useAttendanceForecast() {
    const [forecast, setForecast] = useState<AttendanceForecast | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const fetchForecast = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await TripRepository.getTomorrowForecast();
            setForecast(data);
        } catch (err: any) {
            if (__DEV__) console.error('Failed fetching forecast', err);
            // 404 → no forecast yet; treat as empty, not error
            if (err?.response?.status === 404) {
                setForecast(null);
            } else {
                setError(err?.message || 'No se pudo cargar tu asistencia para mañana.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForecast();
    }, [fetchForecast]);

    const confirm = async (forecastId: number) => {
        setIsSubmitting(true);
        try {
            await TripRepository.confirmForecastAttendance(forecastId);
            await fetchForecast();
        } catch (err) {
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    const decline = async (forecastId: number) => {
        setIsSubmitting(true);
        try {
            await TripRepository.declineForecastAttendance(forecastId);
            await fetchForecast();
        } catch (err) {
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        forecast,
        isLoading,
        isSubmitting,
        error,
        confirm,
        decline,
        refresh: fetchForecast,
        clearError: () => setError(null),
    };
}
