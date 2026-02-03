// WhatsApp integration service via n8n for trip notifications

import { config } from '../config/environment';
import apiAuthService from './apiAuth';
import { Trip, Location } from '../types';

export interface WhatsAppMessage {
  to: string; // Phone number with country code
  message: string;
  type: 'text' | 'location' | 'media';
  mediaUrl?: string;
}

export interface TripNotification {
  type: 'trip_started' | 'trip_progress' | 'trip_completed' | 'trip_cancelled' | 'location_update';
  trip: Trip;
  location?: Location;
  customMessage?: string;
  recipients: string[]; // Array of phone numbers
}

export interface NotificationSettings {
  enabled: boolean;
  tripStart: boolean;
  tripProgress: boolean;
  tripCompletion: boolean;
  locationUpdates: boolean;
  emergencyAlerts: boolean;
  recipients: {
    supervisors: string[];
    passengers: string[];
    emergency: string[];
  };
}

class WhatsAppService {
  private readonly N8N_WEBHOOK_URL = 'https://n8n.yourdomain.com/webhook'; // Replace with actual n8n webhook
  private readonly WHATSAPP_API_ENDPOINT = '/whatsapp-send';

  // Send WhatsApp message via n8n
  async sendWhatsAppMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      const authHeaders = await apiAuthService.getAuthHeader();
      
