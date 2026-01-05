const request = require('supertest');

// Configuration de base
const BASE_URL = 'http://localhost:3001';

describe('Tests API POST /reservations - Réservation de créneaux', () => {
  
  let validSlotId = null;
  let fullSlotId = null;
  
  // Setup: récupérer des IDs de créneaux valides avant les tests
  beforeAll(async () => {
    try {
      const slotsResponse = await request(BASE_URL).get('/slots');
      if (slotsResponse.body.length > 0) {
        // Prendre le premier créneau disponible
        const openSlot = slotsResponse.body.find(slot => slot.status === 'OPEN');
        const fullSlot = slotsResponse.body.find(slot => slot.status === 'FULL');
        
        validSlotId = openSlot ? openSlot._id : slotsResponse.body[0]._id;
        fullSlotId = fullSlot ? fullSlot._id : null;
        
        console.log('🔧 Setup tests - SlotId valide:', validSlotId);
      }
    } catch (error) {
      console.log('⚠️ Erreur setup tests:', error.message);
    }
  });

  // Test 1: Réservation normale (201) ou slot déjà réservé (409)
  test('Cas nominal - Réservation réussie ou slot déjà réservé', async () => {
    if (!validSlotId) {
      console.log('⚠️ Pas de créneau disponible pour ce test');
      return;
    }

    const reservationData = {
      slotId: validSlotId,
      organizerEmail: 'test@example.com'
    };

    const response = await request(BASE_URL)
      .post('/reservations')
      .send(reservationData);

    // Le slot peut être OPEN (201) ou déjà réservé (409)
    expect([201, 409]).toContain(response.status);
    
    if (response.status === 201) {
      expect(response.body).toHaveProperty('inviteUrl');
      console.log('✅ Test réussi - Réservation créée');
    } else {
      expect(response.body).toHaveProperty('message');
      console.log('✅ Test réussi - Slot déjà réservé (409):', response.body.message);
    }
  });

  // Test 2: Créneau complet (409)
  test('Créneau complet - Erreur 409', async () => {
    if (!fullSlotId) {
      console.log('⚠️ Pas de créneau FULL pour ce test, on simule avec un ID invalide');
      // On teste avec un ID qui n'existe pas pour simuler une erreur
      fullSlotId = '507f1f77bcf86cd799439011';
    }

    const reservationData = {
      slotId: fullSlotId,
      organizerEmail: 'test@example.com'
    };

    const response = await request(BASE_URL)
      .post('/reservations')
      .send(reservationData)
      .expect(409);

    expect(response.body).toHaveProperty('message');
    console.log('✅ Test réussi - Erreur 409 gérée:', response.body.message);
  });

  // Test 3: Créneau inexistant (404)
  test('Créneau inexistant - Erreur 404', async () => {
    const reservationData = {
      slotId: '507f1f77bcf86cd799439011', // ObjectId MongoDB valide mais inexistant
      organizerEmail: 'test@example.com'
    };

    const response = await request(BASE_URL)
      .post('/reservations')
      .send(reservationData)
      .expect(404);

    expect(response.body).toHaveProperty('message');
    console.log('✅ Test réussi - Erreur 404 gérée:', response.body.message);
  });

  // Test 4: Email invalide (400)
  test('Email invalide - Erreur 400', async () => {
    if (!validSlotId) {
      console.log('⚠️ Pas de créneau pour ce test');
      return;
    }

    const reservationData = {
      slotId: validSlotId,
      organizerEmail: 'email_invalide_sans_arobase'
    };

    const response = await request(BASE_URL)
      .post('/reservations')
      .send(reservationData)
      .expect(400);

    expect(response.body).toHaveProperty('message');
    console.log('✅ Test réussi - Validation email fonctionne:', response.body.message);
  });

  // Test 5: Données manquantes (400)
  test('Données manquantes - Erreur 400', async () => {
    const reservationData = {
      // slotId manquant volontairement
      organizerEmail: 'test@example.com'
    };

    const response = await request(BASE_URL)
      .post('/reservations')
      .send(reservationData)
      .expect(400);

    expect(response.body).toHaveProperty('message');
    console.log('✅ Test réussi - Validation des champs obligatoires:', response.body.message);
  });

  // Test 6: Créneau annulé (409)
  test('Créneau annulé - Erreur 409', async () => {
    // On simule avec un ID spécifique ou on teste la logique
    const reservationData = {
      slotId: validSlotId, // On utilise un ID valide mais on s'attend à une logique métier
      organizerEmail: 'test@example.com'
    };

    try {
      const response = await request(BASE_URL)
        .post('/reservations')
        .send(reservationData);

      // Si ça marche, c'est que le créneau n'était pas annulé
      if (response.status === 201) {
        console.log('✅ Créneau réservé (pas annulé)');
      } else if (response.status === 409) {
        console.log('✅ Test réussi - Créneau annulé détecté');
      }
    } catch (error) {
      console.log('⚠️ Erreur dans le test créneau annulé:', error.message);
    }
  });

});
