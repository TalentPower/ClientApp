import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string;
}

export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
    });

    useEffect(() => {
        const apply = (state: NetInfoState) => {
            setStatus({
                isConnected: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable,
                type: state.type,
            });
        };

        NetInfo.fetch().then(apply);
        const unsubscribe = NetInfo.addEventListener(apply);
        return () => unsubscribe();
    }, []);

    return status;
}

// Imperative helper for non-hook contexts (axios interceptor, queued retry)
export async function isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return (state.isConnected ?? false) && state.isInternetReachable !== false;
}
