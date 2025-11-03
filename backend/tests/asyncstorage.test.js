/**
 * Tests pour AsyncStorage et mode hors ligne
 * Note: Ces tests simulent le comportement d'AsyncStorage côté mobile
 */

describe('Tests AsyncStorage - Mode hors ligne', () => {
  
  // Mock d'AsyncStorage pour les tests
  const mockAsyncStorage = {
    storage: {},
    
    async getItem(key) {
      return this.storage[key] || null;
    },
    
    async setItem(key, value) {
      this.storage[key] = value;
    },
    
    async removeItem(key) {
      delete this.storage[key];
    },
    
    clear() {
      this.storage = {};
    }
  };

  // Simulation du service database
  class MockDatabaseService {
    constructor(asyncStorage) {
      this.asyncStorage = asyncStorage;
    }

    async getReservations() {
      const raw = await this.asyncStorage.getItem('reservations');
      return raw ? JSON.parse(raw) : [];
    }

    async addReservation(reservation) {
      const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const existing = await this.getReservations();
      const newReservation = { id, ...reservation };
      existing.unshift(newReservation);
      
      await this.asyncStorage.setItem('reservations', JSON.stringify(existing));
      return id;
    }

    async deleteReservation(id) {
      const existing = await this.getReservations();
      const filtered = existing.filter(r => r.id !== id);
      await this.asyncStorage.setItem('reservations', JSON.stringify(filtered));
    }

    async getPendingReservations() {
      const raw = await this.asyncStorage.getItem('pending_reservations');
      return raw ? JSON.parse(raw) : [];
    }

    async addPendingReservation(reservation) {
      const existing = await this.getPendingReservations();
      existing.push(reservation);
      await this.asyncStorage.setItem('pending_reservations', JSON.stringify(existing));
    }
  }

  let databaseService;

  beforeEach(() => {
    mockAsyncStorage.clear();
    databaseService = new MockDatabaseService(mockAsyncStorage);
  });

  // Test 1: Sauvegarde locale hors ligne
  test('Mode hors ligne - Sauvegarde dans AsyncStorage', async () => {
    const reservation = {
      slotId: 'test_slot_123',
      inviteUrl: 'http://localhost:8084/i/test123',
      token: 'test123',
      createdAt: Date.now(),
      syncStatus: 'pending'
    };

    // Simuler une réservation hors ligne
    await databaseService.addPendingReservation(reservation);

    // Vérifier que c'est bien sauvé dans pending_reservations
    const pending = await databaseService.getPendingReservations();
    expect(pending).toHaveLength(1);
    expect(pending[0].slotId).toBe('test_slot_123');
    expect(pending[0].syncStatus).toBe('pending');

    console.log('✅ Test réussi - Réservation sauvée en mode hors ligne');
  });

  // Test 2: Réservation normale (avec connexion)
  test('Mode en ligne - Sauvegarde dans reservations', async () => {
    const reservation = {
      slotId: 'test_slot_456',
      inviteUrl: 'http://localhost:8084/i/test456',
      token: 'test456',
      createdAt: Date.now(),
      syncStatus: 'synced'
    };

    // Simuler une réservation en ligne
    const id = await databaseService.addReservation(reservation);

    // Vérifier que c'est bien sauvé dans reservations
    const reservations = await databaseService.getReservations();
    expect(reservations).toHaveLength(1);
    expect(reservations[0].slotId).toBe('test_slot_456');
    expect(reservations[0].syncStatus).toBe('synced');
    expect(reservations[0].id).toBe(id);

    console.log('✅ Test réussi - Réservation sauvée en mode en ligne');
  });

  // Test 3: Synchronisation (pending vers reservations)
  test('Synchronisation - Transfer pending vers reservations', async () => {
    // 1. Ajouter une réservation pending
    const pendingReservation = {
      slotId: 'test_slot_sync',
      inviteUrl: 'http://localhost:8084/i/sync',
      token: 'sync123',
      createdAt: Date.now(),
      syncStatus: 'pending'
    };
    
    await databaseService.addPendingReservation(pendingReservation);

    // 2. Simuler la synchronisation réussie
    const pending = await databaseService.getPendingReservations();
    expect(pending).toHaveLength(1);

    // Transférer vers reservations
    const syncedReservation = { ...pending[0], syncStatus: 'synced' };
    await databaseService.addReservation(syncedReservation);

    // Nettoyer pending_reservations
    await mockAsyncStorage.setItem('pending_reservations', JSON.stringify([]));

    // 3. Vérifier le résultat
    const finalReservations = await databaseService.getReservations();
    const finalPending = await databaseService.getPendingReservations();

    expect(finalReservations).toHaveLength(1);
    expect(finalPending).toHaveLength(0);
    expect(finalReservations[0].syncStatus).toBe('synced');

    console.log('✅ Test réussi - Synchronisation pending → reservations');
  });

  // Test 4: Suppression d'une réservation
  test('Suppression - Retrait d\'AsyncStorage', async () => {
    // Ajouter une réservation
    const reservation = {
      slotId: 'test_slot_delete',
      inviteUrl: 'http://localhost:8084/i/delete',
      token: 'delete123',
      createdAt: Date.now(),
      syncStatus: 'synced'
    };

    const id = await databaseService.addReservation(reservation);
    
    // Vérifier qu'elle existe
    let reservations = await databaseService.getReservations();
    expect(reservations).toHaveLength(1);

    // La supprimer
    await databaseService.deleteReservation(id);

    // Vérifier qu'elle n'existe plus
    reservations = await databaseService.getReservations();
    expect(reservations).toHaveLength(0);

    console.log('✅ Test réussi - Suppression de réservation');
  });

  // Test 5: Gestion des données vides
  test('Cas limite - AsyncStorage vide', async () => {
    // Tester avec un AsyncStorage vide
    const reservations = await databaseService.getReservations();
    const pending = await databaseService.getPendingReservations();

    expect(reservations).toEqual([]);
    expect(pending).toEqual([]);

    console.log('✅ Test réussi - Gestion AsyncStorage vide');
  });

});
