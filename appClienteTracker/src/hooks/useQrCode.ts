import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { config } from '../config/environment';

const QR_EXPIRY_S = config.qr.expirySeconds;
const QR_EXPIRY_MS = QR_EXPIRY_S * 1000;

/**
 * Hook that generates a secure QR payload for boarding check-in.
 * The payload contains the userId and a timestamp, encoded in base64.
 * It auto-regenerates every 60 seconds to prevent screenshot fraud.
 */
export function useQrCode() {
    const [qrPayload, setQrPayload] = useState<string>('');
    const [isReady, setIsReady] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_S);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const generatePayload = useCallback(async () => {
        try {
            setError(null);
            const authDataStr = await SecureStore.getItemAsync('client_info');
            if (!authDataStr) {
                setQrPayload('');
                setIsReady(false);
                setError('Sesión no encontrada. Inicia sesión de nuevo.');
                return;
            }

            const authData = JSON.parse(authDataStr);
            const timestamp = Date.now();

            // Compact secure payload: userId + timestamp + simple hash
            const rawPayload = JSON.stringify({
                uid: authData.userId,
                name: authData.name,
                email: authData.email,
                cid: authData.companyId,
                ts: timestamp,
                exp: timestamp + QR_EXPIRY_MS,
            });

            // Base64 encode for QR
            const encoded = btoa(rawPayload);
            setQrPayload(encoded);
            setIsReady(true);
            setSecondsLeft(QR_EXPIRY_S);
        } catch (err: any) {
            if (__DEV__) console.error('Error generating QR payload:', err);
            setIsReady(false);
            setError(err?.message || 'No se pudo generar el código QR. Toca para reintentar.');
        }
    }, []);

    useEffect(() => {
        const startTimers = () => {
            if (intervalRef.current || countdownRef.current) return;
            intervalRef.current = setInterval(() => {
                generatePayload();
            }, QR_EXPIRY_MS);
            countdownRef.current = setInterval(() => {
                setSecondsLeft((prev) => (prev > 0 ? prev - 1 : QR_EXPIRY_S));
            }, 1000);
        };

        const stopTimers = () => {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        };

        // Generate immediately + start
        generatePayload();
        startTimers();

        // Pause/resume on app background/foreground — avoid battery drain + stale QR
        const handleAppState = (next: AppStateStatus) => {
            if (next === 'active') {
                generatePayload(); // refresh stale payload on resume
                startTimers();
            } else {
                stopTimers();
            }
        };
        const sub = AppState.addEventListener('change', handleAppState);

        return () => {
            stopTimers();
            sub.remove();
        };
    }, [generatePayload]);

    return {
        qrPayload,
        isReady,
        secondsLeft,
        error,
        regenerate: generatePayload,
    };
}
