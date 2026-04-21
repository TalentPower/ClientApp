import React from 'react';
import { View, StyleSheet, Text, ScrollView, Platform } from 'react-native';
import { QrBoardingCard } from '@/src/components/QrBoardingCard';
import { Colors, Radii, Spacing, Shadows } from '@/src/constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useQrCode } from '@/src/hooks/useQrCode';
import { useAuth } from '@/src/hooks/useAuth';
import { Announcement } from '@/src/domain/Notification';
import { useNotifications } from '@/src/hooks/useNotifications';

export default function QrAndAnnouncementsScreen() {
    const { qrPayload, isReady, secondsLeft } = useQrCode();
    const { user } = useAuth();
    const { announcements, isLoading } = useNotifications();

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mi QR</Text>
                    <Text style={styles.headerSubtitle}>
                        Escaneo rápido al subir a la unidad
                    </Text>
                </View>

                {/* ── QR Boarding Card ── */}
                <QrBoardingCard
                    qrPayload={qrPayload}
                    userName={user?.name || 'Empleado'}
                    secondsLeft={secondsLeft}
                    isReady={isReady}
                />

                {/* ── Announcements section ── */}
                <View style={styles.announcementsHeader}>
                    <IconSymbol name="bell.fill" size={20} color={Colors.accent} />
                    <Text style={styles.announcementsTitle}>Anuncios</Text>
                </View>

                {isLoading && (
                    <Text style={{ color: Colors.textSecondary, marginTop: Spacing.sm }}>Cargando anuncios...</Text>
                )}

                {!isLoading && (!announcements || announcements.length === 0) && (
                    <Text style={{ color: Colors.textSecondary, marginTop: Spacing.sm }}>No hay anuncios recientes.</Text>
                )}

                {announcements && announcements.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <IconSymbol
                                name={
                                    item.type === 'warning'
                                        ? 'exclamationmark.triangle.fill'
                                        : item.type === 'success'
                                            ? 'checkmark.circle.fill'
                                            : 'info.circle.fill'
                                }
                                size={22}
                                color={
                                    item.type === 'warning'
                                        ? Colors.accentDanger
                                        : item.type === 'success'
                                            ? Colors.accentSuccess
                                            : Colors.accent
                                }
                            />
                            <Text style={styles.dateText}>{item.date}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardDescription}>{item.description}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 150,
        gap: Spacing.lg,
    },
    header: {
        marginBottom: Spacing.sm,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    announcementsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: Spacing.md,
    },
    announcementsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    card: {
        backgroundColor: Colors.secondary,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.elevationSm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    dateText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    cardDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
});
