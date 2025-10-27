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
    console.log('═══════════════════════════════════════');
    console.log('🔧 INITIALISATION DE LA BASE DE DONNÉES LOCALE');
    console.log('📱 Technologie utilisée: AsyncStorage (React Native)');
    console.log('✅ AsyncStorage prêt pour stockage local');
    console.log('═══════════════════════════════════════');
  }

  async getReservations(): Promise<LocalReservation[]> {
    console.log('📖 Lecture depuis AsyncStorage (clé: "reservations")');
    const raw = await AsyncStorage.getItem('reservations');
    const reservations = raw ? JSON.parse(raw) : [];
    console.log('📦 Nombre de réservations en BDD locale:', reservations.length);
    if (reservations.length > 0) {
      console.log('📋 Contenu de la BDD locale:', reservations);
    }
    return reservations;
  }

  async addReservation(reservation: Omit<LocalReservation, 'id'>): Promise<string> {
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('💾 SAUVEGARDE dans AsyncStorage...');
    const existing = await this.getReservations();
    const newReservation = { id, ...reservation };
    existing.unshift(newReservation);
    
    await AsyncStorage.setItem('reservations', JSON.stringify(existing));
    console.log('✅ Réservation sauvegardée en BDD locale (AsyncStorage)');
    console.log('🔑 ID généré:', id);
    console.log('📊 Total réservations en BDD locale:', existing.length);
    
    return id;
  }

  async deleteReservation(id: string): Promise<void> {
    console.log('🗑️ Suppression depuis AsyncStorage...');
    const existing = await this.getReservations();
    const filtered = existing.filter(r => r.id !== id);
    
    await AsyncStorage.setItem('reservations', JSON.stringify(filtered));
    console.log('✅ Réservation supprimée de la BDD locale:', id);
    console.log('📊 Réservations restantes:', filtered.length);
  }

  async getStats(): Promise<{ reservations: number; pendingSync: number }> {
    const reservations = await this.getReservations();
    return {
      reservations: reservations.length,
      pendingSync: 0,
    };
  }

  // Fonction pour afficher TOUT le contenu d'AsyncStorage (pour la démo)
  async showAllData() {
    console.log('═══════════════════════════════════════');
    console.log('📊 CONTENU COMPLET DE LA BDD LOCALE (AsyncStorage)');
    console.log('═══════════════════════════════════════');
    
    try {
      // Réservations confirmées
      const reservationsRaw = await AsyncStorage.getItem('reservations');
      const reservations = reservationsRaw ? JSON.parse(reservationsRaw) : [];
      console.log('✅ Réservations confirmées:', reservations.length);
      if (reservations.length > 0) {
        console.table(reservations);
      }
      
      // Réservations en attente (mode hors ligne)
      const pendingRaw = await AsyncStorage.getItem('pending_reservations');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
      console.log('⏳ Réservations en attente de synchronisation:', pending.length);
      if (pending.length > 0) {
        console.table(pending);
      }
      
      console.log('═══════════════════════════════════════');
      console.log('📱 Technologie: AsyncStorage (React Native)');
      console.log('💾 Persistance: Données sauvegardées localement');
      console.log('🔄 Synchronisation: Automatique à la reconnexion');
      console.log('═══════════════════════════════════════');
    } catch (error) {
      console.error('❌ Erreur lecture AsyncStorage:', error);
    }
  }
}

export const databaseService = new DatabaseService();
