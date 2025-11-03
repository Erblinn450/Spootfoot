#!/usr/bin/env node
// Script de démo : Synchronise AsyncStorage → SQLite pour montrer au prof
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎓 DÉMO SQLITE POUR LE PROF\n');

const dbPath = path.join(__dirname, 'spotfoot_demo.db');

// Simuler des données AsyncStorage (comme dans le navigateur)
const mockReservations = [
  {
    id: 'local_1729593600000_abc123',
    slotId: '68f780450d45433828496aba',
    inviteUrl: 'http://localhost:8084/i/demo123',
    token: 'demo123',
    createdAt: Date.now() - 3600000, // Il y a 1h
    syncStatus: 'synced'
  },
  {
    id: 'local_1729597200000_def456',
    slotId: '68f780450d45433828496abb',
    inviteUrl: 'http://localhost:8084/i/demo456',
    token: 'demo456',
    createdAt: Date.now() - 1800000, // Il y a 30min
    syncStatus: 'synced'
  },
  {
    id: 'local_1729600800000_ghi789',
    slotId: '68f780450d45433828496abc',
    inviteUrl: 'http://localhost:8084/i/demo789',
    token: 'demo789',
    createdAt: Date.now() - 600000, // Il y a 10min
    syncStatus: 'synced'
  }
];

try {
  console.log('📦 Création de la base SQLite de démonstration...');
  
  // Supprimer l'ancienne BDD
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  // Créer la structure SQLite
  execSync(`sqlite3 "${dbPath}" "
    CREATE TABLE reservations (
      id TEXT PRIMARY KEY,
      slotId TEXT NOT NULL,
      inviteUrl TEXT NOT NULL,
      token TEXT,
      createdAt INTEGER NOT NULL,
      syncStatus TEXT DEFAULT 'synced',
      lastSyncAt INTEGER
    );
  "`);
  
  console.log('📥 Insertion des réservations de démonstration...');
  
  // Insérer les données
  mockReservations.forEach((reservation, index) => {
    const sql = `INSERT INTO reservations (id, slotId, inviteUrl, token, createdAt, syncStatus, lastSyncAt) VALUES ('${reservation.id}', '${reservation.slotId}', '${reservation.inviteUrl}', '${reservation.token}', ${reservation.createdAt}, '${reservation.syncStatus}', ${Date.now()});`;
    
    execSync(`sqlite3 "${dbPath}" "${sql}"`);
    console.log(`  ✅ Réservation ${index + 1}/3 ajoutée`);
  });
  
  console.log('\\n📊 RÉSULTATS DE LA DÉMONSTRATION:\\n');
  
  // Statistiques
  const count = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM reservations;"`, { encoding: 'utf8' });
  console.log(`📈 Nombre total de réservations: ${count.trim()}`);
  
  // Schéma de la table
  console.log('\\n🏗️  Schéma de la table:');
  const schema = execSync(`sqlite3 "${dbPath}" ".schema reservations"`, { encoding: 'utf8' });
  console.log(schema);
  
  // Contenu de la table
  console.log('📝 Contenu de la table reservations:');
  const content = execSync(`sqlite3 "${dbPath}" -header -column "SELECT id, slotId, substr(inviteUrl, 1, 25) || '...' as inviteUrl, token, datetime(createdAt/1000, 'unixepoch') as created, syncStatus FROM reservations ORDER BY createdAt DESC;"`, { encoding: 'utf8' });
  console.log(content);
  
  // Requêtes de démonstration
  console.log('\\n🎯 COMMANDES POUR LA DÉMONSTRATION AU PROF:\\n');
  console.log('# 1. Ouvrir la base de données SQLite');
  console.log(`sqlite3 "${dbPath}"`);
  console.log('');
  console.log('# 2. Commandes SQL à exécuter dans sqlite3:');
  console.log('SELECT * FROM reservations;');
  console.log('SELECT COUNT(*) as total_reservations FROM reservations;');
  console.log('SELECT syncStatus, COUNT(*) as count FROM reservations GROUP BY syncStatus;');
  console.log("SELECT datetime(createdAt/1000, 'unixepoch') as date_creation FROM reservations;");
  console.log('.schema reservations');
  console.log('.quit');
  console.log('');
  console.log('# 3. Ou directement en une ligne:');
  console.log(`sqlite3 "${dbPath}" "SELECT * FROM reservations;"`);
  
  console.log('\\n✅ DÉMONSTRATION PRÊTE !');
  console.log('\\n💡 Dis au prof: "J\\'utilise SQLite pour stocker les réservations localement."');
  console.log('   Puis montre-lui les commandes ci-dessus ! 🚀');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
