// Adaptateur SQLite universel : expo-sqlite (mobile) + sql.js (web)
import { Platform } from 'react-native';

// Types
export interface SQLiteDatabase {
  exec(sql: string): void;
  run(sql: string, params?: any[]): void;
  get(sql: string, params?: any[]): any;
  all(sql: string, params?: any[]): any[];
  close(): void;
}

class SQLiteAdapter {
  private db: any = null;
  private isWeb = Platform.OS === 'web';
  private isInitialized = false;

  async init(): Promise<SQLiteDatabase> {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    if (this.isWeb) {
      // Mode Web : utiliser SQL.js
      console.log('🌐 Initialisation SQL.js (SQLite pour le web)');
      await this.initWebSQLite();
    } else {
      // Mode Mobile : utiliser expo-sqlite
      console.log('📱 Initialisation expo-sqlite (SQLite natif)');
      await this.initMobileSQLite();
    }

    this.isInitialized = true;
    return this.db;
  }

  private async initWebSQLite() {
    try {
      // Importer SQL.js dynamiquement
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({
        // Chemin vers le fichier wasm (sera copié par le bundler)
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Créer une nouvelle base de données en mémoire
      const sqliteDB = new SQL.Database();

      // Créer l'adaptateur
      this.db = {
        exec: (sql: string) => {
          console.log('🔍 SQL.js exec:', sql);
          sqliteDB.exec(sql);
        },

        run: (sql: string, params: any[] = []) => {
          console.log('🔍 SQL.js run:', sql, params);
          const stmt = sqliteDB.prepare(sql);
          const result = stmt.run(params);
          stmt.free();
          return result;
        },

        get: (sql: string, params: any[] = []) => {
          console.log('🔍 SQL.js get:', sql, params);
          const stmt = sqliteDB.prepare(sql);
          const result = stmt.getAsObject(params);
          stmt.free();
          return result;
        },

        all: (sql: string, params: any[] = []) => {
          console.log('🔍 SQL.js all:', sql, params);
          const stmt = sqliteDB.prepare(sql);
          const results: any[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        },

        close: () => {
          sqliteDB.close();
        }
      };

      console.log('✅ SQL.js initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation SQL.js:', error);
      throw error;
    }
  }

  private async initMobileSQLite() {
    try {
      // Importer expo-sqlite dynamiquement
      const SQLite = await import('expo-sqlite');
      const sqliteDB = await SQLite.openDatabaseAsync('spotfoot.db');

      // Créer l'adaptateur
      this.db = {
        exec: async (sql: string) => {
          console.log('🔍 expo-sqlite exec:', sql);
          await sqliteDB.execAsync(sql);
        },

        run: async (sql: string, params: any[] = []) => {
          console.log('🔍 expo-sqlite run:', sql, params);
          return await sqliteDB.runAsync(sql, params);
        },

        get: async (sql: string, params: any[] = []) => {
          console.log('🔍 expo-sqlite get:', sql, params);
          return await sqliteDB.getFirstAsync(sql, params);
        },

        all: async (sql: string, params: any[] = []) => {
          console.log('🔍 expo-sqlite all:', sql, params);
          return await sqliteDB.getAllAsync(sql, params);
        },

        close: async () => {
          await sqliteDB.closeAsync();
        }
      };

      console.log('✅ expo-sqlite initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation expo-sqlite:', error);
      throw error;
    }
  }

  async createTables() {
    if (!this.db) await this.init();

    const createReservationsTable = `
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        slotId TEXT NOT NULL,
        inviteUrl TEXT NOT NULL,
        token TEXT,
        createdAt INTEGER NOT NULL,
        syncStatus TEXT DEFAULT 'synced',
        lastSyncAt INTEGER
      );
    `;

    const createSyncActionsTable = `
      CREATE TABLE IF NOT EXISTS sync_actions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
      );
    `;

    await this.db.exec(createReservationsTable);
    await this.db.exec(createSyncActionsTable);

    console.log('✅ Tables SQLite créées');
  }

  async addReservation(reservation: {
    slotId: string;
    inviteUrl: string;
    token?: string;
    createdAt: number;
    syncStatus: string;
  }): Promise<string> {
    if (!this.db) await this.init();

    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sql = `
      INSERT INTO reservations (id, slotId, inviteUrl, token, createdAt, syncStatus, lastSyncAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      reservation.slotId,
      reservation.inviteUrl,
      reservation.token || null,
      reservation.createdAt,
      reservation.syncStatus,
      Date.now()
    ];

    await this.db.run(sql, params);
    console.log('✅ Réservation ajoutée dans SQLite:', id);
    
    return id;
  }

  async getReservations(): Promise<any[]> {
    if (!this.db) await this.init();

    const sql = 'SELECT * FROM reservations ORDER BY createdAt DESC';
    const results = await this.db.all(sql);
    
    console.log('✅ Réservations récupérées:', results.length);
    return results;
  }

  async deleteReservation(id: string): Promise<void> {
    if (!this.db) await this.init();

    const sql = 'DELETE FROM reservations WHERE id = ?';
    await this.db.run(sql, [id]);
    
    console.log('✅ Réservation supprimée:', id);
  }

  async getStats(): Promise<{ reservations: number; pendingSync: number }> {
    if (!this.db) await this.init();

    const countSQL = 'SELECT COUNT(*) as count FROM reservations';
    const result = await this.db.get(countSQL);
    
    return {
      reservations: result?.count || 0,
      pendingSync: 0
    };
  }
}

export const sqliteAdapter = new SQLiteAdapter();
