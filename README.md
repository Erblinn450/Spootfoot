# ⚽ SpotFoot

> Application de réservation de terrains de foot entre amis

[![CI](https://github.com/Erblinn450/Spootfoot/actions/workflows/ci.yml/badge.svg)](https://github.com/Erblinn450/Spootfoot/actions/workflows/ci.yml)

![SpotFoot Preview](https://img.shields.io/badge/React_Native-Expo-blue?logo=expo) ![NestJS](https://img.shields.io/badge/Backend-NestJS-red?logo=nestjs) ![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)

---

## 📖 C'est quoi SpotFoot ?

SpotFoot permet de :
- 🏟️ **Réserver un créneau** sur un terrain de foot (1h, 10 places)
- 🔗 **Partager un lien d'invitation** avec tes potes
- ✅ **Confirmer sa participation** en un clic ("Je viens" / "Je ne peux pas")
- 📱 **Interface moderne** en dark mode avec animations fluides

---

## 🚀 Lancer le projet

### Prérequis

Avant de commencer, assure-toi d'avoir installé :

| Outil | Version | Installation |
|-------|---------|--------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Docker Desktop** | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### Étape 1 : Cloner le projet

```bash
git clone https://github.com/Erblinn450/Spootfoot.git
cd Spootfoot
```

### Étape 2 : Démarrer la base de données (MongoDB)

```bash
# Lance MongoDB et Mongo Express (interface web pour voir la DB)
docker compose up -d
```

✅ **Vérifier que ça marche :**
- Mongo Express : http://localhost:8082 (user: `admin`, password: `pass`)

### Étape 3 : Lancer le Backend (API)

```bash
cd backend
npm install
npm run start:dev
```

✅ **Vérifier que ça marche :**
- API : http://localhost:3001/health → doit afficher `{"status":"ok"}`
- Swagger (doc API) : http://localhost:3001/api

### Étape 4 : Lancer le Frontend (App Web)

```bash
cd mobile
npm install
npx expo start --web --port 8084
```

✅ **Vérifier que ça marche :**
- App : http://localhost:8084

---

## 🎮 Comment utiliser l'app

### 1. Se connecter
- Va sur http://localhost:8084
- Clique sur "Utiliser le compte démo" ou crée un compte
- Compte démo : `admin@spotfoot.com` / `admin123`

### 2. Réserver un créneau
- Sur la page d'accueil, clique sur un créneau **Disponible**
- Entre ton email et clique "Confirmer la réservation"
- Tu obtiens un **lien d'invitation** à partager !

### 3. Inviter tes potes
- Copie le lien d'invitation
- Envoie-le à tes amis
- Ils peuvent cliquer sur "Je participe !" pour confirmer

### 4. Voir les participants
- Va dans l'onglet "Réservations" pour voir tes créneaux
- Ouvre une invitation pour voir combien de personnes viennent

---

## 🛠️ Commandes utiles

### Backend
```bash
cd backend
npm run start:dev    # Lance en mode développement (hot reload)
npm run build        # Compile pour la production
npm test             # Lance les tests
```

### Frontend
```bash
cd mobile
npx expo start --web --port 8084   # Lance l'app web
npx expo start -c --web            # Lance avec cache vidé (si bug)
```

### Docker
```bash
docker compose up -d      # Démarre MongoDB
docker compose down       # Arrête MongoDB
docker compose logs -f    # Voir les logs
```

---

## 📁 Structure du projet

```
Spootfoot/
├── backend/              # API NestJS (TypeScript)
│   ├── src/
│   │   ├── auth/         # Authentification (JWT)
│   │   ├── slots/        # Créneaux
│   │   ├── reservations/ # Réservations
│   │   ├── invitations/  # Liens d'invitation
│   │   └── terrains/     # Terrains
│   └── tests/            # Tests
│
├── mobile/               # App React Native / Expo
│   └── app/
│       ├── components/   # Composants UI réutilisables
│       ├── screens/      # Écrans de l'app
│       ├── services/     # API client, storage
│       └── theme.ts      # Design system (couleurs, fonts)
│
├── docker-compose.yml    # Config Docker (MongoDB)
└── README.md             # Ce fichier !
```

---

## 🔌 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/slots` | Liste tous les créneaux |
| `GET` | `/slots/:id` | Détail d'un créneau |
| `POST` | `/reservations` | Créer une réservation |
| `GET` | `/invitations/:token` | Info d'une invitation |
| `POST` | `/invitations/:token/accept` | Accepter une invitation |
| `POST` | `/invitations/:token/decline` | Refuser une invitation |
| `POST` | `/auth/signup` | Créer un compte |
| `POST` | `/auth/login` | Se connecter |

📚 **Documentation complète** : http://localhost:3001/api (Swagger)

---

## 🐛 Dépannage

### L'app ne se lance pas / écran blanc
```bash
cd mobile
npx expo start -c --web --port 8084
```
Le `-c` vide le cache.

### Erreur "Cannot connect to MongoDB"
```bash
# Vérifie que Docker tourne
docker ps

# Relance MongoDB si besoin
docker compose down
docker compose up -d
```

### Erreur de port déjà utilisé
```bash
# Trouve le processus sur le port (ex: 3001)
lsof -i :3001

# Tue le processus
kill -9 <PID>
```

### Le backend ne démarre pas
```bash
cd backend
rm -rf node_modules
npm install
npm run start:dev
```

---

## 🎨 Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React Native + Expo (TypeScript) |
| **Backend** | NestJS (TypeScript) |
| **Base de données** | MongoDB |
| **Auth** | JWT (JSON Web Tokens) |
| **Infrastructure** | Docker Compose |

---

## 👥 Créer un compte admin

Pour accéder à l'interface d'administration (créer des terrains/créneaux) :

```bash
# 1. Crée un compte normal via l'app ou :
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "ton@email.com", "password": "motdepasse"}'

# 2. Donne les droits admin :
curl -X POST http://localhost:3001/auth/dev/grant-admin-by-email \
  -H "Content-Type: application/json" \
  -d '{"email": "ton@email.com"}'
```

Ou utilise le compte démo qui est déjà admin : `admin@spotfoot.com` / `admin123`

---

## 📄 Licence

MIT © 2024

---

**Made with ⚽ by Erblinn**
