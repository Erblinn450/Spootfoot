# SpotFoot

[![CI](https://github.com/Erblinn450/Spootfoot/actions/workflows/ci.yml/badge.svg)](https://github.com/Erblinn450/Spootfoot/actions/workflows/ci.yml)

Permettre à un joueur de réserver un créneau de 1h sur un terrain (capacité 10), puis partager un lien d’invitation ouvert pour que ses amis confirment "Je viens / Je ne peux pas".

## Stack
- Mobile (front): React Native (Expo, TypeScript)
- Backend: Node.js + NestJS (TypeScript)
- Base de données: MongoDB
- Infra dev: Docker Compose (Mongo + mongo-express)
- Git Flow léger: `main`, `develop`, `feature/*`
- IDE: VS Code (ESLint, Prettier, EditorConfig, Docker)

## Prérequis
- Docker & Docker Compose
- Node.js LTS (>= 18)
- pnpm ou npm (au choix)
- VS Code + extensions recommandées (voir `.vscode/extensions.json`)

## Démarrage rapide (Mongo local)

```bash
# Lancer la base Mongo + UI mongo-express
docker compose up -d
# MongoDB: mongodb://root:rootpass@localhost:27017
# mongo-express: http://localhost:8081
```

## Création des apps (à exécuter une fois)

### 1) Front mobile (Expo + TypeScript)
```bash
# Depuis la racine du repo
npx create-expo-app@latest apps/mobile --template
# Sélectionner TypeScript lors du prompt (ou ajouter tsconfig ensuite)
cd apps/mobile
pnpm add -D eslint prettier @react-native/eslint-config
# scripts lint/format (package.json)
```

### 2) Backend API (NestJS + TypeScript)
```bash
# Depuis la racine
pnpm dlx @nestjs/cli new apps/api
# Choisir pnpm ou npm
cd apps/api
pnpm add @nestjs/mongoose mongoose
pnpm add -D eslint prettier @nestjs/eslint-plugin
```

### 3) Lier l’API à Mongo (exemple .env)
Créer `apps/api/.env`:
```
MONGO_URI=mongodb://root:rootpass@localhost:27017/spotfoot?authSource=admin
PORT=3000
```

## Conventions de branches
- `main`: stable, production-ready
- `develop`: intégration
- `feature/*`: travail par fonctionnalité

## Lintage / Formatage
- `.editorconfig` pour baseline IDE
- Prettier via `.prettierrc`
- ESLint configuré dans chaque app (`apps/mobile`, `apps/api`)

## Documents
- `docs/Cahier_des_charges.md`: contexte produit, objectifs SMART, périmètre, risques, KPIs, planning

## Roadmap (extrait)
- MVP: réservation de créneau + lien d’invitation + comptage des participants
- V2: auth légère, notifications push, historique de sessions

## Licences
MIT (à confirmer)
