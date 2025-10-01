# SpotFoot

[![CI](https://github.com/Erblinn450/Spootfoot/actions/workflows/ci.yml/badge.svg)](https://github.com/Erblinn450/Spootfoot/actions/workflows/ci.yml)

Permettre à un joueur de réserver un créneau de 1h sur un terrain (capacité 10), puis partager un lien d’invitation ouvert pour que ses amis confirment "Je viens / Je ne peux pas".

## Démarrage rapide

1) Démarrer la base de données

```bash
docker compose up -d
# Mongo Express: http://localhost:8081
```

2) Lancer l’API (NestJS)

```bash
cd backend
npm i
npm run start:dev
# API: http://localhost:3001
# Swagger: http://localhost:3001/api
```

3) Lancer le front (Expo Web)

```bash
cd mobile
npm i
npx expo start --web
# Front: http://localhost:8084
```

## Script de démo (60–90s)

- Ouvrir http://localhost:8084
- Login: saisir un email (persistance auto)
- Terrains: ouvrir un créneau
- Détail: « Confirmer la réservation »
- Invitation: auto‑accept + lien visible + bouton « Copier »
- Réservations: voir la dernière réservation (ouvrir/copier)

## Endpoints utiles

- GET `/slots` — liste des créneaux
- GET `/slots/{id}` — un créneau précis
- POST `/reservations` — `{ slotId, organizerEmail }`
- GET `/invitations/{token}` — charger l’invitation
- POST `/invitations/{token}/accept` — option `{ email }`

Swagger: http://localhost:3001/api

## Dépannage

- Écran blanc (front): `npx expo start -c --web`
- CORS: autorisations localhost 8080–8084 côté backend
- Ports: API 3001, Front 8084, Mongo Express 8081
- Node: utiliser Node 18 LTS (les warnings d’engine peuvent être ignorés pour la démo Web)

## Stack
- Mobile (front): React Native (Expo, TypeScript)
- Backend: Node.js + NestJS (TypeScript)
- Base de données: MongoDB
- Infra dev: Docker Compose (Mongo + mongo-express)
- Git Flow léger: `main`, `develop`, `feature/*`

## Licence
MIT
