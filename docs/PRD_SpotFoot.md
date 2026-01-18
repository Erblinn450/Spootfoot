# SpotFoot — Product Requirements Document (PRD)

> **Version**: 1.2
> **Dernière mise à jour**: 18 janvier 2026
> **Auteurs**: Erblin & Omar
> **Client**: Gérant de complexe Five

---

## TL;DR (Résumé rapide)

**SpotFoot** = App de réservation de terrains de Five (foot 5v5)

### C'est quoi ?
- Un joueur réserve un créneau en 3 clics
- Le gérant du Five gère ses terrains et voit les réservations

### Comment ça marche ?
1. Le joueur crée un compte (email + mdp)
2. Il voit les créneaux disponibles
3. Il réserve → le créneau est bloqué à son nom
4. Il paye sur place le jour J

### Stack tech
- **Frontend** : React Native + Expo
- **Backend** : NestJS + MongoDB
- **Auth** : JWT

### Phases du projet
| Phase | Contenu | Statut |
|-------|---------|--------|
| **MVP v1** | Réservation simple | 🔄 En cours (code fait, UI à polish) |
| **MVP+** | Liens d'invitation + Paiement Stripe | ⏳ Après |
| **v2** | Notifs, multi-complexes | 📋 Plus tard |

### Ce qui reste à faire (MVP v1)
1. Créer la page d'accueil (landing)
2. Ajouter les emails de confirmation (Resend)
3. Polish l'UI des écrans existants
4. Tester et déployer

**Pour les détails → lire les sections ci-dessous.**

---

## 1. Contexte et vision

### 1.1 Problème à résoudre

Les gérants de complexes Five (foot indoor 5v5) gèrent souvent leurs réservations par téléphone, WhatsApp ou papier. C'est chronophage, source d'erreurs (double réservation), et ne permet pas aux joueurs de voir les disponibilités en temps réel.

### 1.2 Solution

**SpotFoot** est une application mobile qui permet :
- Aux **joueurs** : de voir les créneaux disponibles et réserver en quelques clics
- Au **gérant** : de gérer ses terrains et visualiser toutes les réservations

### 1.3 Vision produit

> Une réservation de Five aussi simple que commander un Uber : ouvrir l'app, choisir un créneau, réserver.

---

## 2. Logique métier

### 2.1 Modèle de réservation (MVP v1)

SpotFoot utilise le modèle **"1 organisateur réserve pour tous"** :

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Joueur (avec compte)                                          │
│         │                                                       │
│         ▼                                                       │
│   Voit les créneaux disponibles                                 │
│         │                                                       │
│         ▼                                                       │
│   Réserve un créneau (à son nom)                               │
│         │                                                       │
│         ▼                                                       │
│   Créneau = RESERVED (bloqué)                                   │
│         │                                                       │
│         ▼                                                       │
│   Paiement sur place le jour J                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Pourquoi un compte obligatoire ?

| Raison | Explication |
|--------|-------------|
| **Identification** | On sait QUI a réservé (email vérifié) |
| **Historique** | Le joueur retrouve ses réservations |
| **Responsabilité** | Le gérant a un contact fiable en cas de no-show |
| **Anti-abus** | On peut bloquer un compte qui abuse |

### 2.3 Qui fait quoi ?

| Acteur | Compte requis ? | Actions possibles |
|--------|-----------------|-------------------|
| **Joueur** | ✅ Oui | Voir créneaux, réserver, annuler, voir historique |
| **Gérant (admin)** | ✅ Oui | Tout ce que fait un joueur + créer terrains/créneaux |
| **Invité** (MVP+) | ❌ Non | Accepter/refuser une invitation via lien |

### 2.4 Cycle de vie d'un créneau

```
OPEN (disponible)
    │
    │ ← Un joueur réserve
    ▼
RESERVED (bloqué par l'organisateur)
    │
    │ ← Le joueur annule OU le gérant annule
    ▼
CANCELLED (annulé)
```

