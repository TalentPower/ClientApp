// ============================================================
// Create Incident Screen
// Report incidents with photo/video evidence
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';

import {
  NavigationStackParamList,
  IncidentSeverity,
  CreateIncidentRequest,
  Coordinate,
} from '../types';
import { lightTheme } from '../theme';
import { Button, Card } from '../components/UI';
import tripApiService from '../services/tripApiService';
import locationService from '../services/location';
import apiAuth from '../services/apiAuth';

type CreateIncidentNavigationProp = StackNavigationProp<NavigationStackParamList, 'CreateIncident'>;
type CreateIncidentRouteProp = RouteProp<NavigationStackParamList, 'CreateIncident'>;

interface CreateIncidentScreenProps {
  navigation: CreateIncidentNavigationProp;
  route: CreateIncidentRouteProp;
}

interface IncidentPhoto {
  uri: string;
  type: string;
  uploaded: boolean;
  uploadedUrl?: string;
}

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string; color: string; icon: string; description: string }[] = [
  { 
    value: 'LOW', 
    label: 'Baja', 
    color: '#22C55E',
    icon: '🟢',
    description: 'Sin impacto en la operación'
  },
  { 
    value: 'MEDIUM', 
    label: 'Media', 
    color: '#F59E0B',
    icon: '🟡',
    description: 'Impacto menor, se puede continuar'
  },
  { 
    value: 'HIGH', 
    label: 'Alta', 
    color: '#F97316',
    icon: '🟠',
    description: 'Requiere atención inmediata'
  },
  { 
    value: 'CRITICAL', 
    label: 'Crítica', 
    color: '#EF4444',
    icon: '🔴',
    description: 'Emergencia, detener operación'
  },
];

const INCIDENT_TYPES = [
  { id: 'mechanical', label: '🔧 Falla Mecánica', title: 'Falla mecánica del vehículo' },
  { id: 'accident', label: '💥 Accidente', title: 'Accidente de tránsito' },
  { id: 'traffic', label: '🚗 Tráfico', title: 'Congestión vehicular' },
  { id: 'passenger', label: '👤 Pasajero', title: 'Incidente con pasajero' },
  { id: 'route', label: '🛣️ Ruta', title: 'Bloqueo o desvío de ruta' },
  { id: 'medical', label: '🏥 Médico', title: 'Emergencia médica' },
  { id: 'security', label: '🚨 Seguridad', title: 'Incidente de seguridad' },
  { id: 'other', label: '📝 Otro', title: 'Otro incidente' },
];

