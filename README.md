# Projet Labyrinthe Electron

Application desktop multiplateforme de création et résolution de labyrinthes avec Electron, SQLite, bcryptjs et JWT.

## Fonctionnalités

- Authentification sécurisée avec inscription et connexion
- CRUD des labyrinthes stockés en SQLite au format JSON
- Génération automatique de labyrinthes selon taille et difficulté
- Résolution automatique avec affichage du chemin
- Interface administrateur pour gérer utilisateurs et labyrinthes

## Structure du projet

- `main.js` : processus principal Electron et gestion des IPC
- `preload.js` : pont sécurisé entre le renderer et le main
- `database.js` : connexion SQLite et opérations CRUD
- `auth.js` : inscription, connexion et JWT
- `labyrinth.js` : génération et résolution des labyrinthes
- `admin.js` : statistiques et gestion administrateur
- `renderer/index.html` : interface utilisateur
- `renderer/style.css` : styles de l’application
- `renderer/app.js` : logique frontend et interaction avec l’API locale

## Installation

1. Ouvrir le dossier dans VS Code
2. Installer les dépendances :

```bash
npm install
```

3. Lancer l’application :

```bash
npm start
```

## Utilisation

- Créer un compte pour démarrer
- Générer un labyrinthe via l’onglet de création
- Enregistrer, visualiser, résoudre ou supprimer vos labyrinthes
- En tant qu’administrateur (`admin@labyrinthe.local` / `admin1234`), accéder à l’onglet administration

## Notes techniques

- Les utilisateurs sont stockés dans SQLite avec mot de passe hashé (`bcryptjs`)
- La session est maintenue via un JWT stocké en `localStorage`
- Les labyrinthes sont enregistrés sous forme JSON dans la base de données
- L’algorithme de génération utilise une découpe récursive du labyrinthe
- La résolution automatique utilise une recherche en largeur (BFS) pour trouver le chemin

## Améliorations possibles

- Export/import de labyrinthes
- Drag & drop ou éditeur en temps réel
- Version multi-utilisateur et stockage distant
- Création de l’exécutable Windows avec `electron-builder`
