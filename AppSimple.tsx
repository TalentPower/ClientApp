/**
 * SIMPLE App.tsx - Ultimate fallback version
 * No hooks, no complex components, no external APIs
 * Use this to test if basic React Native works
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

function App(): React.JSX.Element {
  console.log('🎯 [SIMPLE] App is rendering...');

  const handleTest = () => {
    console.log('✅ [SIMPLE] Button pressed successfully');
    Alert.alert('Test', 'La app funciona correctamente!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🚐 DriverTracker</Text>
        <Text style={styles.subtitle}>Test Version</Text>
        
        <Text style={styles.message}>
          Si puedes ver esto, el runtime de React Native funciona correctamente.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleTest}>
          <Text style={styles.buttonText}>Probar Funcionalidad</Text>
        </TouchableOpacity>

        <Text style={styles.info}>
          ✅ React Native runtime: OK
        </Text>
        <Text style={styles.info}>
          ✅ Component rendering: OK
        </Text>
        <Text style={styles.info}>
          ✅ Event handling: OK
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 40,
  },
  message: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 40,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 8,
  },
});

export default App;
