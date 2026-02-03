// Professional login screen with form validation

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

import { NavigationStackParamList } from '../types';
import { lightTheme } from '../theme';
import { Button, Input, Card } from '../components/UI';
import { useDimensions } from '../hooks/useDimensions';
import apiAuthService from '../services/apiAuth';

type LoginScreenNavigationProp = StackNavigationProp<NavigationStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  onLogin: (userData: any) => void;
}

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLogin }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const theme = lightTheme;
  const { width, height } = useDimensions();

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingrese un correo electrónico válido';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const userData = await apiAuthService.login({
        email: formData.email,
        password: formData.password,
      });

      // Success - call parent onLogin handler
      onLogin(userData);
      
      Alert.alert(
        'Bienvenido',
        `¡Hola ${userData.name}! Has iniciado sesión exitosamente.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Error al iniciar sesión. Verifique sus credenciales.';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Credenciales incorrectas. Verifique su correo y contraseña.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          {/* App Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>🚐</Text>
            </View>
          </View>
          
          <Text style={styles.title}>DriverTracker</Text>
          <Text style={styles.subtitle}>Gestión de Rutas y Transporte</Text>
        </View>

        {/* Login Form */}
        <Card style={styles.formCard} padding="lg" shadow="md">
          <Text style={styles.formTitle}>Iniciar Sesión</Text>
          <Text style={styles.formSubtitle}>
            Ingrese sus credenciales para acceder
          </Text>

          {/* General Error */}
          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          {/* Email Input */}
          <Input
            label="Correo Electrónico"
            type="email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            error={errors.email}
            placeholder="ejemplo@empresa.com"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            required
          />

          {/* Password Input */}
          <Input
            label="Contraseña"
            type="password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            error={errors.password}
            placeholder="••••••••"
            editable={!loading}
            required
          />

          {/* Login Button */}
          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            fullWidth
          />
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Smart Global Technologies Inc.
          </Text>
          <Text style={styles.versionText}>
            Versión {require('../../package.json').version}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing.lg,
    paddingVertical: lightTheme.spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: lightTheme.spacing['2xl'],
  },
  logoContainer: {
    marginBottom: lightTheme.spacing.lg,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: lightTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...lightTheme.shadows.md,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: lightTheme.typography.fontSize['3xl'],
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.text,
    textAlign: 'center',
    marginBottom: lightTheme.spacing.xs,
  },
  subtitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: lightTheme.spacing.xl,
  },
  formTitle: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.text,
    textAlign: 'center',
    marginBottom: lightTheme.spacing.xs,
  },
  formSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: lightTheme.spacing.lg,
  },
  errorContainer: {
    backgroundColor: `${lightTheme.colors.error}15`,
    borderColor: lightTheme.colors.error,
    borderWidth: 1,
    borderRadius: lightTheme.borderRadius.sm,
    padding: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.md,
  },
  errorText: {
    color: lightTheme.colors.error,
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.regular,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: lightTheme.spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: lightTheme.spacing.xl,
  },
  footerText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: lightTheme.spacing.xs,
  },
  versionText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textDisabled,
    textAlign: 'center',
  },
});

export default LoginScreen;
