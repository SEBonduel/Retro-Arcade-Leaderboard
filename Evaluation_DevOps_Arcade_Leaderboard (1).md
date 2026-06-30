---
noteId: "8b56b170747b11f1b22701c2c93434e8"
tags: []

---

# Évaluation DevOps : Retro Arcade Leaderboard

## Contexte

Les bornes d'arcade rétro ont la cote, et la question reste toujours la même : qui a le meilleur score ? Votre mission : construire le back-office de cette compétition. En clair, une API de classements multi-jeux (Pac-Man, Tetris, Snake...) capable d'encaisser beaucoup de soumissions de scores, de repérer les tricheurs, et d'être exploitable en production : conteneurisée, testée, intégrée en continu, monitorée et alertée.

Le code de l'API compte moins que tout ce qu'il y a autour. Ce qu'on évalue, c'est votre capacité à livrer une application comme en vrai : automatisée, observable et capable de tenir la charge.

## Modalités

- Durée : 3h30.
- Travail en solo.
- Notation sur 20 (voir le barème en fin de sujet).
- Stack technique libre : choisissez le langage et le framework que vous voulez (Python, Node, Go, Java...).
- Livraison : un dépôt Git, avec un `.gitignore` correct, des commits réguliers et un `README.md` qui explique comment lancer le projet.
- Si le dépôt est privé, ajoutez-moi en tant que collaborateur (cbrasseur) et envoyez-moi le lien du repo sur Discord.

## Partie 1 : l'API (contrat fonctionnel imposé)

Vous devez exposer une API HTTP qui respecte le contrat ci-dessous. L'implémentation reste libre, mais les routes, les codes de retour et les règles métier sont imposés.

### Les jeux et leurs scores maximum

Cinq jeux sont gérés, chacun avec un score maximum « humainement atteignable » qui sert à l'anti-triche :

```
pacman      ->   999 999
tetris      -> 9 999 999
snake       ->    99 999
breakout    ->   896 980
donkeykong  -> 1 247 700
```

### Les routes attendues

- `POST /scores`
  - Corps : `{ "player": "AAA", "game": "pacman", "score": 123456 }`
  - Succès : 201 avec le rang obtenu, ex. `{ "rank": 4 }`.
  - Doit appliquer les règles anti-triche (voir plus bas).
- `GET /leaderboard/{game}?limit=10`
  - Renvoie le top des scores du jeu, trié du meilleur au moins bon.
  - `limit` est optionnel (défaut 10, plafonné à 100).
- `GET /players/{player}`
  - Renvoie les meilleurs scores du joueur, tous jeux confondus.
- `GET /games`
  - Renvoie la liste des jeux gérés et leur score maximum.
- `GET /health`
  - Renvoie l'état de santé du service, ex. `{ "status": "ok" }`. Utilisée par le healthcheck Docker.
- `GET /metrics`
  - Expose les métriques au format Prometheus (voir Partie 5).

### Règles anti-triche

Un score est rejeté (avec un code `4xx` approprié : `400`, `422`, `429`...) si :
- le jeu n'existe pas dans la liste gérée ;
- le score est négatif ;
- le score dépasse le maximum autorisé du jeu ;
- le joueur soumet trop vite : cooldown d'au moins 2 secondes entre deux soumissions du même joueur sur le même jeu (anti-spam / anti-bot).

Chaque rejet doit être comptabilisé dans une métrique avec son motif (voir Partie 5). C'est ce qui vous permettra ensuite de visualiser et d'alerter sur les tentatives de triche.

### Persistance

Les scores doivent survivre à un redémarrage de l'application (base de données, volume...). Le choix de la techno de stockage est libre.

## Partie 2 : tests unitaires

Écrivez au moins 3 tests unitaires ciblant la logique métier. Pas besoin de viser une couverture exhaustive. Quelques pistes :
- un score valide est accepté ;
- un score supérieur au maximum du jeu est rejeté ;
- le classement est bien trié du meilleur au moins bon ;
- le cooldown rejette une soumission trop rapprochée.

Info : concevez votre logique métier de manière testable (fonctions pures, séparées de la couche HTTP et de la base). C'est ce qui rend les tests simples à écrire.

## Partie 3 : intégration continue (la plus complète possible)

Mettez en place une CI (GitHub Actions, GitLab CI...) qui s'exécute à chaque push. Elle doit enchaîner au minimum :
- Build : installation des dépendances / build du projet.
- Linter : analyse statique du code (ruff/pylint, eslint, golangci-lint...).
- Tests : exécution des tests unitaires.
- Analyse de sécurité (SAST) : recherche de vulnérabilités dans le code (Bandit, Semgrep...).
- Analyse des dépendances : recherche de CVE connues dans vos dépendances (pip-audit, npm audit, Trivy...).
- Scan de l'image Docker : analyse de l'image construite (Trivy).

Bonus : une analyse SonarQube / SonarCloud intégrée à la CI (qualité, couverture, code smells).

