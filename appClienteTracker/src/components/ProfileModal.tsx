import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useAssignedRoute } from '../hooks/useTrips';

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

const { height } = Dimensions.get('window');

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
    const { user, logout } = useAuth();
    const { primary: assignedRoute, isLoading: isLoadingRoute, error: routeError, refresh: refreshRoute } = useAssignedRoute();
    const slideAnim = React.useRef(new Animated.Value(height)).current;

    React.useEffect(() => {
        if (visible) refreshRoute();
    }, [visible, refreshRoute]);

    const formatTime = (t: string | null) => {
        if (!t) return null;
        // Backend returns HH:mm:ss
        const parts = t.split(':');
        if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
        return t;
    };

    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 10,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, slideAnim]);

    const handleLogout = () => {
        onClose();
        setTimeout(() => logout(), 300); // Wait for animation to finish
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                
                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>
                    
                    <View style={styles.header}>
                        <Text style={styles.title}>Mi Perfil</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.avatarContainer}>
                        <Ionicons name="person-circle" size={80} color="#3b82f6" />
                        <Text style={styles.name}>{user?.name || 'Pasajero'}</Text>
                        <Text style={styles.email}>{user?.phone || user?.email || 'Sin contacto'}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Ionicons name="bus" size={20} color="#6b7280" style={styles.infoIcon} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Ruta Asignada</Text>
                                {isLoadingRoute ? (
                                    <ActivityIndicator size="small" color="#3b82f6" style={{ alignSelf: 'flex-start' }} />
                                ) : routeError ? (
                                    <Text style={[styles.infoValue, { color: '#ef4444' }]}>{routeError}</Text>
                                ) : assignedRoute ? (
                                    <Text style={styles.infoValue}>
                                        {assignedRoute.routeName}
                                        {assignedRoute.turn ? ` · ${assignedRoute.turn}` : ''}
                                    </Text>
                                ) : (
                                    <Text style={styles.infoValue}>Sin ruta asignada hoy</Text>
                                )}
                            </View>
                        </View>

                        {assignedRoute?.scheduledEntryTime && (
                            <View style={styles.infoRow}>
                                <Ionicons name="time" size={20} color="#6b7280" style={styles.infoIcon} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Hora de salida</Text>
                                    <Text style={styles.infoValue}>
                                        {formatTime(assignedRoute.scheduledEntryTime)}
                                        {assignedRoute.scheduledExpectedTime
                                            ? ` → ${formatTime(assignedRoute.scheduledExpectedTime)}`
                                            : ''}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {assignedRoute?.vehicle?.plate && (
                            <View style={styles.infoRow}>
                                <Ionicons name="car" size={20} color="#6b7280" style={styles.infoIcon} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Unidad</Text>
                                    <Text style={styles.infoValue}>{assignedRoute.vehicle.plate}</Text>
                                </View>
                            </View>
                        )}

                        {assignedRoute?.driverInfo && (
                            <View style={styles.infoRow}>
                                <Ionicons name="person" size={20} color="#6b7280" style={styles.infoIcon} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Chofer</Text>
                                    <Text style={styles.infoValue}>{assignedRoute.driverInfo.name}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.spacer} />

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={styles.logoutIcon} />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
        height: height * 0.6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#e5e7eb',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
    },
    email: {
        fontSize: 15,
        color: '#6b7280',
        marginTop: 4,
    },
    infoSection: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoIcon: {
        width: 32,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    spacer: {
        flex: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
    },
    logoutIcon: {
        marginRight: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ef4444',
    },
});
