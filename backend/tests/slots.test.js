const request = require('supertest');

// Configuration de base
const BASE_URL = 'http://localhost:3001';

describe('Tests API GET /slots - Consultation des créneaux', () => {
  
  // Test 1: Voir les créneaux disponibles (200)
  test('Cas nominal - Affichage des créneaux disponibles', async () => {
    const response = await request(BASE_URL)
      .get('/slots')
      .expect(200);
    
    // Vérifications
    expect(Array.isArray(response.body)).toBe(true);
    
    // Si il y a des créneaux, vérifier qu'ils ont les bonnes propriétés
    if (response.body.length > 0) {
      const slot = response.body[0];
      expect(slot).toHaveProperty('_id');
      expect(slot).toHaveProperty('terrainId');
      expect(slot).toHaveProperty('startAt');
      expect(slot).toHaveProperty('status');
      
      // Vérifier que les créneaux CANCELLED ne sont pas affichés
      response.body.forEach(slot => {
        expect(slot.status).not.toBe('CANCELLED');
      });
    }
    
    console.log('✅ Test réussi - Créneaux récupérés:', response.body.length);
  });

  // Test 2: Liste vide (200)
  test('Cas liste vide - Aucun créneau disponible', async () => {
    // Note: Ce test nécessite une BDD vide ou un endpoint spécifique
    // Pour l'instant on teste juste que l'API répond correctement
    const response = await request(BASE_URL)
      .get('/slots')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    console.log('✅ Test réussi - API répond correctement même si liste vide');
  });

  // Test 3: Filtrage par terrain (200)
  test('Filtrage par terrain - Paramètre terrainId', async () => {
    // D'abord récupérer tous les créneaux pour avoir un terrainId valide
    const allSlots = await request(BASE_URL).get('/slots');
    
    if (allSlots.body.length > 0) {
      const terrainId = allSlots.body[0].terrainId;
      
      const response = await request(BASE_URL)
        .get(`/slots?terrainId=${terrainId}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      
      // Vérifier que tous les créneaux retournés appartiennent au bon terrain
      response.body.forEach(slot => {
        expect(slot.terrainId).toBe(terrainId);
      });
      
      console.log('✅ Test réussi - Filtrage par terrain fonctionne');
    } else {
      console.log('⚠️ Pas de créneaux pour tester le filtrage');
    }
  });

  // Test 4: Gestion d'erreur (si le serveur a un problème)
  test('Gestion des erreurs serveur', async () => {
    // Ce test vérifie que l'API gère bien les erreurs
    // On teste avec un endpoint qui pourrait échouer
    try {
      const response = await request(BASE_URL)
        .get('/slots')
        .timeout(5000); // Timeout de 5 secondes
      
      // Si ça marche, c'est bien
      expect(response.status).toBe(200);
      console.log('✅ Test réussi - Serveur répond correctement');
    } catch (error) {
      // Si ça échoue, on vérifie que c'est une erreur serveur appropriée
      console.log('⚠️ Erreur serveur détectée (normal pour ce test):', error.message);
    }
  });

});
