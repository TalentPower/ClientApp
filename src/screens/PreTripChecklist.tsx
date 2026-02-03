// Pre-Trip Checklist Screen
// Mandatory checklist before starting a trip

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { NavigationStackParamList, AuthUser } from '../types';
import { lightTheme } from '../theme';
import { Button, Card } from '../components/UI';
import { useDimensions } from '../hooks/useDimensions';
import checklistService, { 
  ChecklistItem, 
  ChecklistSubmission,
  ChecklistStatus 
} from '../services/checklistService';
import tripLocationService from '../services/tripLocationService';
import tripApiService from '../services/tripApiService';
import apiAuth from '../services/apiAuth';

type PreTripChecklistNavigationProp = StackNavigationProp<NavigationStackParamList, 'PreTripChecklist'>;
type PreTripChecklistRouteProp = RouteProp<NavigationStackParamList, 'PreTripChecklist'>;

interface PreTripChecklistProps {
  navigation: PreTripChecklistNavigationProp;
  route: PreTripChecklistRouteProp;
  user: AuthUser | null;
}

// Checklist items predefinidos
const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    code: 'LIGHTS',
    description: 'Luces funcionando correctamente',
    itemType: 'CHECKBOX',
    isRequired: true,
    requiresPhoto: false,
  },
  {
    code: 'FUEL_GAS',
    description: 'Nivel de gasolina',
    itemType: 'SELECTOR',
    isRequired: true,
    requiresPhoto: true,
    selectorOptions: ['LLENO', '3/4', '1/2', '1/4', 'RESERVA'],
  },
  {
    code: 'FUEL_LP',
    description: 'Nivel de gas LP',
    itemType: 'SELECTOR',
    isRequired: false,
    requiresPhoto: false,
    selectorOptions: ['LLENO', '3/4', '1/2', '1/4', 'VACIO', 'N/A'],
  },
  {
    code: 'TIRES',
    description: 'Llantas en buen estado e infladas',
    itemType: 'CHECKBOX',
    isRequired: true,
    requiresPhoto: false,
  },
  {
    code: 'BRAKES',
    description: 'Frenos en buenas condiciones',
    itemType: 'CHECKBOX',
    isRequired: true,
    requiresPhoto: false,
  },
];

interface ChecklistItemState {
  code: string;
  status: ChecklistStatus;
  selectedValue?: string;
  observations?: string;
  photoUrl?: string;
}

