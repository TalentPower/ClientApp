// ============================================================
// Main Navigation Structure
// Professional driver app with full trip management flow
// ============================================================

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text } from 'react-native';

import { NavigationStackParamList, AuthState } from '../types';
import { lightTheme } from '../theme';
import apiAuthService from '../services/apiAuth';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import TripDashboard from '../screens/TripDashboard';
import ActiveTripScreen from '../screens/ActiveTripScreen';
import TripPassengersScreen from '../screens/TripPassengersScreen';
import CreateIncidentScreen from '../screens/CreateIncidentScreen';
import ProfileScreen from '../screens/ProfileScreen';
// Note: PreTripChecklist removed - trips start directly without checklist

const Stack = createStackNavigator<NavigationStackParamList>();

export const AppNavigator: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  const theme = lightTheme;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await apiAuthService.isAuthenticated();
      const userData = await apiAuthService.getUserData();

      if (isAuthenticated && userData) {
        setAuthState({
          isAuthenticated: true,
          user: {
            id: userData.id,
            name: userData.name,
            email: '',
            role: userData.role,
            companies: userData.companies.split(', '),
            companiesId: userData.companiesId.split(', '),
            jwt: userData.jwt,
            employeeId: userData.employeeId,
          },
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  };

  const handleLogin = (userData: any) => {
    setAuthState({
      isAuthenticated: true,
      user: {
        id: userData.id,
        name: userData.name,
        email: '',
        role: userData.role,
        companies: userData.companies.split(', '),
        companiesId: userData.companiesId.split(', '),
        jwt: userData.jwt,
        employeeId: userData.employeeId,
      },
      loading: false,
    });
  };

  const handleLogout = async () => {
    try {
      await apiAuthService.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (authState.loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: theme.colors.textOnPrimary,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: theme.typography.fontSize.lg,
          },
          headerBackTitleVisible: false,
          cardStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        {!authState.isAuthenticated ? (
          // ========== AUTH SCREENS ==========
          <Stack.Screen
            name="Login"
            options={{ headerShown: false }}
          >
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          // ========== MAIN APP SCREENS ==========
          <>
            {/* Dashboard - Main screen */}
            <Stack.Screen
              name="TripDashboard"
              options={{
                title: 'SGT Driver',
                headerLeft: () => null,
                headerRight: () => (
                  <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => {}}
                  >
                    <Text style={styles.headerBtnText}>🔔</Text>
                  </TouchableOpacity>
                ),
              }}
            >
              {(props) => (
                <TripDashboard
                  {...props}
                  user={authState.user}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
            
            {/* Active Trip - Full map view */}
            <Stack.Screen
              name="ActiveTrip"
              component={ActiveTripScreen}
              options={{
                title: 'Viaje Activo',
                headerBackTitleVisible: false,
                headerTransparent: true,
                headerStyle: {
                  backgroundColor: 'transparent',
                },
              }}
            />
            
            {/* Trip Passengers */}
            <Stack.Screen
              name="TripPassengers"
              component={TripPassengersScreen}
              options={{
                title: 'Pasajeros',
                headerBackTitleVisible: false,
              }}
            />
            
            {/* Create Incident */}
            <Stack.Screen
              name="CreateIncident"
              component={CreateIncidentScreen}
              options={{
                title: 'Reportar Incidente',
                headerBackTitleVisible: false,
                headerStyle: {
                  backgroundColor: theme.colors.error,
                },
              }}
            />
            
            {/* Profile */}
            <Stack.Screen
              name="Profile"
              options={{
                title: 'Mi Perfil',
                headerBackTitleVisible: false,
              }}
            >
              {(props) => (
                <ProfileScreen
                  {...props}
                  user={authState.user}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.background,
  },
  loadingCard: {
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.xl,
    borderRadius: lightTheme.borderRadius.xl,
    alignItems: 'center',
    ...lightTheme.shadows.lg,
  },
  loadingText: {
    marginTop: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.textSecondary,
  },
  headerBtn: {
    marginRight: lightTheme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: 18,
  },
});

export default AppNavigator;