const CreateIncidentScreen: React.FC<CreateIncidentScreenProps> = ({ navigation, route }) => {
  const { tripId } = route.params;
  
  const [incidentType, setIncidentType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [photos, setPhotos] = useState<IncidentPhoto[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const theme = lightTheme;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleTypeSelect = (type: typeof INCIDENT_TYPES[0]) => {
    setIncidentType(type.id);
    setTitle(type.title);
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        includeBase64: false,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setPhotos(prev => [...prev, {
            uri: asset.uri!,
            type: asset.type || 'image/jpeg',
            uploaded: false,
          }]);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo capturar la foto.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        selectionLimit: 3,
      });

      if (result.assets) {
        const newPhotos = result.assets.map(asset => ({
          uri: asset.uri!,
          type: asset.type || 'image/jpeg',
          uploaded: false,
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!incidentType) {
      Alert.alert('Error', 'Por favor selecciona un tipo de incidente.');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el incidente.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor describe el incidente.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Get user data
      const userData = await apiAuth.getUserData();
      const companyIds = await apiAuth.getUserCompanyIds();
      
      if (!userData) {
        throw new Error('No user data available');
      }
      
      // Create incident request
      const request: CreateIncidentRequest = {
        tripId: parseInt(tripId, 10),
        companyId: companyIds.length > 0 ? parseInt(companyIds[0], 10) : 0,
        reporterEmployeeId: userData.employeeId || parseInt(userData.id, 10),
        title: title.trim(),
        description: description.trim(),
        severity,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      };
      
      // Create the incident
      const incident = await tripApiService.createIncident(request);
      
      if (incident && photos.length > 0) {
        // Upload photos as evidence
        setUploadingPhotos(true);
        
        for (const photo of photos) {
          try {
            await tripApiService.uploadIncidentEvidence(
              incident.id.toString(),
              photo.uri,
              'image'
            );
          } catch (photoError) {
            console.warn('Error uploading photo:', photoError);
          }
        }
        
        setUploadingPhotos(false);
      }
      
      Alert.alert(
        '✅ Incidente Reportado',
        'El incidente ha sido registrado exitosamente. Tu supervisor será notificado.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating incident:', error);
      Alert.alert('Error', 'No se pudo crear el incidente. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderSeverityOption = (option: typeof SEVERITY_OPTIONS[0]) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.severityOption,
        severity === option.value && { 
          borderColor: option.color,
          backgroundColor: `${option.color}15`,
        },
      ]}
      onPress={() => setSeverity(option.value)}
    >
      <Text style={styles.severityIcon}>{option.icon}</Text>
      <View style={styles.severityContent}>
        <Text style={[styles.severityLabel, severity === option.value && { color: option.color }]}>
          {option.label}
        </Text>
        <Text style={styles.severityDescription}>{option.description}</Text>
      </View>
      {severity === option.value && (
        <Text style={[styles.checkMark, { color: option.color }]}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🚨</Text>
          <Text style={styles.headerTitle}>Reportar Incidente</Text>
          <Text style={styles.headerSubtitle}>
            Describe el incidente con el mayor detalle posible
          </Text>
        </View>
        
        {/* Incident Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Incidente</Text>
          <View style={styles.typeGrid}>
            {INCIDENT_TYPES.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  incidentType === type.id && styles.typeCardSelected,
                ]}
                onPress={() => handleTypeSelect(type)}
              >
                <Text style={styles.typeLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe brevemente el incidente"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>
        
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Proporciona detalles del incidente: qué pasó, cuándo, dónde, personas involucradas..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        {/* Severity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severidad</Text>
          <View style={styles.severityList}>
            {SEVERITY_OPTIONS.map(renderSeverityOption)}
          </View>
        </View>
        
        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidencia Fotográfica</Text>
          <Text style={styles.sectionHint}>Agrega fotos del incidente (opcional)</Text>
          
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoCard}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Text style={styles.photoRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {photos.length < 5 && (
              <View style={styles.addPhotoButtons}>
                <TouchableOpacity
                  style={styles.addPhotoBtn}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.addPhotoIcon}>📷</Text>
                  <Text style={styles.addPhotoText}>Cámara</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.addPhotoBtn}
                  onPress={handlePickImage}
                >
                  <Text style={styles.addPhotoIcon}>🖼️</Text>
                  <Text style={styles.addPhotoText}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Location Info */}
        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>
              Ubicación registrada: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          title={uploadingPhotos ? "Subiendo fotos..." : loading ? "Enviando..." : "Enviar Reporte"}
          onPress={handleSubmit}
          loading={loading || uploadingPhotos}
          disabled={loading || uploadingPhotos || !incidentType || !title.trim()}
          fullWidth
          size="lg"
          variant={severity === 'CRITICAL' ? 'error' : 'primary'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: lightTheme.spacing.md,
    paddingBottom: 100,
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: lightTheme.spacing.lg,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: lightTheme.spacing.sm,
  },
  headerTitle: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  headerSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: lightTheme.spacing.xs,
  },
  
  // Section
  section: {
    marginBottom: lightTheme.spacing.xl,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: '600',
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.sm,
  },
  sectionHint: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textMuted,
    marginBottom: lightTheme.spacing.md,
  },
  
  // Type Selection
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing.sm,
  },
  typeCard: {
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  typeCardSelected: {
    backgroundColor: `${lightTheme.colors.primary}15`,
    borderColor: lightTheme.colors.primary,
  },
  typeLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.text,
  },
  
  // Input
  input: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.text,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  textArea: {
    minHeight: 120,
  },
  
  // Severity
  severityList: {
    gap: lightTheme.spacing.sm,
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: lightTheme.colors.border,
  },
  severityIcon: {
    fontSize: 24,
    marginRight: lightTheme.spacing.md,
  },
  severityContent: {
    flex: 1,
  },
  severityLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: '600',
    color: lightTheme.colors.text,
  },
  severityDescription: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textMuted,
    marginTop: 2,
  },
  checkMark: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  // Photos
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing.sm,
  },
  photoCard: {
    width: 100,
    height: 100,
    borderRadius: lightTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: lightTheme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: {
    color: lightTheme.colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: lightTheme.spacing.sm,
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.border,
    backgroundColor: lightTheme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textMuted,
  },
  
  // Location
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surfaceVariant,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: lightTheme.spacing.sm,
  },
  locationText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textSecondary,
    flex: 1,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: lightTheme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.border,
  },
});

export default CreateIncidentScreen;

