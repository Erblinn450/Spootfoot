import * as SQLite from 'expo-sqlite';

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

export type SyncAction = {
  id: string;
  type: 'CREATE_RESERVATION' | 'UPDATE_RESERVATION' | 'DELETE_RESERVATION';
  data: any;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'completed' | 'failed';
};

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (this.db) return this.db;
    
    this.db = await SQLite.openDatabaseAsync('spotfoot.db');
    await this.createTables();
    return this.db;
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Table des réservations locales
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        slotId TEXT NOT NULL,
        inviteUrl TEXT NOT NULL,
        token TEXT,
        createdAt INTEGER NOT NULL,
        syncStatus TEXT DEFAULT 'synced',
        lastSyncAt INTEGER
      );
    `);

    // Table des actions à synchroniser (queue hors-ligne)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
      );
    `);

    console.log('✅ Tables SQLite créées');
  }

  // CRUD Réservations
  async getReservations(): Promise<LocalReservation[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(
      'SELECT * FROM reservations ORDER BY createdAt DESC'
    );
    
    return result.map((row: any) => ({
      id: row.id as string,
      slotId: row.slotId as string,
      inviteUrl: row.inviteUrl as string,
      token: row.token as string,
      createdAt: row.createdAt as number,
      syncStatus: row.syncStatus as 'synced' | 'pending' | 'failed',
      lastSyncAt: row.lastSyncAt as number,
    }));
  }

  async addReservation(reservation: Omit<LocalReservation, 'id'>): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db!.runAsync(
      `INSERT INTO reservations (id, slotId, inviteUrl, token, createdAt, syncStatus, lastSyncAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, reservation.slotId, reservation.inviteUrl, reservation.token || null, 
       reservation.createdAt, reservation.syncStatus, reservation.lastSyncAt || null]
    );
    
    return id;
  }

  async updateReservationSyncStatus(id: string, status: 'synced' | 'pending' | 'failed') {
    if (!this.db) await this.init();
    
    await this.db!.runAsync(
      'UPDATE reservations SET syncStatus = ?, lastSyncAt = ? WHERE id = ?',
      [status, Date.now(), id]
    );
  }

  async deleteReservation(id: string) {
    if (!this.db) await this.init();
    
    await this.db!.runAsync('DELETE FROM reservations WHERE id = ?', [id]);
  }

  // CRUD Queue de synchronisation
  async addSyncAction(action: Omit<SyncAction, 'id'>): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db!.runAsync(
      `INSERT INTO sync_queue (id, type, data, createdAt, attempts, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, action.type, JSON.stringify(action.data), action.createdAt, action.attempts, action.status]
    );
    
    return id;
  }

  async getPendingSyncActions(): Promise<SyncAction[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(
      'SELECT * FROM sync_queue WHERE status = "pending" ORDER BY createdAt ASC'
    );
    
    return result.map((row: any) => ({
      id: row.id as string,
      type: row.type as SyncAction['type'],
      data: JSON.parse(row.data as string),
      createdAt: row.createdAt as number,
      attempts: row.attempts as number,
      status: row.status as 'pending' | 'completed' | 'failed',
    }));
  }

  async updateSyncActionStatus(id: string, status: 'completed' | 'failed' | 'pending', incrementAttempts = false) {
    if (!this.db) await this.init();
    
    if (incrementAttempts) {
      await this.db!.runAsync(
        'UPDATE sync_queue SET status = ?, attempts = attempts + 1 WHERE id = ?',
        [status, id]
      );
    } else {
      await this.db!.runAsync(
        'UPDATE sync_queue SET status = ? WHERE id = ?',
        [status, id]
      );
    }
  }

  async clearCompletedSyncActions() {
    if (!this.db) await this.init();
    
    await this.db!.runAsync('DELETE FROM sync_queue WHERE status = "completed"');
  }

  // Utilitaires
  async clearAllData() {
    if (!this.db) await this.init();
    
    await this.db!.runAsync('DELETE FROM reservations');
    await this.db!.runAsync('DELETE FROM sync_queue');
  }

  async getStats() {
    if (!this.db) await this.init();
    
    const reservationsCount = await this.db!.getFirstAsync('SELECT COUNT(*) as count FROM reservations');
    const pendingSync = await this.db!.getFirstAsync('SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"');
    
    return {
      reservations: (reservationsCount as any)?.count || 0,
      pendingSync: (pendingSync as any)?.count || 0,
    };
  }
}

export const databaseService = new DatabaseService();