> **Note MVP v1** : Le statut FULL n'est pas utilisé car un seul organisateur réserve le créneau entier. FULL sera utile en MVP+ quand les invités pourront rejoindre.

### 2.5 Règles métier clés

| # | Règle | Détail |
|---|-------|--------|
| 1 | **Compte obligatoire** | Pour réserver, le joueur doit avoir un compte (email + mdp) |
| 2 | **1 réservation = 1 organisateur** | Un créneau est réservé par une seule personne |
| 3 | **Paiement sur place** | Pas de paiement en ligne dans le MVP v1 |
| 4 | **Annulation possible** | L'organisateur peut annuler sa réservation |
| 5 | **Admin = super-joueur** | Le gérant peut aussi réserver comme un joueur |

### 2.6 Ce qui change en MVP+

| Aspect | MVP v1 | MVP+ |
|--------|--------|------|
| Invitations | ❌ | ✅ L'organisateur partage un lien |
| Invités | - | Acceptent/refusent sans compte |
| Paiement | Sur place | En ligne (Stripe) |
| Qui paye | L'organisateur seul | L'organisateur (option : chacun sa part en v2) |

---

## 3. Architecture technique

### 3.1 Stack

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React Native + Expo | Expo 54, RN 0.81 |
| Backend | NestJS | 10.x |
| Base de données | MongoDB | 7.x |
| ORM | Mongoose | 8.5 |
| Auth | JWT + Passport + bcryptjs | - |
| Déploiement | Docker Compose | - |

### 3.2 Structure du projet

```
Spootfoot/
├── backend/                 # API NestJS
│   └── src/
│       ├── auth/            # Authentification (JWT)
│       ├── users/           # Gestion utilisateurs
│       ├── terrains/        # CRUD terrains
│       ├── slots/           # CRUD créneaux
│       ├── reservations/    # Réservations
│       └── invitations/     # Liens d'invitation
│
├── mobile/                  # App React Native
│   └── app/
│       ├── screens/         # Écrans de l'app
│       ├── components/      # Composants UI
│       ├── state/           # Context (auth)
│       └── utils/           # API client
│
└── docs/                    # Documentation
```

### 3.3 Modèles de données

#### User
```typescript
{
  _id: ObjectId,
  email: string,           // unique, indexé
  passwordHash: string,    // bcrypt
  roles: ['user'] | ['user', 'admin'],
  createdAt: Date
}
```

#### Terrain
```typescript
{
  _id: ObjectId,
  name: string,            // ex: "Terrain A"
  address?: string,        // optionnel
  createdAt: Date
}
```

#### Slot (Créneau)
```typescript
{
  _id: ObjectId,
  terrainId: ObjectId,     // référence Terrain
  startAt: Date,           // début du créneau
  durationMin: number,     // 60 par défaut
  capacity: number,        // 10 par défaut
  status: 'OPEN' | 'RESERVED' | 'FULL' | 'CANCELLED',
  createdAt: Date
}
```

#### Reservation
```typescript
{
  _id: ObjectId,
  slotId: ObjectId,        // référence Slot
  odanizerEmail: string,
  tokenHash: string,       // SHA256 du token d'invitation
  acceptedCount: number,   // compteur atomique
  createdAt: Date
}
```

### 3.4 Endpoints API

#### Auth
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/auth/signup` | Inscription | Non |
| POST | `/auth/login` | Connexion | Non |
| GET | `/auth/me` | Profil utilisateur | JWT |

#### Slots (Créneaux)
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/slots` | Liste créneaux (OPEN, RESERVED, FULL) | Non |
| GET | `/slots/:id` | Détail d'un créneau | Non |
| POST | `/admin/slots` | Créer un créneau | JWT + Admin |
| DELETE | `/admin/slots/:id` | Supprimer un créneau | JWT + Admin |

#### Terrains
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/admin/terrains` | Liste terrains | JWT |
| POST | `/admin/terrains` | Créer un terrain | JWT + Admin |

#### Reservations
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/reservations` | Créer une réservation | Non |

