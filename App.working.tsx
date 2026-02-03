/**
 * WORKING App.tsx - Version that avoids dimensions issues
 * Uses simple components without complex hooks
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

import SimpleLogin from './src/screens/SimpleLogin';
import SimpleDashboard from './src/screens/SimpleDashboard';

function App(): React.JSX.Element {
  console.log('🚀 [APP] Starting DriverTracker App...');
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Conductor');

  const handleLogin = (success: boolean) => {
    console.log('✅ [APP] Login callback:', success);
    if (success) {
      setUserName('Conductor'); // Will be updated from API response
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    console.log('🚪 [APP] Logout called');
    setIsLoggedIn(false);
    setUserName('Conductor');
  };

  console.log('📱 [APP] Rendering, isLoggedIn:', isLoggedIn);

  if (!isLoggedIn) {
    return <SimpleLogin onLogin={handleLogin} />;
  }

  return <SimpleDashboard userName={userName} onLogout={handleLogout} />;
}

export default App;
