// Script pour visualiser la BDD SQLite locale
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Recherche de la base de données SQLite...\n');

// Chemins possibles pour la BDD SQLite
const possiblePaths = [
  // Expo/React Native
  path.join(process.env.HOME || '', '.expo'),
  path.join(process.env.HOME || '', 'Library/Developer/CoreSimulator'),
  path.join(process.env.HOME || '', 'AppData/Local/Packages'),
  // Dossier du projet
  path.join(__dirname, 'spotfoot.db'),
  path.join(__dirname, '..', 'spotfoot.db'),
];

function findSQLiteDB() {
  for (const basePath of possiblePaths) {
    try {
      if (fs.existsSync(basePath)) {
        // Chercher récursivement
        const result = execSync(`find "${basePath}" -name "spotfoot.db" 2>/dev/null || true`, { encoding: 'utf8' });
        if (result.trim()) {
          return result.trim().split('\n')[0];
        }
      }
    } catch (e) {
      // Ignorer les erreurs
    }
  }
  return null;
}

function createTestDB() {
  const dbPath = path.join(__dirname, 'spotfoot.db');
  console.log('📦 Création d\'une BDD de test:', dbPath);
  
  try {
    // Créer une BDD de test avec sqlite3
    execSync(`sqlite3 "${dbPath}" "
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        slotId TEXT NOT NULL,
        inviteUrl TEXT NOT NULL,
        token TEXT,
        createdAt INTEGER NOT NULL,
        syncStatus TEXT DEFAULT 'synced',
        lastSyncAt INTEGER
      );
      
      INSERT INTO reservations (id, slotId, inviteUrl, token, createdAt, syncStatus) VALUES
      ('test1', 'slot123', 'http://localhost:8084/i/abc123', 'abc123', ${Date.now()}, 'synced'),
      ('test2', 'slot456', 'http://localhost:8084/i/def456', 'def456', ${Date.now() - 3600000}, 'synced');
    "`);
    
    return dbPath;
  } catch (e) {
    console.error('❌ Erreur création BDD test:', e.message);
    return null;
  }
}

function showSQLiteContent(dbPath) {
  console.log('📊 Contenu de la base de données SQLite:\n');
  console.log('📍 Chemin:', dbPath, '\n');
  
  try {
    // Lister les tables
    console.log('📋 Tables disponibles:');
    const tables = execSync(`sqlite3 "${dbPath}" ".tables"`, { encoding: 'utf8' });
    console.log(tables || 'Aucune table trouvée\n');
    
    // Schéma de la table reservations
    console.log('🏗️  Schéma de la table reservations:');
    const schema = execSync(`sqlite3 "${dbPath}" ".schema reservations"`, { encoding: 'utf8' });
    console.log(schema || 'Table reservations non trouvée\n');
    
    // Compter les réservations
    console.log('📊 Statistiques:');
    const count = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) as total FROM reservations;"`, { encoding: 'utf8' });
    console.log(`Nombre total de réservations: ${count.trim()}\n`);
    
    // Afficher toutes les réservations
    console.log('📝 Toutes les réservations:');
    const reservations = execSync(`sqlite3 "${dbPath}" -header -column "SELECT id, slotId, substr(inviteUrl, 1, 30) || '...' as inviteUrl, token, datetime(createdAt/1000, 'unixepoch') as created, syncStatus FROM reservations ORDER BY createdAt DESC;"`, { encoding: 'utf8' });
    console.log(reservations || 'Aucune réservation trouvée\n');
    
    // Réservations par statut
    console.log('📈 Réservations par statut:');
    const byStatus = execSync(`sqlite3 "${dbPath}" -header -column "SELECT syncStatus, COUNT(*) as count FROM reservations GROUP BY syncStatus;"`, { encoding: 'utf8' });
    console.log(byStatus || 'Aucune donnée\n');
    
  } catch (e) {
    console.error('❌ Erreur lecture BDD:', e.message);
  }
}

// Script principal
const dbPath = findSQLiteDB();

if (dbPath) {
  console.log('✅ Base de données trouvée:', dbPath, '\n');
  showSQLiteContent(dbPath);
} else {
  console.log('⚠️  Aucune base de données SQLite trouvée.');
  console.log('💡 Création d\'une BDD de démonstration...\n');
  
  const testDB = createTestDB();
  if (testDB) {
    showSQLiteContent(testDB);
    console.log('\n🎓 Pour la démo au prof, utilisez ces commandes:');
    console.log(`sqlite3 "${testDB}"`);
    console.log('SELECT * FROM reservations;');
    console.log('.quit');
  }
}

console.log('\n🔧 Commandes utiles pour le prof:');
console.log('# Ouvrir la BDD SQLite');
console.log(`sqlite3 ${dbPath || path.join(__dirname, 'spotfoot.db')}`);
console.log('');
console.log('# Commandes SQL à tester:');
console.log('SELECT * FROM reservations;');
console.log('SELECT COUNT(*) FROM reservations;');
console.log('SELECT syncStatus, COUNT(*) FROM reservations GROUP BY syncStatus;');
console.log('.schema reservations');
console.log('.quit');