#### Invitations
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/i/:token` | Voir l'invitation | Non |
| POST | `/i/:token/accept` | Accepter | Non |
| POST | `/i/:token/decline` | Refuser | Non |

---

## 3. Phases de livraison

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│  MVP v1                    │  MVP+                │  v2         │
│  Réservation basique       │  Invitations +       │  Avancé     │
│                            │  Paiement            │             │
├────────────────────────────┼──────────────────────┼─────────────┤
│  ✅ Déjà codé              │  ⏳ À faire          │  📋 Backlog │
│  → Polish UI + Tests       │                      │             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. MVP v1 — Réservation de créneaux

### 4.1 Objectif

Permettre à un joueur de **voir les créneaux disponibles** et **réserver** un créneau.
Permettre au gérant de **créer des créneaux** et **voir les réservations**.

### 4.2 Périmètre fonctionnel

#### Ce qui est INCLUS dans MVP v1

| Fonctionnalité | Description | Statut code |
|----------------|-------------|-------------|
| Authentification | Signup/Login avec email + mdp | ✅ Codé |
| Liste des créneaux | Affichage des créneaux dispo | ✅ Codé |
| Réservation | Un joueur réserve un créneau | ✅ Codé |
| Panel admin | Créer terrains et créneaux | ✅ Codé |
| Profil | Voir son email, se déconnecter | ✅ Codé |
| **Email de confirmation** | Email envoyé après réservation | ❌ À coder |

#### Ce qui est EXCLU de MVP v1

| Fonctionnalité | Raison | Phase prévue |
|----------------|--------|--------------|
| Liens d'invitation | Scope MVP+ | MVP+ |
| Paiement | Scope MVP+ | MVP+ |
| Notifications push | Pas prioritaire | v2 |

> **Note**: Le code des liens d'invitation existe déjà dans la codebase mais n'est pas activé/exposé dans l'UI pour MVP v1.

### 4.3 User Stories MVP v1

#### Joueur

| ID | En tant que... | Je veux... | Afin de... | Priorité |
|----|----------------|------------|------------|----------|
| US-01 | Joueur | m'inscrire avec email/mdp | accéder à l'app | P0 |
| US-02 | Joueur | me connecter | retrouver mes réservations | P0 |
| US-03 | Joueur | voir les créneaux disponibles | choisir quand jouer | P0 |
| US-04 | Joueur | réserver un créneau | bloquer ma place | P0 |
| US-05 | Joueur | voir mes réservations | savoir quand je joue | P1 |
| US-06 | Joueur | annuler ma réservation | libérer le créneau si empêché | P1 |
| US-07 | Joueur | recevoir un email de confirmation | avoir une preuve de ma réservation | P0 |

#### Gérant (Admin)

| ID | En tant que... | Je veux... | Afin de... | Priorité |
|----|----------------|------------|------------|----------|
| US-10 | Gérant | créer un terrain | définir mes espaces de jeu | P0 |
| US-11 | Gérant | créer un créneau | ouvrir des dispos aux joueurs | P0 |
| US-12 | Gérant | voir toutes les réservations | savoir qui vient quand | P0 |
| US-13 | Gérant | supprimer un créneau | annuler si besoin | P1 |

### 4.4 Écrans MVP v1

```
APP JOUEUR (6 écrans)
─────────────────────