Ce qu'on attend :
- Le pipeline est vert sur votre dépôt (capture d'écran ou lien dans le README).
- Un échec d'une étape (test qui casse, CVE critique...) fait bien échouer le pipeline.

## Partie 4 : conteneurisation (dev et prod séparés)

Votre application doit être entièrement conteneurisée.
- Un `Dockerfile` (idéalement multi-stage) pour construire l'image de l'application.
- Une orchestration Docker Compose avec deux environnements distincts :
  - Développement : rechargement à chaud du code (hot-reload), code source monté en volume, logs verbeux, bref de quoi itérer vite.
  - Production : image construite (pas de montage du code source), serveur applicatif, politiques de redémarrage (`restart`).

On doit pouvoir lancer toute la stack (API + base + monitoring) avec une seule commande `docker compose ... up`.

Info : la différence dev/prod peut se faire avec deux fichiers compose (override) ou des profils. L'important, c'est que les deux modes soient réels et justifiés, pas un simple copier-coller.

## Partie 5 : monitoring (Prometheus + Grafana)

Votre application doit être observable.
- Elle expose des métriques sur `GET /metrics` au format Prometheus. Au minimum :
  - nombre de requêtes HTTP (par route et par code de statut) ;
  - latence des requêtes (histogramme) ;
  - nombre de scores soumis (par jeu) ;
  - nombre de scores rejetés (par jeu et par motif) ;
  - nombre de consultations de classement.
- Prometheus scrape l'application.
- Grafana affiche un dashboard avec au moins : trafic, latence (p95), taux d'erreur, et un panneau « tentatives de triche » (scores rejetés).

La configuration peut se faire de deux façons : soit par des fichiers de provisioning montés dans les conteneurs (`prometheus.yml`, datasource et dashboard Grafana en `.yml` / `.json`), ce qui est la méthode recommandée car reproductible, soit manuellement dans Grafana et Prometheus si vous préférez. Dans tous les cas, le résultat doit être démontrable.

## Partie 6 : alerting en continu

Mettez en place des alertes qui surveillent le service en permanence. Au minimum trois alertes parmi :
- Service indisponible (l'application ne répond plus / `up == 0`).
- Latence élevée (p95 au-dessus d'un seuil).
- Taux d'erreur élevé (trop de réponses 5xx).
- Pic de triche (taux de scores rejetés anormalement haut).

Les alertes peuvent être gérées via les règles Prometheus + Alertmanager, ou via le système d'alerting de Grafana. Vous devez pouvoir démontrer le déclenchement d'au moins une alerte, par exemple en arrêtant l'API ou en lançant le test de charge de la Partie 7.

## Partie 7 : test de montée en charge

Écrivez un test de charge avec k6 (recommandé) ou JMeter qui :
- monte progressivement en charge (ramp-up de la concurrence) ;
- sollicite vos routes principales (soumission de scores et consultation de classements) ;
- permet d'observer l'impact dans Grafana (montée du trafic, de la latence) ;
- est capable de déclencher au moins une alerte de la Partie 6.

Ce qu'on attend :
- Le script de charge est fourni dans le dépôt.
- Une capture d'écran (ou une démo) montre l'effet de la charge dans Grafana et/ou une alerte déclenchée.

## Livrables

- Le dépôt Git complet : le code de l'API, les tests, le `Dockerfile` et les fichiers Compose (dev + prod), la configuration CI, la configuration Prometheus/Grafana/alerting, et le script de charge.
- Un `README.md` qui explique les choix techniques, comment lancer le projet (dev et prod), et où voir le monitoring et les alertes.
- Quelques captures d'écran : CI verte, dashboard Grafana, alerte déclenchée.

## Barème (sur 20) - Il sera pas respecté à la lettre, d'est un barème "indicatif"

Le respect complet et fonctionnel des attendus donne 17/20. Les 3 points restants récompensent ce qui dépasse les attentes : qualité, soin, bonus Sonar, pertinence des alertes, dashboard travaillé, documentation soignée, sécurité poussée.

- API conforme au contrat (routes, codes, règles anti-triche, persistance) : 4 pts
- Tests unitaires pertinents et qui passent : 2 pts
- CI (build, linter, tests, SAST, dépendances, scan image) qui échoue quand il le faut : 4 pts
- Conteneurisation : Dockerfile + dev/prod réellement distincts, stack lançable en une commande : 3 pts
- Monitoring : `/metrics` exposées, Prometheus qui scrape, dashboard Grafana lisible : 2 pts
- Alerting : au moins 3 alertes, déclenchement démontré : 1 pt
- Montée en charge : script k6/JMeter fonctionnel, impact observable : 1 pt
- Dépassement des attentes (bonus Sonar, qualité, soin, doc, sécurité...) : 3 pts

Pénalités possibles :
- Dépôt sans `.gitignore` ou avec des secrets/artefacts commités : -2 pts.
- Pas de séparation dev/prod réelle : -2 pts.
- Application qui ne démarre pas en l'état : -3 pts.

Bon courage.
