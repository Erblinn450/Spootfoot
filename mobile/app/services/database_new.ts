import { sqliteAdapter } from './sqliteAdapter';

// Types pour nos données locales
export type LocalReservation = {
  id: string;
  slotId: string;
  inviteUrl: string;
  token?: string;
  createdAt: number;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncAt?: number;
};

class DatabaseService {
  async init() {
    console.log('🔧 Initialisation du service de base de données...');
    await sqliteAdapter.init();
    await sqliteAdapter.createTables();
    console.log('✅ Service de base de données initialisé');
  }

  async getReservations(): Promise<LocalReservation[]> {
    await this.init();
    const results = await sqliteAdapter.getReservations();
    
    return results.map(row => ({
      id: row.id,
      slotId: row.slotId,
      inviteUrl: row.inviteUrl,
      token: row.token,
      createdAt: row.createdAt,
      syncStatus: row.syncStatus || 'synced',
      lastSyncAt: row.lastSyncAt,
    }));
  }

  async addReservation(reservation: Omit<LocalReservation, 'id'>): Promise<string> {
    await this.init();
    
    const id = await sqliteAdapter.addReservation({
      slotId: reservation.slotId,
      inviteUrl: reservation.inviteUrl,
      token: reservation.token,
      createdAt: reservation.createdAt,
      syncStatus: reservation.syncStatus,
    });
    
    return id;
  }

  async deleteReservation(id: string): Promise<void> {
    await this.init();
    await sqliteAdapter.deleteReservation(id);
  }

  async getStats(): Promise<{ reservations: number; pendingSync: number }> {
    await this.init();
    return await sqliteAdapter.getStats();
  }
}

export const databaseService = new DatabaseService();