[0] PAGE D'ACCUEIL (Landing) ⭐ NOUVEAU
    │
    │  ┌─────────────────────────────────────────────────────┐
    │  │                                                     │
    │  │   🏟️  HERO SECTION                                  │
    │  │   ────────────────                                  │
    │  │   • Logo SpotFoot (animé)                           │
    │  │   • Headline accrocheur :                           │
    │  │     "Réserve ton Five en 30 secondes"               │
    │  │   • Sous-titre :                                    │
    │  │     "Plus besoin d'appeler. Choisis ton créneau,    │
    │  │      réserve, joue."                                │
    │  │   • CTA principal : [ Réserver maintenant → ]       │
    │  │   • CTA secondaire : "Déjà inscrit ? Se connecter"  │
    │  │                                                     │
    │  │   💡 COMMENT ÇA MARCHE (3 étapes visuelles)         │
    │  │   ──────────────────────────────────────            │
    │  │   1️⃣ Choisis ton créneau                            │
    │  │   2️⃣ Réserve en 1 clic                              │
    │  │   3️⃣ Joue avec tes potes                            │
    │  │                                                     │
    │  │   📍 INFOS DU COMPLEXE                              │
    │  │   ────────────────────                              │
    │  │   • Nom du Five                                     │
    │  │   • Adresse                                         │
    │  │   • Horaires d'ouverture                            │
    │  │   • Photo ou illustration du terrain                │
    │  │                                                     │
    │  │   🔥 FOOTER                                         │
    │  │   ────────                                          │
    │  │   • "Propulsé par SpotFoot"                         │
    │  │   • Liens : Mentions légales, Contact               │
    │  │                                                     │
    │  └─────────────────────────────────────────────────────┘
    │
    └── Tap sur CTA → Écran Login/Signup

[1] Login/Signup
    ├── Champ email
    ├── Champ mot de passe
    ├── Bouton "Se connecter"
    └── Lien "Créer un compte"

[2] Liste des créneaux (écran principal après login)
    ├── Header avec titre + profil
    ├── Liste scrollable de cards
    │   └── Card créneau:
    │       ├── Date (ex: "Lun 20 Jan")
    │       ├── Heure (ex: "18h00 - 19h00")
    │       ├── Terrain (ex: "Terrain A")
    │       ├── Places (ex: "8/10")
    │       └── Badge status (DISPO / COMPLET)
    └── Pull-to-refresh

[3] Détail créneau
    ├── Infos complètes du créneau
    ├── Liste des participants (si visible)
    └── Bouton "Réserver" (si OPEN)

[4] Mes réservations
    ├── Liste de mes réservations
    │   └── Card avec date, heure, terrain
    └── Bouton "Annuler" sur chaque card

[5] Profil
    ├── Email de l'utilisateur
    ├── Badge "Admin" (si applicable)
    └── Bouton "Déconnexion"


