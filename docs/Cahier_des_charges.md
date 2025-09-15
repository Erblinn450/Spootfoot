# SpotFoot — Cahier des charges (Page 1)

## 1. Contexte
- Réserver rapidement un créneau de 1h sur un terrain de foot (capacité 10).
- Partager un lien d’invitation ouvert pour que les amis confirment leur présence.

## 2. Objectif produit (one-liner)
SpotFoot permet à un joueur d’ouvrir un créneau 1h (capacité 10) et de partager un lien pour recueillir les réponses "Je viens / Je ne peux pas".

## 3. Objectifs SMART (exemples)
- S: Un utilisateur peut créer un créneau avec date/heure, terrain (libre/nom), capacité (par défaut 10).
- M: Le créneau apparaît dans la liste des sessions; au moins 10 confirmations gérées.
- A: Réalisable en 2 sprints pour un MVP mobile + API.
- R: Répond à un besoin de coordination rapide entre amis.
- T: MVP utilisable en 2 semaines, V1 en 4 semaines.

## 4. Périmètre MVP
- Création de créneau (heure de début, durée 1h fixe, capacité 10 par défaut).
- Génération d’un lien d’invitation anonyme (token unique) à partager.
- Page d’invitation (mobile) permettant de répondre "Je viens" / "Je ne peux pas".
- Comptage participants confirmés/refusés.
- Liste des créneaux créés par l’organisateur sur son appareil.

Hors périmètre MVP:
- Authentification complète, paiements, réservations réelles de terrain, notifications push.

## 5. Règles / Contraintes
- Capacité fixe 10 pour MVP; durée fixe 1h.
- Lien d’invitation non authentifié; token expirable (ex: 48h) pour sécurité basique.
- API NestJS, stockage MongoDB.
- Application mobile Expo.

## 6. Risques & Atténuations
- Adoption lente: simplifier au maximum le parcours.
- Spam de liens: limiter via expiration token et rate-limit basique.
- Conflits horaire: éviter via UI claire et messages d’erreur.

## 7. KPIs
- Taux de réponses aux invitations.
- Délai moyen entre création et 10 confirmations.
- Rétention D7 (si on ajoute de l’historique plus tard).

## 8. Planning initial (sprints)
- Sprint 1: Structure du repo, Docker Mongo, création sessions (API), écran création (mobile).
- Sprint 2: Lien invitation + page de réponse, compteur de participants, liste des sessions.
- Sprint 3: Améliorations UX, validations, tests e2e basiques.

## 9. Diagramme (ébauche conceptuelle)
- `Session`: id, startsAt, duration=60, capacity=10, location, token, attendees: [userName?, status]
- `AttendanceStatus`: COMING | CANT

## 10. Annexes
- URL Mongo Express: http://localhost:8081
- Connexion API: `MONGO_URI=mongodb://root:rootpass@localhost:27017/spotfoot?authSource=admin`
