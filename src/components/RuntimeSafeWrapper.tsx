// Safe wrapper component that waits for React Native runtime to be ready
// Prevents crashes during bundle loading and initialization

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';

interface RuntimeSafeWrapperProps {
  children: React.ReactNode;
}

interface RuntimeState {
  isReady: boolean;
  error: string | null;
  dimensions: {
    width: number;
    height: number;
  } | null;
}

const RuntimeSafeWrapper: React.FC<RuntimeSafeWrapperProps> = ({ children }) => {
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    isReady: false,
    error: null,
    dimensions: null,
  });

  useEffect(() => {
    let isMounted = true;
    
    const initializeRuntime = async () => {
      try {
        console.log('🚀 [RUNTIME] Initializing React Native runtime...');
        
        // Wait for next tick to ensure bundle is loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Test critical APIs
        let dimensions = null;
        let retries = 0;
        const maxRetries = 10;
        
        while (!dimensions && retries < maxRetries) {
          try {
            console.log(`🔄 [RUNTIME] Attempting to get dimensions (attempt ${retries + 1}/${maxRetries})`);
            
            const testDimensions = Dimensions.get('window');
            
            if (testDimensions && typeof testDimensions.width === 'number' && typeof testDimensions.height === 'number') {
              dimensions = {
                width: testDimensions.width,
                height: testDimensions.height,
              };
              console.log('✅ [RUNTIME] Dimensions obtained successfully:', dimensions);
            } else {
              throw new Error('Invalid dimensions object');
            }
          } catch (error) {
            console.warn(`⚠️ [RUNTIME] Dimensions attempt ${retries + 1} failed:`, error);
            retries++;
            
            if (retries < maxRetries) {
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
            }
          }
        }
        
        if (!dimensions) {
          console.log('🎯 [RUNTIME] Using fallback dimensions');
          dimensions = {
            width: 375,
            height: 667,
          };
        }
        
        // Additional runtime checks
        console.log('🧪 [RUNTIME] Running additional runtime checks...');
        
        // Test StatusBar API
        try {
          StatusBar.setBarStyle('default');
          console.log('✅ [RUNTIME] StatusBar API ready');
        } catch (error) {
          console.warn('⚠️ [RUNTIME] StatusBar API not ready:', error);
        }
        
        // Wait a bit more for other modules to initialize
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (isMounted) {
          console.log('🎉 [RUNTIME] Runtime initialization complete');
          setRuntimeState({
            isReady: true,
            error: null,
            dimensions,
          });
        }
        
      } catch (error) {
        console.error('❌ [RUNTIME] Runtime initialization failed:', error);
        
        if (isMounted) {
          setRuntimeState({
            isReady: false,
            error: error instanceof Error ? error.message : 'Unknown runtime error',
            dimensions: {
              width: 375,
              height: 667,
            },
          });
          
          // Still try to render with fallback values after a delay
          setTimeout(() => {
            if (isMounted) {
              console.log('🔄 [RUNTIME] Attempting to render with fallback values...');
              setRuntimeState(prev => ({
                ...prev,
                isReady: true,
              }));
            }
          }, 1000);
        }
      }
    };

    initializeRuntime();

    return () => {
      isMounted = false;
    };
  }, []);

  // Show loading screen while runtime initializes
  if (!runtimeState.isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text style={styles.loadingText}>Iniciando aplicación...</Text>
        {runtimeState.error && (
          <Text style={styles.errorText}>
            {runtimeState.error}
          </Text>
        )}
        <Text style={styles.subText}>
          Preparando componentes...
        </Text>
      </View>
    );
  }

  // Runtime is ready, render children
  console.log('✅ [RUNTIME] Rendering main application');
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#27AE60',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: '#EB5757',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  subText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default RuntimeSafeWrapper;