PANEL ADMIN (intégré dans l'app, visible si role=admin)
───────────────────────────────────────────────────────

[A1] Gestion créneaux
     ├── Formulaire création:
     │   ├── Sélecteur terrain
     │   ├── Date picker
     │   ├── Heure picker
     │   └── Bouton "Créer"
     └── Liste des créneaux existants

[A2] Gestion terrains
     ├── Formulaire création:
     │   ├── Nom du terrain
     │   └── Bouton "Créer"
     └── Liste des terrains
```

### 4.5 Spécification : Page d'accueil (Landing)

#### Objectif
Première impression de l'app. Doit être **accrocheuse**, **claire** et **inciter à l'action** (s'inscrire/réserver).

#### Direction artistique

| Aspect | Guideline |
|--------|-----------|
| **Ambiance** | Sport, énergie, dynamisme |
| **Couleurs** | Vert gazon, noir, accents vifs (orange/jaune) |
| **Typo** | Bold, impactante, moderne (ex: Montserrat, Inter) |
| **Images** | Terrain de foot, joueurs en action, ambiance nocturne néon |
| **Animations** | Subtiles : fade-in au scroll, hover sur les CTA |

> **Note** : Le design final sera réalisé avec Gemini. Cette spec donne la structure et les guidelines.

#### Contenu obligatoire

| Section | Contenu | Priorité |
|---------|---------|----------|
| **Hero** | Logo + Headline + CTA | P0 |
| **Comment ça marche** | 3 étapes illustrées | P0 |
| **Infos complexe** | Nom, adresse, horaires | P1 |
| **Footer** | Mentions légales, contact | P1 |

#### Textes suggérés (à adapter)

**Headline (accroche principale)** :
- "Réserve ton Five en 30 secondes"
- "Ton terrain t'attend"
- "Fini les appels, place au jeu"

**Sous-titre** :
- "Choisis ton créneau, réserve en 1 clic, joue avec tes potes"
- "La réservation de Five, simplifiée"

**CTA principal** :
- "Réserver maintenant"
- "Voir les créneaux"
- "C'est parti"

#### Flow utilisateur

```
Utilisateur arrive sur l'app/site
         │
         ▼
    Page d'accueil
         │
         ├── Tap "Réserver maintenant" → Login/Signup
         │
         └── Tap "Se connecter" → Login
                    │
                    ▼
            Liste des créneaux
```

#### État du code

| Composant | Fichier | Statut |
|-----------|---------|--------|
| Landing page | `mobile/app/screens/Landing.tsx` | ❌ À créer |

#### User Story associée

| ID | En tant que... | Je veux... | Afin de... | Priorité |
|----|----------------|------------|------------|----------|
| US-00 | Visiteur | voir une page d'accueil attractive | comprendre l'app et m'inscrire | P0 |

### 4.6 Spécification : Emails de confirmation

#### Objectif
Envoyer un email au joueur après chaque réservation pour confirmer les détails.

#### Quand envoyer un email ?

| Événement | Email envoyé | Destinataire |
|-----------|--------------|--------------|
| Réservation créée | ✅ Confirmation | Joueur |
| Réservation annulée | ✅ Annulation | Joueur |
| (MVP+) Invitation acceptée | ✅ Notification | Organisateur |

#### Contenu de l'email de confirmation

```
Objet : ✅ Réservation confirmée - [Nom du Five]

Bonjour [Prénom/Email],

Ta réservation est confirmée !

📅 Date : Lundi 20 janvier 2026
⏰ Heure : 18h00 - 19h00
📍 Terrain : Terrain A
🏟️ Lieu : [Adresse du Five]

Pense à arriver 10 minutes avant.

À bientôt sur le terrain !
L'équipe SpotFoot
```

#### Solution technique recommandée

| Option | Service | Avantages | Inconvénients |
|--------|---------|-----------|---------------|
| **Resend** (recommandé) | resend.com | Simple, gratuit jusqu'à 3000 emails/mois, bonne API | - |
| SendGrid | sendgrid.com | Populaire, robuste | Config plus complexe |
| Nodemailer + SMTP | Gmail/autre | Gratuit | Limites d'envoi, moins fiable |

#### Intégration backend

```typescript
// backend/src/emails/emails.service.ts
import { Resend } from 'resend';

@Injectable()
export class EmailsService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendReservationConfirmation(to: string, reservation: ReservationDetails) {
    await this.resend.emails.send({
      from: 'SpotFoot <noreply@spotfoot.app>',
      to,
      subject: `✅ Réservation confirmée - ${reservation.terrainName}`,
      html: this.buildConfirmationEmail(reservation),
    });
  }
}
```

#### État du code

| Composant | Fichier | Statut |
|-----------|---------|--------|
| Module emails | `backend/src/emails/` | ❌ À créer |
| Template confirmation | - | ❌ À créer |
| Intégration Resend | - | ❌ À configurer |

### 4.7 Règles métier MVP v1

| ID | Règle | Détail |
|----|-------|--------|
| R-01 | Durée fixe | Un créneau = 60 minutes |
| R-02 | Capacité fixe | Un créneau = 10 places max |
| R-03 | Réservation unique | Un créneau ne peut être réservé que par une personne (l'organisateur) |
| R-04 | Création admin only | Seuls les admins peuvent créer terrains et créneaux |
| R-05 | Statut automatique | OPEN → RESERVED quand quelqu'un réserve |

### 4.8 État du code MVP v1

| Composant | Fichier(s) | Statut | À faire |
|-----------|------------|--------|---------|
| **Landing page** | `mobile/app/screens/Landing.tsx` | ❌ | Créer (design Gemini) |
| **Emails** | `backend/src/emails/` | ❌ | Créer module + intégrer Resend |
| Auth backend | `backend/src/auth/` | ✅ | - |
| Auth frontend | `mobile/app/screens/Login.tsx` | ✅ | Polish UI |
| Slots backend | `backend/src/slots/` | ✅ | - |
| Slots frontend | `mobile/app/screens/SlotsList.tsx` | ✅ | Polish UI |
| Réservation backend | `backend/src/reservations/` | ✅ | - |
| Réservation frontend | `mobile/app/screens/SlotDetail.tsx` | ✅ | Polish UI |
| Admin backend | `backend/src/terrains/`, `slots.admin.controller.ts` | ✅ | - |
| Admin frontend | `mobile/app/screens/Admin.tsx` | ✅ | Polish UI |

### 4.9 Travail restant MVP v1

| Tâche | Description | Priorité |
|-------|-------------|----------|
| **Page d'accueil** | Créer la landing page (design avec Gemini) | P0 |
| **Emails de confirmation** | Intégrer Resend + envoyer email après réservation | P0 |
| Polish UI | Simplifier les écrans existants, améliorer l'ergonomie | P0 |
| Tests manuels | Vérifier tous les flows end-to-end | P0 |
| Fix bugs | Corriger les bugs identifiés pendant les tests | P0 |
| Déploiement | Mettre l'API en prod + build mobile | P1 |

---

## 5. MVP+ — Liens d'invitation + Paiement

### 5.1 Objectif

Permettre au joueur qui réserve de :
1. **Partager un lien** à ses potes pour qu'ils confirment leur présence
2. **Payer en ligne** pour valider définitivement la réservation

### 5.2 Périmètre fonctionnel

| Fonctionnalité | Description | Statut code |
|----------------|-------------|-------------|
| Génération lien | Token unique généré à la réservation | ✅ Codé |
| Page invitation | Affiche infos + boutons Accepter/Refuser | ✅ Codé |
| Accepter invitation | Incrémente compteur atomique | ✅ Codé |
| Refuser invitation | Log le refus | ✅ Codé |
| Paiement Stripe | Payer pour confirmer la réservation | ❌ À coder |
| Dashboard revenus | Gérant voit les paiements reçus | ❌ À coder |

> **Note**: Les liens d'invitation sont déjà codés côté backend (`/i/:token`) et frontend (`InviteLanding.tsx`). Il faut juste activer la feature dans l'UI et tester.

### 5.3 User Stories MVP+

#### Liens d'invitation

| ID | En tant que... | Je veux... | Afin de... |
|----|----------------|------------|------------|
| US-20 | Joueur | obtenir un lien après ma réservation | le partager à mes potes |
| US-21 | Joueur | copier le lien facilement | le coller dans WhatsApp |
| US-22 | Invité | ouvrir le lien et voir les infos | savoir de quoi il s'agit |
| US-23 | Invité | accepter l'invitation | confirmer ma venue |
| US-24 | Invité | refuser l'invitation | signaler que je ne viens pas |
| US-25 | Joueur | voir qui a accepté/refusé | savoir si on est assez |

#### Paiement

| ID | En tant que... | Je veux... | Afin de... |
|----|----------------|------------|------------|
| US-30 | Joueur | payer ma réservation par CB | valider définitivement |
| US-31 | Joueur | payer via Apple/Google Pay | aller plus vite |
| US-32 | Gérant | recevoir l'argent sur mon compte | être payé |
| US-33 | Gérant | voir un récap des paiements | suivre mes revenus |

### 5.4 Architecture paiement (Stripe)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │     │   Backend   │     │   Stripe    │
│   (Expo)    │     │  (NestJS)   │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Réserve        │                   │
       │──────────────────>│                   │
       │                   │                   │
       │ 2. Crée PaymentIntent                 │
       │                   │──────────────────>│
       │                   │                   │
       │ 3. Retourne clientSecret              │
       │<──────────────────│<──────────────────│
       │                   │                   │
       │ 4. Affiche Stripe Sheet               │
       │   (CB, Apple Pay, Google Pay)         │
       │                   │                   │
       │ 5. Paiement confirmé                  │
       │──────────────────>│                   │
       │                   │ 6. Webhook        │
       │                   │<──────────────────│
       │                   │                   │
       │ 7. Réservation validée                │
       │<──────────────────│                   │
```

