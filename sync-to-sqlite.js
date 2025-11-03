// Script pour synchroniser AsyncStorage vers SQLite pour la démo
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Synchronisation AsyncStorage → SQLite pour la démo\n');

// Simuler des données AsyncStorage (comme si elles venaient du navigateur)
const mockAsyncStorageData = {
  reservations: [
    {
      slotId: 'slot_' + Date.now(),
      inviteUrl: 'http://localhost:8084/i/demo123',
      token: 'demo123',
      createdAt: Date.now()
    },
    {
      slotId: 'slot_' + (Date.now() - 3600000),
      inviteUrl: 'http://localhost:8084/i/demo456',
      token: 'demo456',
      createdAt: Date.now() - 3600000
    }
  ]
};

const dbPath = path.join(__dirname, 'mobile', 'spotfoot.db');

try {
  console.log('📦 Création/mise à jour de la base SQLite...');
  
  // Créer ou vider la table
  execSync(`sqlite3 "${dbPath}" "
    DROP TABLE IF EXISTS reservations;
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
  
  // Insérer les données AsyncStorage
  console.log('📥 Insertion des réservations...');
  
  mockAsyncStorageData.reservations.forEach((reservation, index) => {
    const id = `async_${Date.now()}_${index}`;
    const sql = `INSERT INTO reservations (id, slotId, inviteUrl, token, createdAt, syncStatus, lastSyncAt) VALUES ('${id}', '${reservation.slotId}', '${reservation.inviteUrl}', '${reservation.token}', ${reservation.createdAt}, 'synced', ${Date.now()});`;
    
    execSync(`sqlite3 "${dbPath}" "${sql}"`);
    console.log(`  ✅ Réservation ${index + 1} ajoutée: ${reservation.slotId}`);
  });
  
  console.log('\n📊 Vérification des données:');
  
  // Afficher le contenu
  const count = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM reservations;"`, { encoding: 'utf8' });
  console.log(`Nombre total de réservations: ${count.trim()}`);
  
  const reservations = execSync(`sqlite3 "${dbPath}" -header -column "SELECT id, slotId, substr(inviteUrl, 1, 30) || '...' as inviteUrl, token, datetime(createdAt/1000, 'unixepoch') as created FROM reservations ORDER BY createdAt DESC;"`, { encoding: 'utf8' });
  console.log('\nRéservations dans SQLite:');
  console.log(reservations);
  
  console.log('\n🎓 Pour la démo au prof:');
  console.log(`sqlite3 "${dbPath}"`);
  console.log('SELECT * FROM reservations;');
  console.log('SELECT COUNT(*) FROM reservations;');
  console.log('.schema reservations');
  console.log('.quit');
  
  console.log('\n✅ Synchronisation terminée !');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
