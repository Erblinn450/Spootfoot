// Service de synchronisation pour AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

class SyncService {
  async syncPendingReservations() {
    try {
      const pendingRaw = await AsyncStorage.getItem('pending_reservations');
      if (!pendingRaw) return { success: [], failed: [] };
      
      const pending = JSON.parse(pendingRaw);
      if (pending.length === 0) return { success: [], failed: [] };

      console.log('📤 Synchronisation de', pending.length, 'réservation(s) en attente...');
      
      const results: any = { success: [], failed: [] };
      
      for (const reservation of pending) {
        try {
          const response = await fetch(`${BASE_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              slotId: reservation.slotId, 
              organizerEmail: reservation.email 
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            const existingRaw = await AsyncStorage.getItem('reservations');
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            const m = String(data.inviteUrl).match(/\/i\/(.+)$/) || String(data.inviteUrl).match(/invitations\/(.+)$/) || String(data.inviteUrl).match(/invite\/(.+)$/);
            const token = m?.[1];
            
            existing.unshift({ 
              slotId: reservation.slotId, 
              inviteUrl: data.inviteUrl, 
              token, 
              createdAt: Date.now() 
            });
            await AsyncStorage.setItem('reservations', JSON.stringify(existing));
            
            results.success.push(reservation);
            console.log('✅ Réservation synchronisée:', reservation.slotId);
          } else {
            results.failed.push({ reservation, error: `HTTP ${response.status}` });
            console.error('❌ Échec sync réservation:', response.status);
          }
        } catch (error: any) {
          results.failed.push({ reservation, error: error.message });
          console.error('❌ Erreur sync réservation:', error);
        }
      }
      
      if (results.success.length > 0) {
        const remaining = pending.filter((p: any) => 
          !results.success.some((s: any) => s.slotId === p.slotId)
        );
        
        if (remaining.length === 0) {
          await AsyncStorage.removeItem('pending_reservations');
        } else {
          await AsyncStorage.setItem('pending_reservations', JSON.stringify(remaining));
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      return { success: [], failed: [] };
    }
  }
  
  async addPendingReservation(reservation: any) {
    try {
      const existingRaw = await AsyncStorage.getItem('pending_reservations');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.push(reservation);
      await AsyncStorage.setItem('pending_reservations', JSON.stringify(existing));
      console.log('📝 Réservation ajoutée en attente:', reservation.slotId);
    } catch (error) {
      console.error('❌ Erreur ajout réservation en attente:', error);
    }
  }
  
  async getPendingCount(): Promise<number> {
    try {
      const pendingRaw = await AsyncStorage.getItem('pending_reservations');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
      return pending.length;
    } catch (error) {
      return 0;
    }
  }
}

export const syncService = new SyncService();