### 5.5 Travail à faire MVP+

| Tâche | Description |
|-------|-------------|
| Activer liens invitation | Exposer le lien dans l'UI après réservation |
| Tester invitations | Vérifier le flow complet |
| Compte Stripe | Créer compte Stripe du gérant |
| Backend Stripe | Module NestJS pour PaymentIntent + webhooks |
| Frontend Stripe | Intégrer `@stripe/stripe-react-native` |
| UI paiement | Écran de paiement avec Stripe Sheet |
| Dashboard revenus | Vue admin des paiements reçus |

---

## 6. v2 — Fonctionnalités avancées (Backlog)

| Feature | Description |
|---------|-------------|
| Notifications push | Rappel 1h avant le match |
| Email de rappel | Rappel automatique la veille du match |
| Calendrier admin | Vue semaine/mois pour le gérant |
| Multi-complexes | Un gérant gère plusieurs sites |
| Récurrence | Réservation hebdo automatique |
| Historique | Voir ses anciens matchs |
| Stats joueur | Nombre de matchs joués, etc. |

---

## 7. Design et UX

### 7.1 Principes directeurs

| Principe | Application |
|----------|-------------|
| **Simplicité** | Max 3 clics pour réserver |
| **Clarté** | Infos essentielles visibles immédiatement |
| **Rapidité** | Chargement < 2s, pas d'animations bloquantes |
| **Mobile-first** | Optimisé pour smartphone, une main |

