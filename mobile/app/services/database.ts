import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour nos données locales
export type LocalReservation = {
  id: string;
  slotId: string;
  inviteUrl: string;
  token?: string;
  createdAt: number;
  syncStatus: 'synced' | 'pending' | 'failed';
};

class DatabaseService {
  async init() {
    console.log('🔧 Initialisation AsyncStorage...');
    console.log('✅ AsyncStorage prêt');
  }

  async getReservations(): Promise<LocalReservation[]> {
    const raw = await AsyncStorage.getItem('reservations');
    const reservations = raw ? JSON.parse(raw) : [];
    console.log('📦 Réservations chargées:', reservations.length);
    return reservations;
  }

  async addReservation(reservation: Omit<LocalReservation, 'id'>): Promise<string> {
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const existing = await this.getReservations();
    const newReservation = { id, ...reservation };
    existing.unshift(newReservation);
    
    await AsyncStorage.setItem('reservations', JSON.stringify(existing));
    console.log('✅ Réservation ajoutée:', id);
    
    return id;
  }

  async deleteReservation(id: string): Promise<void> {
    const existing = await this.getReservations();
    const filtered = existing.filter(r => r.id !== id);
    
    await AsyncStorage.setItem('reservations', JSON.stringify(filtered));
    console.log('🗑️ Réservation supprimée:', id);
  }

  async getStats(): Promise<{ reservations: number; pendingSync: number }> {
    const reservations = await this.getReservations();
    return {
      reservations: reservations.length,
      pendingSync: 0,
    };
  }
}

export const databaseService = new DatabaseService();
