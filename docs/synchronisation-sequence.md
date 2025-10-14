# Diagramme de séquence - Synchronisation BDD locale/distante

## Scénario 1 : Réservation en ligne

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant M as Mobile App
    participant S as SQLite Local
    participant API as Backend API
    participant DB as MongoDB

    U->>M: Créer réservation
    M->>S: Sauvegarder (status: pending)
    M->>API: POST /reservations
    API->>DB: Insérer réservation
    DB-->>API: Confirmation + inviteUrl
    API-->>M: Response avec inviteUrl
    M->>S: Mettre à jour (status: synced)
    M-->>U: Confirmation "Réservation synchronisée"
```

## Scénario 2 : Réservation hors ligne

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant M as Mobile App
    participant S as SQLite Local
    participant Q as Queue Sync
    participant API as Backend API
    participant DB as MongoDB

    Note over M: Mode hors ligne détecté
    U->>M: Créer réservation
    M->>S: Sauvegarder (status: pending)
    M->>Q: Ajouter action CREATE_RESERVATION
    M-->>U: "Sauvegardée localement"
    
    Note over M: Connexion rétablie
    M->>M: Détection connexion
    M->>Q: Traiter queue
    Q->>API: POST /reservations
    API->>DB: Insérer réservation
    DB-->>API: Confirmation + inviteUrl
    API-->>Q: Response
    Q->>S: Mettre à jour (status: synced)
    Q->>Q: Marquer action completed
```

## Scénario 3 : Synchronisation au démarrage

```mermaid
sequenceDiagram
    participant M as Mobile App
    participant S as SQLite Local
    participant Q as Queue Sync
    participant API as Backend API

    M->>M: Démarrage app
    M->>S: Charger réservations locales
    S-->>M: Liste réservations
    M->>Q: Vérifier actions en attente
    Q-->>M: Actions pending
    
    alt Si connexion disponible
        M->>M: Traiter queue sync
        loop Pour chaque action
            M->>API: Envoyer action
            API-->>M: Confirmation
            M->>Q: Marquer completed
            M->>S: Mettre à jour status
        end
    else Pas de connexion
        M->>M: Attendre connexion
    end
```

## Scénario 4 : Gestion des erreurs de sync

```mermaid
sequenceDiagram
    participant M as Mobile App
    participant Q as Queue Sync
    participant API as Backend API
    participant S as SQLite Local

    M->>Q: Traiter action
    Q->>API: POST /reservations
    API-->>Q: Erreur 500
    
    alt Tentative < 3
        Q->>Q: Incrémenter attempts
        Q->>Q: Status = pending
        Note over Q: Réessayer plus tard
    else Tentative >= 3
        Q->>Q: Status = failed
        Q->>S: Mettre à jour (status: failed)
        M-->>M: Notifier utilisateur
    end
```

## Architecture des données

### SQLite Local (Mobile)
- **Table `reservations`** : Réservations de l'utilisateur uniquement
- **Table `sync_queue`** : Actions à synchroniser avec le serveur
- **Données strictement nécessaires** : Pas de cache complet, seulement ce qui concerne l'utilisateur

### MongoDB (Serveur)
- **Collection `reservations`** : Toutes les réservations
- **Collection `slots`** : Tous les créneaux
- **Collection `terrains`** : Tous les terrains
- **Collection `users`** : Tous les utilisateurs

## Stratégie de synchronisation

1. **Priorité locale** : L'utilisateur peut toujours voir ses réservations
2. **Sync opportuniste** : Synchronisation dès que possible
3. **Queue persistante** : Les actions hors ligne ne sont jamais perdues
4. **Retry avec backoff** : 3 tentatives maximum avec délai croissant
5. **Indicateurs visuels** : Status de sync visible (SYNC/EN ATTENTE/ERREUR)

## Avantages de cette approche

✅ **Fonctionnement hors ligne** : L'utilisateur peut réserver même sans connexion  
✅ **Données minimales** : Seulement les réservations de l'utilisateur en local  
✅ **Synchronisation robuste** : Gestion des erreurs et retry automatique  
✅ **UX fluide** : Feedback immédiat, sync transparente  
✅ **Cohérence** : Les données locales et distantes restent synchronisées  
