// Script de démo SQLite simple
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎓 DÉMO SQLITE POUR LE PROF');
console.log('');

const dbPath = path.join(__dirname, 'spotfoot_demo.db');

// Données de test
const reservations = [
  {
    id: 'local_1729593600000_abc123',
    slotId: '68f780450d45433828496aba',
    inviteUrl: 'http://localhost:8084/i/demo123',
    token: 'demo123',
    createdAt: Date.now() - 3600000,
    syncStatus: 'synced'
  },
  {
    id: 'local_1729597200000_def456', 
    slotId: '68f780450d45433828496abb',
    inviteUrl: 'http://localhost:8084/i/demo456',
    token: 'demo456',
    createdAt: Date.now() - 1800000,
    syncStatus: 'synced'
  }
];

try {
  console.log('📦 Création de la base SQLite...');
  
  // Supprimer l'ancienne BDD
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  // Créer la table
  execSync(`sqlite3 "${dbPath}" "CREATE TABLE reservations (id TEXT PRIMARY KEY, slotId TEXT NOT NULL, inviteUrl TEXT NOT NULL, token TEXT, createdAt INTEGER NOT NULL, syncStatus TEXT DEFAULT 'synced');"`);
  
  console.log('📥 Insertion des données...');
  
  // Insérer les données
  reservations.forEach((r, i) => {
    const sql = `INSERT INTO reservations VALUES ('${r.id}', '${r.slotId}', '${r.inviteUrl}', '${r.token}', ${r.createdAt}, '${r.syncStatus}');`;
    execSync(`sqlite3 "${dbPath}" "${sql}"`);
    console.log(`  ✅ Réservation ${i + 1} ajoutée`);
  });
  
  console.log('');
  console.log('📊 RÉSULTATS:');
  console.log('');
  
  // Compter
  const count = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM reservations;"`, { encoding: 'utf8' });
  console.log(`Nombre de réservations: ${count.trim()}`);
  
  // Afficher le contenu
  console.log('');
  console.log('📝 Contenu de la table:');
  const content = execSync(`sqlite3 "${dbPath}" -header -column "SELECT * FROM reservations;"`, { encoding: 'utf8' });
  console.log(content);
  
  console.log('');
  console.log('🎯 COMMANDES POUR LE PROF:');
  console.log('');
  console.log(`sqlite3 "${dbPath}"`);
  console.log('SELECT * FROM reservations;');
  console.log('SELECT COUNT(*) FROM reservations;');
  console.log('.schema reservations');
  console.log('.quit');
  console.log('');
  console.log('✅ DÉMONSTRATION PRÊTE !');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
