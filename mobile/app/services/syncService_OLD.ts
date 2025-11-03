import { databaseService, LocalReservation, SyncAction } from './database';
import { apiClient } from '../utils/apiClient';
import NetInfo from '@react-native-community/netinfo';

class SyncService {
  private isOnline = true;
  private syncInProgress = false;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      console.log(`📶 Connexion: ${this.isOnline ? 'EN LIGNE' : 'HORS LIGNE'}`);
      
      // Si on revient en ligne, synchroniser automatiquement
      if (wasOffline && this.isOnline) {
        console.log('🔄 Retour en ligne - Synchronisation automatique');
        this.syncAll();
      }
    });
  }

  async createReservation(slotId: string, organizerEmail: string): Promise<LocalReservation> {
    console.log('🔄 SyncService.createReservation début:', { slotId, organizerEmail, isOnline: this.isOnline });
    
    const reservation: Omit<LocalReservation, 'id'> = {
      slotId,
      inviteUrl: '', // Sera rempli après sync
      token: undefined,
      createdAt: Date.now(),
      syncStatus: this.isOnline ? 'pending' : 'pending',
    };

    console.log('💾 Sauvegarde en local...');
    // Sauvegarder en local immédiatement
    const localId = await databaseService.addReservation(reservation);
    console.log('✅ Sauvegardé avec ID:', localId);
    
    if (this.isOnline) {
      // Essayer de synchroniser immédiatement
      try {
        const response = await apiClient.post('/reservations', {
          slotId,
          organizerEmail,
        });

        // Mettre à jour avec les données du serveur
        const updatedReservation: LocalReservation = {
          id: localId,
          slotId,
          inviteUrl: response.data?.inviteUrl || '',
          token: this.extractToken(response.data?.inviteUrl || ''),
          createdAt: reservation.createdAt,
          syncStatus: 'synced',
          lastSyncAt: Date.now(),
        };

        await databaseService.updateReservationSyncStatus(localId, 'synced');
        
        console.log('✅ Réservation créée et synchronisée');
        return updatedReservation;
      } catch (error) {
        console.log('❌ Erreur sync immédiate, ajout à la queue');
        
        // Ajouter à la queue de synchronisation
        await databaseService.addSyncAction({
          type: 'CREATE_RESERVATION',
          data: { localId, slotId, organizerEmail },
          createdAt: Date.now(),
          attempts: 0,
          status: 'pending',
        });

        await databaseService.updateReservationSyncStatus(localId, 'failed');
        throw error;
      }
    } else {
      // Mode hors-ligne : ajouter à la queue
      console.log('📴 Mode hors-ligne - Ajout à la queue');
      
      await databaseService.addSyncAction({
        type: 'CREATE_RESERVATION',
        data: { localId, slotId, organizerEmail },
        createdAt: Date.now(),
        attempts: 0,
        status: 'pending',
      });

      return {
        id: localId,
        ...reservation,
      };
    }
  }

  async syncAll(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      console.log('🔄 Sync déjà en cours ou hors ligne');
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Début de la synchronisation...');

    try {
      // 1. Traiter la queue des actions en attente
      await this.processSyncQueue();
      
      // 2. Synchroniser les réservations depuis le serveur
      await this.syncReservationsFromServer();
      
      // 3. Nettoyer les actions terminées
      await databaseService.clearCompletedSyncActions();
      
      console.log('✅ Synchronisation terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncQueue(): Promise<void> {
    const pendingActions = await databaseService.getPendingSyncActions();
    
    console.log(`📋 ${pendingActions.length} actions en attente`);

    for (const action of pendingActions) {
      try {
        await this.processAction(action);
        await databaseService.updateSyncActionStatus(action.id, 'completed');
      } catch (error) {
        console.error(`❌ Erreur action ${action.id}:`, error);
        
        // Marquer comme échoué après 3 tentatives
        if (action.attempts >= 2) {
          await databaseService.updateSyncActionStatus(action.id, 'failed');
        } else {
          await databaseService.updateSyncActionStatus(action.id, 'pending', true);
        }
      }
    }
  }

  private async processAction(action: SyncAction): Promise<void> {
    switch (action.type) {
      case 'CREATE_RESERVATION':
        await this.syncCreateReservation(action.data);
        break;
      case 'UPDATE_RESERVATION':
        await this.syncUpdateReservation(action.data);
        break;
      case 'DELETE_RESERVATION':
        await this.syncDeleteReservation(action.data);
        break;
      default:
        console.warn('Type d\'action inconnu:', action.type);
    }
  }

  private async syncCreateReservation(data: any): Promise<void> {
    const { localId, slotId, organizerEmail } = data;
    
    const response = await apiClient.post('/reservations', {
      slotId,
      organizerEmail,
    });

    // Mettre à jour la réservation locale avec les données du serveur
    await databaseService.updateReservationSyncStatus(localId, 'synced');
    
    console.log(`✅ Réservation ${localId} synchronisée`);
  }

  private async syncUpdateReservation(data: any): Promise<void> {
    // À implémenter si nécessaire
    console.log('🔄 Sync update reservation:', data);
  }

  private async syncDeleteReservation(data: any): Promise<void> {
    // À implémenter si nécessaire
    console.log('🔄 Sync delete reservation:', data);
  }

  private async syncReservationsFromServer(): Promise<void> {
    try {
      // Note: Il faudrait un endpoint pour récupérer les réservations de l'utilisateur
      // Pour l'instant on garde les données locales
      console.log('📥 Sync depuis serveur (à implémenter)');
    } catch (error) {
      console.error('❌ Erreur sync depuis serveur:', error);
    }
  }

  private extractToken(inviteUrl: string): string | undefined {
    const match = inviteUrl.match(/\/(?:invitations|invite|i)\/([^/?#]+)/);
    return match?.[1];
  }

  // Utilitaires publics
  async getLocalReservations(): Promise<LocalReservation[]> {
    return await databaseService.getReservations();
  }

  async getSyncStats() {
    const stats = await databaseService.getStats();
    return {
      ...stats,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  async forceSyncAll(): Promise<void> {
    if (this.isOnline) {
      await this.syncAll();
    } else {
      throw new Error('Impossible de synchroniser hors ligne');
    }
  }

  async clearAllLocalData(): Promise<void> {
    await databaseService.clearAllData();
    console.log('🗑️ Toutes les données locales supprimées');
  }
}

export const syncService = new SyncService();
