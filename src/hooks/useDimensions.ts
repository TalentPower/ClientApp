// Ultra-safe dimensions hook for React Native
// Prevents crashes when Dimensions API is not ready with multiple fallback strategies

import { useState, useEffect, useRef } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ScreenDimensions {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

const DEFAULT_DIMENSIONS: ScreenDimensions = {
  width: 375,
  height: 667,
  scale: 2,
  fontScale: 1,
};

// Cache for last known good dimensions
let lastKnownDimensions: ScreenDimensions | null = null;

const getSafeDimensions = (): ScreenDimensions => {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`📏 [DIMENSIONS] Attempt ${attempts + 1}/${maxAttempts} to get dimensions`);
      
      const window = Dimensions.get('window');
      
      // Validate dimensions object
      if (!window || typeof window !== 'object') {
        throw new Error('Invalid dimensions object');
      }
      
      // Validate numeric properties
      if (typeof window.width !== 'number' || 
          typeof window.height !== 'number' ||
          window.width <= 0 || 
          window.height <= 0) {
        throw new Error(`Invalid dimensions values: ${window.width}x${window.height}`);
      }
      
      const dimensions: ScreenDimensions = {
        width: Math.floor(window.width),
        height: Math.floor(window.height),
        scale: typeof window.scale === 'number' ? window.scale : DEFAULT_DIMENSIONS.scale,
        fontScale: typeof window.fontScale === 'number' ? window.fontScale : DEFAULT_DIMENSIONS.fontScale,
      };
      
      // Cache successful result
      lastKnownDimensions = dimensions;
      console.log('✅ [DIMENSIONS] Successfully obtained:', dimensions);
      
      return dimensions;
      
    } catch (error) {
      console.warn(`⚠️ [DIMENSIONS] Attempt ${attempts + 1} failed:`, error);
      attempts++;
      
      // Use cached dimensions if available
      if (lastKnownDimensions && attempts === maxAttempts) {
        console.log('🔄 [DIMENSIONS] Using cached dimensions:', lastKnownDimensions);
        return lastKnownDimensions;
      }
      
      // Small delay before retry
      if (attempts < maxAttempts) {
        // Synchronous delay (not ideal but necessary for initialization)
        const start = Date.now();
        while (Date.now() - start < 10) {
          // Busy wait
        }
      }
    }
  }
  
  console.log('🎯 [DIMENSIONS] All attempts failed, using defaults:', DEFAULT_DIMENSIONS);
  return DEFAULT_DIMENSIONS;
};

export const useDimensions = (): ScreenDimensions => {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => getSafeDimensions());
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    // Clean up any existing subscription
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.remove();
      } catch (error) {
        console.warn('⚠️ [DIMENSIONS] Error removing old subscription:', error);
      }
      subscriptionRef.current = null;
    }

    // Try to set up dimension change listener
    try {
      console.log('🔄 [DIMENSIONS] Setting up dimension change listener');
      
      subscriptionRef.current = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
        try {
          if (window && typeof window.width === 'number' && typeof window.height === 'number') {
            const newDimensions: ScreenDimensions = {
              width: Math.floor(window.width),
              height: Math.floor(window.height),
              scale: typeof window.scale === 'number' ? window.scale : DEFAULT_DIMENSIONS.scale,
              fontScale: typeof window.fontScale === 'number' ? window.fontScale : DEFAULT_DIMENSIONS.fontScale,
            };
            
            console.log('📏 [DIMENSIONS] Dimensions changed:', newDimensions);
            lastKnownDimensions = newDimensions;
            setDimensions(newDimensions);
          } else {
            console.warn('⚠️ [DIMENSIONS] Invalid dimension change event:', window);
          }
        } catch (error) {
          console.error('❌ [DIMENSIONS] Error handling dimension change:', error);
        }
      });
      
      console.log('✅ [DIMENSIONS] Dimension change listener set up successfully');
      
    } catch (error) {
      console.error('❌ [DIMENSIONS] Failed to set up dimension change listener:', error);
    }

    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.remove();
          console.log('🧹 [DIMENSIONS] Cleaned up dimension listener');
        } catch (error) {
          console.warn('⚠️ [DIMENSIONS] Error cleaning up subscription:', error);
        }
        subscriptionRef.current = null;
      }
    };
  }, []);

  return dimensions;
};

// Additional export for direct access to safe dimensions function
export const getStaticDimensions = getSafeDimensions;

export default useDimensions;
