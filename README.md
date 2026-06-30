---
noteId: "5df0f2a0747a11f1b22701c2c93434e8"
tags: []

---

# Retro Arcade Leaderboard

API de classements multi-jeux pour bornes d'arcade retro (Pac-Man, Tetris, Snake, Breakout, Donkey Kong).

## Stack technique

- **API** : Node.js / Express
- **Base de donnees** : MySQL
- **Monitoring** : Prometheus + Grafana
- **Conteneurisation** : Docker + Docker Compose
- **Tests** : Jest
- **CI** : GitHub Actions
- **Test de charge** : k6

## Lancer le projet

### Mode developpement

```bash
docker compose up --build
```

Le fichier `docker-compose.override.yml` est applique automatiquement : le code source est monte en volume et l'API redemarre a chaque modification.

### Mode production

```bash
docker compose -f docker-compose.yml up --build -d
```

Seul le fichier `docker-compose.yml` est utilise : l'image est construite avec le code embarque, pas de volume, redemarrage automatique.

## Acces aux services

| Service    | URL                    |
|------------|------------------------|
| API        | http://localhost:3001  |
| Prometheus | http://localhost:9090  |
| Grafana    | http://localhost:3000 (admin / admin) |

## Routes de l'API

| Methode | Route                  | Description                          |
|---------|------------------------|--------------------------------------|
| POST    | `/scores`              | Soumettre un score                   |
| GET     | `/leaderboard/{game}`  | Classement d'un jeu (top N)          |
| GET     | `/players/{player}`    | Meilleurs scores d'un joueur         |
| GET     | `/games`               | Liste des jeux geres                 |
| GET     | `/health`              | Etat de sante du service             |
| GET     | `/metrics`             | Metriques Prometheus                 |

## Alertes configurees

- Service indisponible (API down)
- Latence elevee (p95 > 500ms)
- Taux d'erreur 5xx superieur a 10%
- Pic de tentatives de triche

## Test de charge

```bash
k6 run k6/load_test.js
```

Le script monte progressivement en charge et sollicite les routes principales. L'impact est observable dans le dashboard Grafana.
