// Checklist Service
// Manages pre-trip checklist submission and validation

import apiAuth from './apiAuth';
import { config } from '../config/environment';

export type ChecklistStatus = 'PENDING' | 'OK' | 'ISSUE' | 'NA';
export type ChecklistItemType = 'CHECKBOX' | 'SELECTOR' | 'TEXT' | 'PHOTO_ONLY';

export interface ChecklistItem {
  code: string;
  description: string;
  itemType: ChecklistItemType;
  isRequired: boolean;
  requiresPhoto: boolean;
  selectorOptions?: string[];
}

export interface ChecklistItemSubmission {
  itemCode: string;
  status: ChecklistStatus;
  selectedValue?: string;
  observations?: string;
  photoUrl?: string;
}

export interface ChecklistSubmission {
  tripId: string;
  items: ChecklistItemSubmission[];
}

export interface ChecklistValidationResult {
  tripId: string;
  passed: boolean;
  newStatus: string;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  failedItemCodes: string[];
  message: string;
  requiresOverride: boolean;
}

class ChecklistService {
  private readonly BASE_URL = config.api.baseUrl;

  /**
   * Inicia el proceso de checklist para un viaje
   */
  async startChecklist(tripId: string): Promise<{ status: string; message: string }> {
    try {
      console.log('🔄 [CHECKLIST] Starting checklist for tripId:', tripId);
      
      const authHeader = await apiAuth.getAuthHeader();
      
      const response = await fetch(
        `${this.BASE_URL}/api/route-trips/${tripId}/checklist/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeader,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start checklist: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [CHECKLIST] Checklist started:', data);
      
      return data.data || data;
    } catch (error) {
      console.error('❌ [CHECKLIST] Error starting checklist:', error);
      throw error;
    }
  }

  /**
   * Envía el checklist completado para validación
   */
  async submitChecklist(submission: ChecklistSubmission): Promise<ChecklistValidationResult> {
    try {
      console.log('🔄 [CHECKLIST] Submitting checklist for tripId:', submission.tripId);
      
      const authHeader = await apiAuth.getAuthHeader();
      
      // Transform items to match backend DTO
      const backendSubmission = {
        tripId: parseInt(submission.tripId, 10),
        items: submission.items.map(item => ({
          itemCode: item.itemCode,
          status: item.status,
          selectedValue: item.selectedValue,
          observations: item.observations,
          photoUrl: item.photoUrl,
        })),
      };

      const response = await fetch(
        `${this.BASE_URL}/api/route-trips/${submission.tripId}/checklist/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify(backendSubmission),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit checklist: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [CHECKLIST] Checklist submitted:', data);
      
      return data.data || data;
    } catch (error) {
      console.error('❌ [CHECKLIST] Error submitting checklist:', error);
      
      // Return mock result for offline/error scenarios
      const hasFailed = submission.items.some(item => item.status === 'ISSUE');
      
      return {
        tripId: submission.tripId,
        passed: !hasFailed,
        newStatus: hasFailed ? 'CHECKLIST_FAILED' : 'READY',
        totalItems: submission.items.length,
        passedItems: submission.items.filter(i => i.status === 'OK').length,
        failedItems: submission.items.filter(i => i.status === 'ISSUE').length,
        failedItemCodes: submission.items.filter(i => i.status === 'ISSUE').map(i => i.itemCode),
        message: hasFailed 
          ? 'Checklist con problemas. Se requiere autorización del supervisor.'
          : 'Checklist completado exitosamente. El viaje está listo para iniciar.',
        requiresOverride: hasFailed,
      };
    }
  }

  /**
   * Obtiene los items del checklist para un viaje
   */
  async getChecklistItems(tripId: string): Promise<any[]> {
    try {
      console.log('🔄 [CHECKLIST] Getting checklist items for tripId:', tripId);
      
      const authHeader = await apiAuth.getAuthHeader();
      
      const response = await fetch(
        `${this.BASE_URL}/api/route-trips/${tripId}/checklist`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...authHeader,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get checklist items: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [CHECKLIST] Checklist items retrieved:', data);
      
      return data.data || [];
    } catch (error) {
      console.error('❌ [CHECKLIST] Error getting checklist items:', error);
      return [];
    }
  }

  /**
   * Sube una foto de evidencia para el checklist
   */
  async uploadChecklistPhoto(tripId: string, itemCode: string, photoUri: string): Promise<string | null> {
    try {
      console.log('🔄 [CHECKLIST] Uploading photo for item:', itemCode);
      
      const authHeader = await apiAuth.getAuthHeader();
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `checklist_${itemCode}_${Date.now()}.jpg`,
      } as any);

      const response = await fetch(
        `${this.BASE_URL}/api/route-trips/${tripId}/checklist/upload`,
        {
          method: 'POST',
          headers: {
            ...authHeader,
            // Don't set Content-Type for FormData, let it be set automatically
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload photo: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [CHECKLIST] Photo uploaded:', data);
      
      return data.data?.fileUrl || data.fileUrl || null;
    } catch (error) {
      console.error('❌ [CHECKLIST] Error uploading photo:', error);
      return null;
    }
  }
}

export default new ChecklistService();

