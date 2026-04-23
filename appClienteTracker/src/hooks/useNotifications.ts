import { useState, useCallback, useEffect } from 'react';
import { NotificationRepository } from '../infrastructure/NotificationRepository';
import { Announcement } from '../domain/Notification';
import { useAuth } from './useAuth';
import { config } from '../config/environment';

export function useNotifications() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const companyId = user?.companyId;

    const fetchAnnouncements = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await NotificationRepository.getNotifications(companyId ?? undefined);
            
            const mapped: Announcement[] = data.map((item: any) => {
                let type: 'info' | 'warning' | 'success' = 'info';
                if (item.type === 'ALERT' || item.type === 'WARNING') type = 'warning';
                if (item.type === 'SUCCESS') type = 'success';
                
                // Format the createdAt date
                const dateRaw = item.createdAt ? new Date(item.createdAt) : new Date();
                const diffTime = Math.abs(new Date().getTime() - dateRaw.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                let dateStr = dateRaw.toLocaleDateString(config.i18n.locale);
                if (diffDays <= 1) dateStr = 'Hoy';
                else if (diffDays === 2) dateStr = 'Ayer';
                else if (diffDays < 7) dateStr = `Hace ${diffDays} días`;

                return {
                    id: item.id?.toString() || Math.random().toString(),
                    title: item.title,
                    description: item.message,
                    date: dateStr,
                    type,
                };
            });
            
            setAnnouncements(mapped);
        } catch (e: any) {
            if (__DEV__) console.warn('Failed to load announcements', e);
            setError(e?.message || 'No se pudieron cargar los avisos.');
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    return { announcements, isLoading, error, fetchAnnouncements, refresh: fetchAnnouncements };
}
