// Profile screen for user information and settings

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { NavigationStackParamList, AuthUser } from '../types';
import { lightTheme } from '../theme';
import { Button, Card } from '../components/UI';
import { config } from '../config/environment';

type ProfileScreenNavigationProp = StackNavigationProp<NavigationStackParamList, 'Profile'>;
type ProfileScreenRouteProp = RouteProp<NavigationStackParamList, 'Profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
  user: AuthUser | null;
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  navigation,
  user,
  onLogout,
}) => {
  const theme = lightTheme;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: onLogout, style: 'destructive' },
      ]
    );
  };

  const ProfileItem: React.FC<{
    label: string;
    value: string;
    icon?: string;
  }> = ({ label, value, icon = '📋' }) => (
    <View style={styles.profileItem}>
      <Text style={styles.profileIcon}>{icon}</Text>
      <View style={styles.profileItemContent}>
        <Text style={styles.profileLabel}>{label}</Text>
        <Text style={styles.profileValue}>{value}</Text>
      </View>
    </View>
  );

  const SettingsItem: React.FC<{
    label: string;
    onPress: () => void;
    icon?: string;
    destructive?: boolean;
  }> = ({ label, onPress, icon = '⚙️', destructive = false }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text
        style={[
          styles.settingsLabel,
          destructive && { color: theme.colors.error },
        ]}
      >
        {label}
      </Text>
      <Text style={styles.settingsArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* User Avatar and Basic Info */}
      <Card style={styles.avatarCard} padding="lg">
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'D'}
            </Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{user?.name || 'Conductor'}</Text>
            <Text style={styles.roleText}>{user?.role || 'DRIVER'}</Text>
          </View>
        </View>
      </Card>

      {/* User Details */}
      <Card style={styles.detailsCard} padding="md">
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <ProfileItem
          label="ID de Usuario"
          value={user?.id || 'N/A'}
          icon="🆔"
        />
        
        <ProfileItem
          label="Nombre Completo"
          value={user?.name || 'N/A'}
          icon="👤"
        />
        
        <ProfileItem
          label="Rol"
          value={user?.role || 'N/A'}
          icon="🏷️"
        />
        
        <ProfileItem
          label="Empresas"
          value={user?.companies?.join(', ') || 'N/A'}
          icon="🏢"
        />
      </Card>

      {/* App Information */}
      <Card style={styles.appInfoCard} padding="md">
        <Text style={styles.sectionTitle}>Información de la App</Text>
        
        <ProfileItem
          label="Versión"
          value={config.app.version}
          icon="📱"
        />
        
        <ProfileItem
          label="Nombre de la App"
          value={config.app.name}
          icon="🚐"
        />
      </Card>

      {/* Settings and Actions */}
      <Card style={styles.settingsCard} padding="none">
        <View style={styles.settingsHeader}>
          <Text style={styles.sectionTitle}>Configuración</Text>
        </View>
        
        <SettingsItem
          label="Permisos de Ubicación"
          onPress={() => Alert.alert('Configuración', 'Ir a configuración de permisos')}
          icon="📍"
        />
        
        <SettingsItem
          label="Notificaciones"
          onPress={() => Alert.alert('Configuración', 'Configurar notificaciones')}
          icon="🔔"
        />
        
        <SettingsItem
          label="Ayuda y Soporte"
          onPress={() => Alert.alert('Soporte', 'Contactar con soporte técnico')}
          icon="❓"
        />
        
        <SettingsItem
          label="Acerca de"
          onPress={() => Alert.alert(
            'Acerca de',
            `${config.app.name} v${config.app.version}\nSmart Global Technologies Inc.\n\nAplicación para gestión y monitoreo de transporte de personal.`
          )}
          icon="ℹ️"
        />
        
        <View style={styles.divider} />
        
        <SettingsItem
          label="Cerrar Sesión"
          onPress={handleLogout}
          icon="🚪"
          destructive
        />
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 Smart Global Technologies Inc.
        </Text>
        <Text style={styles.footerSubtext}>
          Todos los derechos reservados
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  scrollContent: {
    padding: lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing['2xl'],
  },
  avatarCard: {
    marginBottom: lightTheme.spacing.md,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: lightTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.md,
    ...lightTheme.shadows.md,
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.textOnPrimary,
  },
  userInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
  },
  roleText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.textSecondary,
    backgroundColor: lightTheme.colors.surfaceVariant,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.sm,
  },
  detailsCard: {
    marginBottom: lightTheme.spacing.md,
  },
  appInfoCard: {
    marginBottom: lightTheme.spacing.md,
  },
  settingsCard: {
    marginBottom: lightTheme.spacing.md,
  },
  settingsHeader: {
    paddingHorizontal: lightTheme.spacing.md,
    paddingTop: lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.md,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.md,
  },
  profileIcon: {
    fontSize: 20,
    marginRight: lightTheme.spacing.md,
    width: 24,
  },
  profileItemContent: {
    flex: 1,
  },
  profileLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing.xs,
  },
  profileValue: {
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.text,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.borderLight,
  },
  settingsIcon: {
    fontSize: 18,
    marginRight: lightTheme.spacing.md,
    width: 24,
  },
  settingsLabel: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.text,
  },
  settingsArrow: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.textDisabled,
  },
  divider: {
    height: 1,
    backgroundColor: lightTheme.colors.border,
    marginVertical: lightTheme.spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: lightTheme.spacing.lg,
  },
  footerText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: lightTheme.spacing.xs,
  },
  footerSubtext: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.textDisabled,
    textAlign: 'center',
  },
});

export default ProfileScreen;
