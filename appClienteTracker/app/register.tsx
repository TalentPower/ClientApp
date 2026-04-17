import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii, Spacing } from '@/src/constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AuthRepository } from '@/src/infrastructure/AuthRepository';

type RegisterMode = 'auto' | 'explicit';

export default function RegisterScreen() {
    const [mode, setMode] = useState<RegisterMode>('auto');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const router = useRouter();

    const normalizedPhone = useMemo(() => phone.replace(/\D/g, ''), [phone]);
    const isValidAuto = normalizedPhone.length >= 8;
    const isValidExplicit = normalizedPhone.length >= 8 && password.length >= 1;
    const isValid = mode === 'auto' ? isValidAuto : isValidExplicit;

    const handleRegister = async () => {
        if (!isValid) return;
        setIsLoading(true);
        setError(null);
        try {
            if (mode === 'auto') {
                const result = await AuthRepository.registerAuto(normalizedPhone);
                setGeneratedPin(result.generatedPassword ?? normalizedPhone.slice(-3));
            } else {
                await AuthRepository.registerExplicit(normalizedPhone, password);
                router.replace('/login');
            }
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                'Error al registrar. Verifica tu número.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinConfirm = () => {
        setGeneratedPin(null);
        router.replace('/login');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* PIN reveal modal */}
            <Modal visible={generatedPin !== null} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <IconSymbol name="lock.fill" size={32} color={Colors.accent} />
                        <Text style={styles.modalTitle}>Tu PIN de acceso</Text>
                        <Text style={styles.modalPin}>{generatedPin}</Text>
                        <Text style={styles.modalSubtitle}>
                            Usa estos 3 dígitos como contraseña para iniciar sesión
                        </Text>
                        <TouchableOpacity style={styles.button} onPress={handlePinConfirm}>
                            <Text style={styles.buttonText}>Ir al login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={20} color={Colors.textSecondary} />
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.brandContainer}>
                <View style={styles.iconContainer}>
                    <IconSymbol name="person.badge.plus" size={40} color={Colors.accent} />
                </View>
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>
                    Ingresa tu número registrado en la empresa
                </Text>
            </View>

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
                <TouchableOpacity
                    style={[styles.modeBtn, mode === 'auto' && styles.modeBtnActive]}
                    onPress={() => { setMode('auto'); setError(null); }}
                >
                    <Text style={[styles.modeBtnText, mode === 'auto' && styles.modeBtnTextActive]}>
                        PIN automático
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeBtn, mode === 'explicit' && styles.modeBtnActive]}
                    onPress={() => { setMode('explicit'); setError(null); }}
                >
                    <Text style={[styles.modeBtnText, mode === 'explicit' && styles.modeBtnTextActive]}>
                        Elegir contraseña
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
                {error && <Text style={styles.errorText}>{error}</Text>}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="5512345678"
                        placeholderTextColor={Colors.textSecondary}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                {mode === 'explicit' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Elige tu contraseña"
                            placeholderTextColor={Colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                )}

                {mode === 'auto' && (
                    <Text style={styles.hint}>
                        Se generará un PIN con los últimos 3 dígitos de tu número de teléfono
                    </Text>
                )}

                <TouchableOpacity
                    style={[styles.button, (!isValid || isLoading) && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={!isValid || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Registrarme</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
        padding: Spacing.xl,
    },
    header: {
        marginBottom: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? Spacing.xxl : Spacing.lg,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    backText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: Radii.xl,
        backgroundColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: Colors.secondary,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
    },
    modeBtn: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
    },
    modeBtnActive: {
        backgroundColor: Colors.accent,
    },
    modeBtnText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    modeBtnTextActive: {
        color: Colors.white,
        fontWeight: '600',
    },
    formContainer: {
        gap: Spacing.lg,
    },
    inputGroup: {
        gap: Spacing.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    input: {
        backgroundColor: Colors.secondary,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        padding: Spacing.md,
        color: Colors.textPrimary,
        fontSize: 16,
    },
    hint: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    button: {
        backgroundColor: Colors.accent,
        padding: Spacing.md,
        borderRadius: Radii.md,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: Colors.accentDanger,
        fontSize: 14,
        textAlign: 'center',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalCard: {
        backgroundColor: Colors.secondary,
        borderRadius: Radii.xl,
        padding: Spacing.xxl,
        alignItems: 'center',
        gap: Spacing.md,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    modalPin: {
        fontSize: 48,
        fontWeight: '800',
        color: Colors.accent,
        letterSpacing: 12,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