      const response = await fetch(`${this.N8N_WEBHOOK_URL}${this.WHATSAPP_API_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('WhatsApp send error:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('WhatsApp message sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  // Send trip notification to multiple recipients
  async sendTripNotification(notification: TripNotification): Promise<boolean[]> {
    const { type, trip, location, customMessage, recipients } = notification;
    
    const message = customMessage || this.generateTripMessage(type, trip, location);
    const results: boolean[] = [];

    for (const phoneNumber of recipients) {
      const whatsappMessage: WhatsAppMessage = {
        to: phoneNumber,
        message,
        type: 'text',
      };

      // Add location data for location updates
      if (type === 'location_update' && location) {
        whatsappMessage.type = 'location';
        whatsappMessage.message = `${message}\n\nUbicación: ${location.latitude}, ${location.longitude}`;
      }

      const result = await this.sendWhatsAppMessage(whatsappMessage);
      results.push(result);

      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  // Generate standardized trip messages
  private generateTripMessage(type: string, trip: Trip, location?: Location): string {
    const driverName = trip.driverName;
    const tripId = trip.id.slice(-6); // Last 6 characters for brevity
    const time = new Date().toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    switch (type) {
      case 'trip_started':
        return `🚐 *VIAJE INICIADO*\n\n` +
               `Conductor: ${driverName}\n` +
               `Viaje: #${tripId}\n` +
               `Hora de inicio: ${time}\n` +
               `${location ? `Ubicación: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : ''}\n\n` +
               `El conductor ha iniciado el viaje según lo programado.`;

      case 'trip_progress':
        return `📍 *ACTUALIZACIÓN DE VIAJE*\n\n` +
               `Conductor: ${driverName}\n` +
               `Viaje: #${tripId}\n` +
               `Hora: ${time}\n` +
               `${location ? `Ubicación actual: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : ''}\n\n` +
               `El viaje está en progreso.`;

      case 'trip_completed':
        const duration = trip.duration ? this.formatDuration(trip.duration) : 'N/A';
        const distance = trip.distance ? `${(trip.distance).toFixed(2)} km` : 'N/A';
        
        return `✅ *VIAJE COMPLETADO*\n\n` +
               `Conductor: ${driverName}\n` +
               `Viaje: #${tripId}\n` +
               `Hora de finalización: ${time}\n` +
               `Duración: ${duration}\n` +
               `Distancia: ${distance}\n` +
               `${location ? `Ubicación final: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : ''}\n\n` +
               `El viaje se ha completado exitosamente.`;

      case 'trip_cancelled':
        return `❌ *VIAJE CANCELADO*\n\n` +
               `Conductor: ${driverName}\n` +
               `Viaje: #${tripId}\n` +
               `Hora de cancelación: ${time}\n` +
               `${trip.notes ? `Motivo: ${trip.notes}` : ''}\n\n` +
               `El viaje ha sido cancelado.`;

      case 'location_update':
        return `📍 *UBICACIÓN ACTUALIZADA*\n\n` +
               `Conductor: ${driverName}\n` +
               `Viaje: #${tripId}\n` +
               `Hora: ${time}\n` +
               `${location ? `Ubicación: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : ''}\n` +
               `${location?.speed ? `Velocidad: ${Math.round(location.speed * 3.6)} km/h` : ''}`;

      default:
        return `📱 *NOTIFICACIÓN DE VIAJE*\n\n` +
               `Conductor: ${driverName}\n` +
               `Viaje: #${tripId}\n` +
               `Hora: ${time}`;
    }
  }

  // Format duration in human readable format
  private formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Send emergency alert
  async sendEmergencyAlert(
    trip: Trip,
    location: Location,
    emergencyType: 'accident' | 'breakdown' | 'security' | 'medical',
    description?: string
  ): Promise<boolean[]> {
    const emergencyMessages = {
      accident: '🚨 *ALERTA DE ACCIDENTE*',
      breakdown: '⚠️ *FALLA MECÁNICA*',
      security: '🔒 *ALERTA DE SEGURIDAD*',
      medical: '🏥 *EMERGENCIA MÉDICA*',
    };

    const message = `${emergencyMessages[emergencyType]}\n\n` +
                   `Conductor: ${trip.driverName}\n` +
                   `Viaje: #${trip.id.slice(-6)}\n` +
                   `Hora: ${new Date().toLocaleTimeString('es-MX', { 
                     hour: '2-digit', 
                     minute: '2-digit' 
                   })}\n` +
                   `Ubicación: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n` +
                   `${description ? `Descripción: ${description}` : ''}\n\n` +
                   `*REQUIERE ATENCIÓN INMEDIATA*`;

    // Send to emergency contacts (this would come from configuration)
    const emergencyContacts = [
      '+52XXXXXXXXXX', // Replace with actual emergency contacts
      // Add more emergency contacts
    ];

    const results: boolean[] = [];
    for (const contact of emergencyContacts) {
      const whatsappMessage: WhatsAppMessage = {
        to: contact,
        message,
        type: 'text',
      };

      const result = await this.sendWhatsAppMessage(whatsappMessage);
      results.push(result);
    }

    return results;
  }

  // Send location sharing message
  async sendLocationShare(
    phoneNumbers: string[],
    location: Location,
    driverName: string,
    customMessage?: string
  ): Promise<boolean[]> {
    const message = customMessage || 
                   `📍 Ubicación compartida por ${driverName}\n` +
                   `Hora: ${new Date().toLocaleTimeString('es-MX', { 
                     hour: '2-digit', 
                     minute: '2-digit' 
                   })}`;

    const results: boolean[] = [];
    for (const phoneNumber of phoneNumbers) {
      const whatsappMessage: WhatsAppMessage = {
        to: phoneNumber,
        message: `${message}\n\nUbicación: ${location.latitude}, ${location.longitude}`,
        type: 'location',
      };

      const result = await this.sendWhatsAppMessage(whatsappMessage);
      results.push(result);
    }

    return results;
  }

  // Send bulk notification to passenger group
  async sendPassengerNotification(
    passengerNumbers: string[],
    message: string,
    trip: Trip
  ): Promise<boolean[]> {
    const formattedMessage = `🚐 *NOTIFICACIÓN DE RUTA*\n\n${message}\n\n` +
                            `Conductor: ${trip.driverName}\n` +
                            `Viaje: #${trip.id.slice(-6)}`;

    const results: boolean[] = [];
    for (const phoneNumber of passengerNumbers) {
      const whatsappMessage: WhatsAppMessage = {
        to: phoneNumber,
        message: formattedMessage,
        type: 'text',
      };

      const result = await this.sendWhatsAppMessage(whatsappMessage);
      results.push(result);

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return results;
  }

  // Test WhatsApp connection
  async testConnection(): Promise<boolean> {
    try {
      const testMessage: WhatsAppMessage = {
        to: '+52XXXXXXXXXX', // Replace with test number
        message: '🧪 Test message from DriverTracker app',
        type: 'text',
      };

      return await this.sendWhatsAppMessage(testMessage);
    } catch (error) {
      console.error('WhatsApp connection test failed:', error);
      return false;
    }
  }

  // Get notification settings (this would typically come from backend/Firebase)
  async getNotificationSettings(driverId: string): Promise<NotificationSettings> {
    // For now, return default settings
    // In production, this would fetch from Firebase or API
    return {
      enabled: true,
      tripStart: true,
      tripProgress: true,
      tripCompletion: true,
      locationUpdates: false, // Only for specific cases
      emergencyAlerts: true,
      recipients: {
        supervisors: ['+52XXXXXXXXXX'], // Replace with actual numbers
        passengers: [], // Would be populated based on trip
        emergency: ['+52XXXXXXXXXX'], // Emergency contacts
      },
    };
  }

  // Update notification settings
  async updateNotificationSettings(
    driverId: string,
    settings: Partial<NotificationSettings>
  ): Promise<boolean> {
    try {
      // In production, this would save to Firebase or API
      console.log('Updating notification settings for driver:', driverId, settings);
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }
}

export default new WhatsAppService();
