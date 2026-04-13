import { useState, useCallback, useEffect } from 'react';
import { TripRepository } from '../infrastructure/TripRepository';
import { Trip, Coordinate, RouteStop, EtaUpdate, FullRouteData, StopVisit, NotificationItem, AttendanceForecast } from '../domain/Trip';

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
            console.error('Failed fetching trips', err);
            setError('No se pudieron cargar tus rutas.');
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
            console.warn('No route stops available');
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
            console.warn('Full route not available yet');
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

    const confirmAttendance = async (tripId: number) => {
        setIsSubmitting(true);
        try {
            await TripRepository.updateAttendanceStatus(tripId, 'CONFIRMED');
        } finally {
            setIsSubmitting(false);
        }
    };

    const declineAttendance = async (tripId: number) => {
        setIsSubmitting(true);
        try {
            await TripRepository.updateAttendanceStatus(tripId, 'DECLINED');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        confirmAttendance,
        declineAttendance,
        isSubmitting,
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
            console.error('Failed fetching notifications', err);
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

// ─── Hook: useAttendanceForecast ───
export function useAttendanceForecast() {
    const [forecast, setForecast] = useState<AttendanceForecast | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchForecast = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await TripRepository.getTomorrowForecast();
            setForecast(data);
        } catch (err) {
            console.error('Failed fetching forecast', err);
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const decline = async (forecastId: number) => {
        setIsSubmitting(true);
        try {
            await TripRepository.declineForecastAttendance(forecastId);
            await fetchForecast();
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        forecast,
        isLoading,
        isSubmitting,
        confirm,
        decline,
        refresh: fetchForecast,
    };
}
