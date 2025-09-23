# Docker – SpotFoot

Ce document explique comment fonctionne la configuration Docker et comment lancer/arrêter l’environnement.

## Services (infra/docker-compose.yml)
- `mongo`: base de données MongoDB (port 27017 exposé en local)
- `mongo-express`: UI d’admin Mongo (port 8081)
- `api`: backend NestJS en mode développement (hot reload) 
  - Image construite depuis `backend/Dockerfile` cible `dev`
  - Bind-mount du dossier `backend/` dans le conteneur
  - Commande: `npm run start:dev`
  - Port hôte paramétrable via `infra/.env` → `API_PORT` (défaut 3000)

## Variables d’environnement
Créer `infra/.env` basé sur `infra/.env.example`:
```
API_PORT=3000
```
Le backend lui-même lit ses variables dans `backend/.env` (exemple dans `backend/env.example`).

## Lancer (depuis la racine du repo)
Développement avec API + Mongo + UI:
```bash
docker compose -f infra/docker-compose.yml up -d
```
- Accès API: http://localhost:3000 (ou `http://localhost:${API_PORT}`)
- Santé: `curl http://localhost:3000/health`
- Mongo: mongodb://localhost:27017
- UI Mongo Express: http://localhost:8081

Pour voir les logs de l’API (suivi temps réel):
```bash
docker compose -f infra/docker-compose.yml logs -f api
```

## Arrêter / Nettoyer
Arrêt simple (garde les données):
```bash
docker compose -f infra/docker-compose.yml stop
```

Arrêt + suppression des conteneurs et réseau:
```bash
docker compose -f infra/docker-compose.yml down
```

Tout supprimer y compris les volumes (efface les données Mongo locales, prudence):
```bash
docker compose -f infra/docker-compose.yml down -v
```

## Rebuild / changement de dépendances
Si tu modifies `backend/package.json` ou le `Dockerfile`, force un rebuild:
```bash
docker compose -f infra/docker-compose.yml up -d --build api
```

## Mode local (sans conteneur API)
Alternative: lancer uniquement Mongo via Docker et le backend sur la machine hôte:
```bash
# Mongo
docker compose -f infra/docker-compose.yml up -d mongo mongo-express

# Backend local
cd backend
[ -f .env ] || cp env.example .env
npm install
npm run start:dev
```
