// Ultra-simple login without any complex dependencies
// Goal: Isolate what's causing the runtime error

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import apiAuthService from '../services/apiAuth';

interface SimpleLoginProps {
  onLogin: (success: boolean, userName?: string, userId?: string) => void;
}

const SimpleLogin: React.FC<SimpleLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  console.log('🔑 [SIMPLE-LOGIN] Component rendering...');

  const handleLogin = async () => {
    console.log('🔄 [SIMPLE-LOGIN] Login attempt started');
    
    if (!email || !password) {
      Alert.alert('Error', 'Ingresa email y contraseña');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🌐 [SIMPLE-LOGIN] Making API call...');
      
      // Use apiAuthService to handle login and Firebase initialization
      const userData = await apiAuthService.login({
        email: email.trim(),
        password: password.trim(),
      });

      console.log('✅ [SIMPLE-LOGIN] Login successful:', userData.name);
      console.log('🆔 [SIMPLE-LOGIN] User ID:', userData.id);
      
      Alert.alert(
        'Éxito',
        `¡Bienvenido ${userData.name}!`,
        [{ text: 'OK', onPress: () => onLogin(true, userData.name, userData.id) }]
      );
      
    } catch (error) {
      console.error('❌ [SIMPLE-LOGIN] Login failed:', error);
      Alert.alert('Error', 'Login falló. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🚐 DriverTracker</Text>
        <Text style={styles.subtitle}>Login Simple</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Conectando...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Usa: carlos.abraham2000@gmail.com / 1Carlos9$9
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27AE60',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default SimpleLogin;
