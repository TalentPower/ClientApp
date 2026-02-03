/**
 * MINIMAL App.tsx for testing runtime errors
 * Use this to isolate the problem - no complex APIs or hooks
 * 
 * To use: Rename this to App.tsx temporarily
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Import minimal components only
import MinimalLogin from './src/screens/MinimalLogin';

function App(): React.JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  console.log('🚀 [MINIMAL] App component rendering...');

  const handleLogin = (loginData: any) => {
    console.log('✅ [MINIMAL] Login successful:', loginData);
    setUserData(loginData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    console.log('🚪 [MINIMAL] Logging out...');
    setUserData(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    console.log('📝 [MINIMAL] Rendering login screen');
    return <MinimalLogin onLogin={handleLogin} />;
  }

  console.log('📱 [MINIMAL] Rendering logged-in dashboard');
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚐 DriverTracker</Text>
        <Text style={styles.subtitle}>Minimal Dashboard</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          ¡Bienvenido {userData?.name || 'Conductor'}!
        </Text>
        
        <Text style={styles.infoText}>
          ID: {userData?.id || 'N/A'}
        </Text>
        
        <Text style={styles.infoText}>
          Rol: {userData?.role || 'N/A'}
        </Text>
        
        <Text style={styles.infoText}>
          Empresas: {userData?.companies || 'N/A'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.actionButton} onPress={handleLogout}>
          🚪 Cerrar Sesión
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✅ Runtime funcionando correctamente
        </Text>
        <Text style={styles.footerText}>
          Si ves esto, el problema estaba en componentes complejos
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    marginBottom: 40,
  },
  actionButton: {
    fontSize: 18,
    color: '#EB5757',
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#EB5757',
    borderRadius: 8,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default App;
