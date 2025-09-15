# Contribuer à SpotFoot

## Branches
- `main`: stable
- `develop`: intégration
- `feature/<topic>`: une fonctionnalité par branche

## Flux de travail
1. Créer une branche `feature/<topic>` depuis `develop`.
2. Des commits courts et explicites (impératifs): `feat:`, `fix:`, `chore:`, `docs:`…
3. Ouvrir une PR vers `develop` en utilisant le template (`.github/pull_request_template.md`).
4. S’assurer que la CI (lint/test) passe.
5. Squash & merge.

## Qualité
- VS Code: installer les extensions recommandées (`.vscode/extensions.json`).
- Formatage auto à l’enregistrement (`.vscode/settings.json`).
- Lint: `npm run lint` dans `backend/`.

## Démarrage local
- MongoDB:
  ```bash
  docker compose -f infra/docker-compose.yml up -d
  ```
- Backend:
  ```bash
  cd backend
  cp env.example .env
  npm install
  npm run start:dev
  ```

## Conventions de commit (suggestion)
- `feat: …` nouvelle fonctionnalité
- `fix: …` correction de bug
- `chore: …` maintenance, CI, dépendances
- `docs: …` documentation
