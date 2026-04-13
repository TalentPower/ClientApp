import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EventCard } from '@/src/components/EventCard';
import { TripRepository } from '@/src/infrastructure/TripRepository';
import { Colors } from '@/src/constants/Colors';

export default function EventModalScreen() {
    const router = useRouter();
    const { tripId, eventName, driverName } = useLocalSearchParams<{
        tripId?: string;
        eventName?: string;
        driverName?: string;
    }>();

    const resolveTripId = tripId ? Number(tripId) : 0;

    const handleConfirm = async () => {
        try {
            if (resolveTripId > 0) {
                await TripRepository.updateAttendanceStatus(resolveTripId, 'CONFIRMED');
                console.log('Evento Confirmado vía API');
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        }
    };

    const handleDecline = async () => {
        try {
            if (resolveTripId > 0) {
                await TripRepository.updateAttendanceStatus(resolveTripId, 'DECLINED');
                console.log('Evento Declinado vía API');
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        }
    };

    return (
        <View style={styles.container}>
            <EventCard
                eventName={eventName || 'Recogida'}
                driverName={driverName || 'Conductor'}
                onConfirm={handleConfirm}
                onDecline={handleDecline}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary,
    },
});
