# SpotFoot Backend (NestJS)

## Démarrage local

Prérequis: Mongo via Docker Compose dans `infra/`.

```bash
cd infra
docker compose up -d
# Mongo: mongodb://localhost:27017
```

Créer un `.env` à la racine de `backend/` (ou copier `env.example`):

```
MONGODB_URI=mongodb://localhost:27017/spotfoot
PORT=3000
ADMIN_TOKEN=dev-admin-token
PUBLIC_APP_URL=http://localhost:3000
```

Installer les dépendances et démarrer en dev:

```bash
cd backend
npm install
npm run start:dev
```

Health check:
```bash
curl http://localhost:3000/health
```

## Endpoints MVP

- Admin (header `x-admin-token: dev-admin-token`)
  - `POST /admin/terrains` body `{ name, address? }`
  - `POST /admin/slots` body `{ terrainId, startAt, durationMin=60, capacity=10 }`

- Public
  - `GET /slots` → liste des créneaux `OPEN|RESERVED|FULL`

- Réservations
  - `POST /reservations` body `{ slotId, organizerEmail? }`
    - effets: vérifie `OPEN`, crée reservation avec `acceptedCount=0`, génère token + hash, passe le slot en `RESERVED`
    - retour `{ inviteUrl: "http://localhost:3000/i/<token>" }`

- Invitations
  - `GET /invitations/:token` → infos de présentation et `restants`
  - `POST /invitations/:token/accept` → incrément atomique `acceptedCount` jusqu’à la capacité
  - `POST /invitations/:token/decline` → 204

## Curls d’exemple

Créer terrain:
```bash
curl -X POST http://localhost:3000/admin/terrains \
 -H 'x-admin-token: dev-admin-token' \
 -H 'Content-Type: application/json' \
 -d '{"name":"Terrain A","address":"Strasbourg"}'
```

Créer slot (remplacer `<id>`):
```bash
curl -X POST http://localhost:3000/admin/slots \
 -H 'x-admin-token: dev-admin-token' \
 -H 'Content-Type: application/json' \
 -d '{"terrainId":"<id>","startAt":"2025-09-20T18:00:00.000Z","durationMin":60,"capacity":10}'
```

Réserver (joueur):
```bash
curl -X POST http://localhost:3000/reservations \
 -H 'Content-Type: application/json' \
 -d '{"slotId":"<slotId>","organizerEmail":"j@ex.com"}'
```

Accepter (invité):
```bash
curl -X POST http://localhost:3000/invitations/<token>/accept
```