const PreTripChecklist: React.FC<PreTripChecklistProps> = ({
  navigation,
  route,
  user,
}) => {
  const [items, setItems] = useState<ChecklistItemState[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const theme = lightTheme;
  const { width } = useDimensions();
  const tripId = route.params?.tripId;

  useEffect(() => {
    initializeChecklist();
  }, []);

  const initializeChecklist = () => {
    // Inicializar estados de items
    const initialItems: ChecklistItemState[] = CHECKLIST_ITEMS.map(item => ({
      code: item.code,
      status: 'PENDING' as ChecklistStatus,
      selectedValue: undefined,
      observations: undefined,
      photoUrl: undefined,
    }));
    setItems(initialItems);
  };

  const updateItemStatus = (code: string, status: ChecklistStatus) => {
    setItems(prev => prev.map(item => 
      item.code === code ? { ...item, status } : item
    ));
  };

  const updateItemValue = (code: string, selectedValue: string) => {
    setItems(prev => prev.map(item => 
      item.code === code ? { ...item, selectedValue, status: 'OK' as ChecklistStatus } : item
    ));
  };

  const handlePhotoCapture = async (code: string) => {
    // En una implementación real, aquí se abriría la cámara
    // Por ahora, simulamos la captura de foto
    Alert.alert(
      'Capturar Foto',
      '¿Deseas tomar una foto para este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Simular Foto', 
          onPress: () => {
            setItems(prev => prev.map(item => 
              item.code === code 
                ? { ...item, photoUrl: 'photo_captured_' + Date.now() } 
                : item
            ));
            Alert.alert('Foto capturada', 'La foto se ha guardado correctamente.');
          }
        },
      ]
    );
  };

  const isChecklistComplete = (): boolean => {
    return CHECKLIST_ITEMS.every(templateItem => {
      const stateItem = items.find(i => i.code === templateItem.code);
      if (!stateItem) return false;
      
      if (templateItem.isRequired) {
        if (stateItem.status === 'PENDING') return false;
        if (templateItem.itemType === 'SELECTOR' && !stateItem.selectedValue) return false;
        if (templateItem.requiresPhoto && !stateItem.photoUrl) return false;
      }
      
      return true;
    });
  };

  const hasIssues = (): boolean => {
    return items.some(item => item.status === 'ISSUE');
  };

  const handleSubmit = async () => {
    if (!isChecklistComplete()) {
      Alert.alert(
        'Checklist Incompleto',
        'Por favor, completa todos los items obligatorios antes de continuar.',
      );
      return;
    }

    setSubmitting(true);

    try {
      const submission: ChecklistSubmission = {
        tripId: tripId || '0',
        items: items.map(item => ({
          itemCode: item.code,
          status: item.status,
          selectedValue: item.selectedValue,
          observations: item.observations,
          photoUrl: item.photoUrl,
        })),
      };

      const result = await checklistService.submitChecklist(submission);

      if (result.passed) {
        // Initialize trip tracking in Firebase before starting
        try {
          const userData = await apiAuth.getUserData();
          if (userData && tripId) {
            const companyIds = await apiAuth.getUserCompanyIds();
            const companyId = companyIds.length > 0 ? parseInt(companyIds[0], 10) : 0;
            
            await tripLocationService.initializeTripLocation(
              tripId,
              0, // routeId - will be fetched from trip data
              userData.id,
              userData.name,
              companyId
            );
            console.log('✅ [CHECKLIST] Trip tracking initialized in Firebase');
            
            // Start the trip in the backend
            await tripApiService.startTrip(tripId);
            console.log('✅ [CHECKLIST] Trip started in backend');
          }
        } catch (initError) {
          console.warn('⚠️ [CHECKLIST] Error initializing trip tracking:', initError);
          // Don't block navigation if Firebase init fails
        }
        
        Alert.alert(
          'Checklist Aprobado ✓',
          result.message,
          [
            {
              text: 'Iniciar Viaje',
              onPress: () => navigation.navigate('ActiveTrip', { tripId: tripId || '' }),
            },
          ]
        );
      } else {
        Alert.alert(
          'Checklist con Observaciones ⚠️',
          result.message + '\n\nContacta a tu supervisor para autorización.',
          [
            { text: 'Entendido', style: 'cancel' },
            {
              text: 'Reintentar',
              onPress: initializeChecklist,
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting checklist:', error);
      Alert.alert('Error', 'No se pudo enviar el checklist. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCheckboxItem = (templateItem: ChecklistItem, stateItem: ChecklistItemState) => {
    const isOk = stateItem.status === 'OK';
    const isIssue = stateItem.status === 'ISSUE';

    return (
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[
            styles.checkboxButton,
            isOk && styles.checkboxButtonOk,
          ]}
          onPress={() => updateItemStatus(templateItem.code, 'OK')}
        >
          <Text style={[styles.checkboxText, isOk && styles.checkboxTextActive]}>
            ✓ OK
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.checkboxButton,
            isIssue && styles.checkboxButtonIssue,
          ]}
          onPress={() => updateItemStatus(templateItem.code, 'ISSUE')}
        >
          <Text style={[styles.checkboxText, isIssue && styles.checkboxTextActive]}>
            ✗ Problema
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSelectorItem = (templateItem: ChecklistItem, stateItem: ChecklistItemState) => {
    const options = templateItem.selectorOptions || [];

    return (
      <View style={styles.selectorContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.selectorOption,
              stateItem.selectedValue === option && styles.selectorOptionSelected,
            ]}
            onPress={() => updateItemValue(templateItem.code, option)}
          >
            <Text style={[
              styles.selectorOptionText,
              stateItem.selectedValue === option && styles.selectorOptionTextSelected,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderChecklistItem = (templateItem: ChecklistItem, index: number) => {
    const stateItem = items.find(i => i.code === templateItem.code);
    if (!stateItem) return null;

    const isComplete = stateItem.status !== 'PENDING' || 
      (templateItem.itemType === 'SELECTOR' && stateItem.selectedValue);

    return (
      <Card key={templateItem.code} style={styles.itemCard} padding="md">
        <View style={styles.itemHeader}>
          <View style={styles.itemNumber}>
            <Text style={styles.itemNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemDescription}>
              {templateItem.description}
              {templateItem.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
          </View>
          {isComplete && (
            <View style={[
              styles.itemStatus,
              stateItem.status === 'ISSUE' ? styles.itemStatusIssue : styles.itemStatusOk,
            ]}>
              <Text style={styles.itemStatusText}>
                {stateItem.status === 'ISSUE' ? '⚠️' : '✓'}
              </Text>
            </View>
          )}
        </View>

        {templateItem.itemType === 'CHECKBOX' && renderCheckboxItem(templateItem, stateItem)}
        {templateItem.itemType === 'SELECTOR' && renderSelectorItem(templateItem, stateItem)}

        {templateItem.requiresPhoto && (
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handlePhotoCapture(templateItem.code)}
            >
              <Text style={styles.photoButtonText}>
                {stateItem.photoUrl ? '📷 Foto Capturada' : '📷 Tomar Foto'}
              </Text>
            </TouchableOpacity>
            {stateItem.photoUrl && (
              <Text style={styles.photoConfirm}>✓ Foto guardada</Text>
            )}
          </View>
        )}
      </Card>
    );
  };

  const completedCount = items.filter(item => {
    const template = CHECKLIST_ITEMS.find(t => t.code === item.code);
    if (!template) return false;
    if (item.status !== 'PENDING') return true;
    if (template.itemType === 'SELECTOR' && item.selectedValue) return true;
    return false;
  }).length;

  const progress = (completedCount / CHECKLIST_ITEMS.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checklist Pre-Viaje</Text>
        <Text style={styles.headerSubtitle}>
          Completa todos los items antes de iniciar
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedCount} de {CHECKLIST_ITEMS.length} completados
        </Text>
      </View>

      {/* Checklist Items */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {CHECKLIST_ITEMS.map((item, index) => renderChecklistItem(item, index))}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        {hasIssues() && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ Hay items con problemas. El viaje requerirá autorización.
            </Text>
          </View>
        )}

        <Button
          title={submitting ? 'Enviando...' : 'Enviar Checklist'}
          onPress={handleSubmit}
          disabled={!isChecklistComplete() || submitting}
          loading={submitting}
          fullWidth
          size="lg"
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
  header: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.md,
    paddingTop: lightTheme.spacing.lg,
    paddingBottom: lightTheme.spacing.md,
  },
  headerTitle: {
    fontSize: lightTheme.typography.fontSize['2xl'],
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.white,
  },
  headerSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.white,
    opacity: 0.9,
    marginTop: lightTheme.spacing.xs,
  },
  progressContainer: {
    padding: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: lightTheme.colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.textSecondary,
    marginTop: lightTheme.spacing.sm,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing['2xl'],
  },
  itemCard: {
    marginBottom: lightTheme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.sm,
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: lightTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: lightTheme.spacing.sm,
  },
  itemNumberText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.bold,
    color: lightTheme.colors.white,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.text,
  },
  required: {
    color: lightTheme.colors.error,
  },
  itemStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemStatusOk: {
    backgroundColor: lightTheme.colors.success + '20',
  },
  itemStatusIssue: {
    backgroundColor: lightTheme.colors.warning + '20',
  },
  itemStatusText: {
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: lightTheme.spacing.sm,
  },
  checkboxButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    alignItems: 'center',
  },
  checkboxButtonOk: {
    backgroundColor: lightTheme.colors.success,
    borderColor: lightTheme.colors.success,
  },
  checkboxButtonIssue: {
    backgroundColor: lightTheme.colors.warning,
    borderColor: lightTheme.colors.warning,
  },
  checkboxText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.textSecondary,
  },
  checkboxTextActive: {
    color: lightTheme.colors.white,
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing.xs,
  },
  selectorOption: {
    paddingVertical: lightTheme.spacing.xs,
    paddingHorizontal: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    backgroundColor: lightTheme.colors.surface,
  },
  selectorOptionSelected: {
    backgroundColor: lightTheme.colors.primary,
    borderColor: lightTheme.colors.primary,
  },
  selectorOptionText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.text,
  },
  selectorOptionTextSelected: {
    color: lightTheme.colors.white,
  },
  photoSection: {
    marginTop: lightTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.spacing.sm,
  },
  photoButton: {
    paddingVertical: lightTheme.spacing.xs,
    paddingHorizontal: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.sm,
    backgroundColor: lightTheme.colors.info + '20',
  },
  photoButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.info,
  },
  photoConfirm: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: lightTheme.typography.fontFamily.regular,
    color: lightTheme.colors.success,
  },
  footer: {
    padding: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.border,
  },
  warningBanner: {
    backgroundColor: lightTheme.colors.warning + '20',
    padding: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.sm,
    marginBottom: lightTheme.spacing.sm,
  },
  warningText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: lightTheme.typography.fontFamily.medium,
    color: lightTheme.colors.text,
    textAlign: 'center',
  },
});

export default PreTripChecklist;