### 7.2 Design actuel

- **Thème** : Dark mode
- **Couleurs** : Cyan (#00D4FF) en accent, fond sombre (#030712)
- **Style** : Inspiré Linear/Stripe (moderne, épuré)
- **Animations** : Fade-in sur les cards, transitions fluides

### 7.3 Améliorations UI prévues

| Écran | Amélioration |
|-------|--------------|
| Login | Simplifier, enlever les animations superflues |
| Liste créneaux | Grouper par jour, améliorer la lisibilité |
| Détail créneau | Bouton réserver plus visible |
| Admin | Interface plus claire pour créer des créneaux |

---

## 8. Configuration et déploiement

### 8.1 Variables d'environnement

#### Backend (`backend/.env`)
```
MONGO_URI=mongodb://root:rootpass@localhost:27017/spotfoot?authSource=admin
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@spotfoot.com
PORT=3001
```

#### Mobile (`mobile/app/config.ts`)
```typescript
export const API_BASE_URL = 'http://localhost:3001';
```

### 8.2 Lancer le projet en local

```bash
# 1. Démarrer MongoDB
docker-compose up -d

# 2. Démarrer le backend
cd backend && npm install && npm run start:dev

# 3. Démarrer le mobile
cd mobile && npm install && npx expo start
```

### 8.3 Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@spotfoot.com` | `admin123` | Admin |
| (créer via signup) | - | User |

---

## 9. Glossaire

| Terme | Définition |
|-------|------------|
| **Five** | Foot indoor en 5 contre 5 |
| **Créneau (Slot)** | Plage horaire réservable (ex: 18h-19h) |
| **Terrain** | Un espace de jeu dans le complexe |
| **Organisateur** | Le joueur qui crée la réservation |
| **Invité** | Un pote qui reçoit le lien d'invitation |
| **Gérant** | Le propriétaire/manager du complexe (admin) |

---

## 10. Contacts

| Rôle | Nom |
|------|-----|
| Développeurs | Erblin & Omar |
| Client (Gérant) | À compléter |

---

*Document mis à jour le 18/01/2026 — SpotFoot PRD v1.1*
