import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { Colors, Radii, Spacing } from '@/src/constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) return;
        try {
            await login({ email, password });
            router.replace('/(tabs)');
        } catch (e) {
            // Error handled by hook states
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.brandContainer}>
                <View style={styles.iconContainer}>
                    <IconSymbol name="bus.fill" size={48} color={Colors.accent} />
                </View>
                <Text style={styles.title}>Pasajero</Text>
                <Text style={styles.subtitle}>Tracker de movilidad empresarial</Text>
            </View>

            <View style={styles.formContainer}>
                {error && <Text style={styles.errorText}>{error}</Text>}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo Institucional</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ejemplo@empresa.com"
                        placeholderTextColor={Colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={Colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, (!email || !password || isLoading) && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={!email || !password || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Iniciar Sesión</Text>
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
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: Radii.xl,
        backgroundColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
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
    button: {
        backgroundColor: Colors.accent,
        padding: Spacing.md,
        borderRadius: Radii.md,
        alignItems: 'center',
        marginTop: Spacing.md,
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
});
