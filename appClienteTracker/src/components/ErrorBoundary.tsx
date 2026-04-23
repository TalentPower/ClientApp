import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radii, Spacing } from '../constants/Colors';

interface Props {
    children: React.ReactNode;
}
interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Top-level ErrorBoundary — catches render errors in the React tree so a
 * component crash shows a recovery screen instead of a black app.
 * Does NOT catch async errors, event handlers, or SSR.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        if (__DEV__) {
            console.error('ErrorBoundary caught:', error, info);
        }
        // TODO: send to crash reporter (Sentry, etc.) when wired up
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Algo salió mal</Text>
                    <Text style={styles.subtitle}>
                        La aplicación encontró un error inesperado. Intenta reiniciar.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <Text style={styles.errorDetail}>{this.state.error.message}</Text>
                    )}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={this.handleReset}
                        accessibilityRole="button"
                        accessibilityLabel="Reintentar"
                    >
                        <Text style={styles.buttonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    errorDetail: {
        fontSize: 12,
        color: Colors.accentDanger,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radii.md,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
