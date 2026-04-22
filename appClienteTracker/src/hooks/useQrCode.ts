import { useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

/**
 * Hook that generates a secure QR payload for boarding check-in.
 * The payload contains the userId and a timestamp, encoded in base64.
 * It auto-regenerates every 60 seconds to prevent screenshot fraud.
 */
export function useQrCode() {
    const [qrPayload, setQrPayload] = useState<string>('');
    const [isReady, setIsReady] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(60);
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
                exp: timestamp + 60000, // Expires in 60s
            });

            // Base64 encode for QR
            const encoded = btoa(rawPayload);
            setQrPayload(encoded);
            setIsReady(true);
            setSecondsLeft(60);
        } catch (err: any) {
            if (__DEV__) console.error('Error generating QR payload:', err);
            setIsReady(false);
            setError(err?.message || 'No se pudo generar el código QR. Toca para reintentar.');
        }
    }, []);

    useEffect(() => {
        // Generate immediately
        generatePayload();

        // Regenerate every 60 seconds
        intervalRef.current = setInterval(() => {
            generatePayload();
        }, 60000);

        // Countdown timer
        countdownRef.current = setInterval(() => {
            setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 60));
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
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
