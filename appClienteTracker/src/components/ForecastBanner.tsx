import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AttendanceForecast } from '../domain/Trip';
import { Ionicons } from '@expo/vector-icons';

interface ForecastBannerProps {
    forecast: AttendanceForecast;
    onConfirm: (forecastId: number) => void;
    onDecline: (forecastId: number) => void;
    isSubmitting?: boolean;
}

export const ForecastBanner: React.FC<ForecastBannerProps> = ({ forecast, onConfirm, onDecline, isSubmitting }) => {
    
    // Sólo mostramos el banner si está pendiente, o si queremos mostrar el estado final.
    // El plan dice: "Card destacada grande que aparece arriba del historial cuando hay un forecast pendiente para mañana."
    if (forecast.status !== 'PENDING') {
        return null; // O se podría renderizar una versión minimizada diciendo "Asistencia confirmada para mañana"
    }

    const dateStr = new Date(forecast.tripDate).toLocaleDateString('es-ES', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="calendar" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>¿Vas a viajar mañana?</Text>
                    <Text style={styles.subtitle}>{forecast.routeName}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.dateText}>Para el día: <Text style={styles.dateBold}>{dateStr}</Text></Text>
                <Text style={styles.description}>Por favor confirma tu asistencia para asegurar tu lugar y ayudarnos a optimizar la ruta.</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity 
                    style={[styles.button, styles.declineButton]} 
                    disabled={isSubmitting}
                    onPress={() => onDecline(forecast.forecastId)}
                >
                    <Text style={styles.declineText}>No viajaré</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.confirmButton]}
                    disabled={isSubmitting}
                    onPress={() => onConfirm(forecast.forecastId)}
                >
                    <Text style={styles.confirmText}>Sí, confirmo</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f5f3ff', // violet-50
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 24,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#ede9fe', // violet-100
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ede9fe', // violet-100
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4c1d95', // violet-900
    },
    subtitle: {
        fontSize: 14,
        color: '#6d28d9', // violet-700
        marginTop: 2,
    },
    content: {
        marginBottom: 20,
    },
    dateText: {
        fontSize: 15,
        color: '#4c1d95',
        marginBottom: 8,
    },
    dateBold: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    description: {
        fontSize: 14,
        color: '#5b21b6', // violet-800
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButton: {
        backgroundColor: '#8b5cf6', // violet-500
    },
    declineButton: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderWidth: 1,
        borderColor: '#c4b5fd', // violet-300
    },
    confirmText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    declineText: {
        color: '#6d28d9',
        fontWeight: '600',
        fontSize: 16,
    },
});
