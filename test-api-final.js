// Test rapide des API principales
const BASE_URL = 'http://localhost:3001';

async function test(name, fn) {
  try {
    process.stdout.write(`${name}... `);
    await fn();
    console.log('✅');
  } catch (error) {
    console.log(`❌ ${error.message}`);
  }
}

async function request(method, path, body = null, headers = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  
  return { status: response.status, data, ok: response.ok };
}

async function runTests() {
  console.log('\n🚀 Test des API SpotFoot\n');
  
  let adminToken = null;
  let testSlotId = null;
  
  // 1. Health
  await test('GET /health', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });
  
  // 2. Login admin
  await test('POST /auth/login (admin)', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    if (!res.data.accessToken) throw new Error('Pas de token');
    adminToken = res.data.accessToken;
  });
  
  // 3. Liste des créneaux
  await test('GET /slots', async () => {
    const res = await request('GET', '/slots');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Pas un tableau');
    if (res.data.length > 0) testSlotId = res.data[0]._id;
  });
  
  // 4. Détails d'un créneau
  if (testSlotId) {
    await test(`GET /slots/${testSlotId}`, async () => {
      const res = await request('GET', `/slots/${testSlotId}`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!res.data._id) throw new Error('Pas de _id');
    });
  }
  
  // 5. Création créneau (admin)
  if (adminToken) {
    await test('POST /admin/slots (créer)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const res = await request('POST', '/admin/slots', {
        terrainId: '68e38382bc63c7bb17d98c2e',
        startAt: futureDate.toISOString(),
      }, {
        Authorization: `Bearer ${adminToken}`,
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      if (!res.data._id) throw new Error('Pas de _id');
      testSlotId = res.data._id;
    });
  }
  
  // 6. Créer une réservation
  if (testSlotId) {
    await test('POST /reservations', async () => {
      const res = await request('POST', '/reservations', {
        slotId: testSlotId,
        organizerEmail: 'test@example.com',
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      if (!res.data.inviteUrl) throw new Error('Pas de inviteUrl');
    });
  }
  
  // 7. Suppression créneau test
  if (testSlotId && adminToken) {
    await test(`DELETE /admin/slots/${testSlotId}`, async () => {
      const res = await request('DELETE', `/admin/slots/${testSlotId}`, null, {
        Authorization: `Bearer ${adminToken}`,
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });
  }
  
  console.log('\n✅ Tests terminés !\n');
}

runTests().catch(error => {
  console.error('\n❌ Erreur fatale:', error.message);
  process.exit(1);
});
