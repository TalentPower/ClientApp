/**
 * DriverTracker App - Main Application Component
 * Professional driver app for route management and tracking
 * 
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import RuntimeSafeWrapper from './src/components/RuntimeSafeWrapper';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme } from './src/theme';

function App(): React.JSX.Element {
  return (
    <RuntimeSafeWrapper>
      <AppContent />
    </RuntimeSafeWrapper>
  );
}

function AppContent(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={lightTheme.colors.primary}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
