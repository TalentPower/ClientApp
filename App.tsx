/**
 * DriverTracker App - Main Application Component
 * Professional driver app for SGT route management and real-time tracking
 * 
 * @format
 */

import React from 'react';
import { LogBox } from 'react-native';

// Use the professional AppNavigator
import AppNavigator from './src/navigation/AppNavigator';

// Ignore specific warnings that don't affect functionality
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'Require cycle:',
]);

function App(): React.JSX.Element {
  console.log('🚀 [APP] Starting SGT DriverTracker App...');
  
  return <AppNavigator />;
}

export default App;
