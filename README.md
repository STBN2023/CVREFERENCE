# Application d'enrichissement de CV PowerPoint

Cette application permet de générer automatiquement des CV PowerPoint enrichis avec des références de projets.

## Architecture

- **Frontend** : React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend** : Node.js + Express + pptx-automizer pour manipulation PowerPoint
- **Routing** : React Router avec pages principales (Home, Team, Admin, References, etc.)

## Prérequis

- Node.js (version 14 ou supérieure)
- npm (généralement inclus avec Node.js)

## Installation

```bash
# Cloner le repository
git clone <url-du-repository>

# Installer les dépendances du frontend
cd sleepy-parrot-hop
npm install

# Installer les dépendances du backend
cd server
npm install
```

## Démarrage de l'application

### Démarrage du frontend

```bash
# Depuis le dossier racine du projet
cd sleepy-parrot-hop
npm run dev
```

Le frontend sera accessible à l'adresse : http://localhost:8081

### Démarrage du backend

```bash
# Depuis le dossier server
cd sleepy-parrot-hop/server
npm start
```

Le backend sera accessible à l'adresse : http://localhost:4000

## Utilisation

1. Accédez à l'application via http://localhost:8081
2. Suivez le workflow :
   - Sélection d'équipe (/team)
   - Sélection de références (/references)
   - Association références-équipe (/association)
   - Récapitulatif (/recap)
   - Génération CV enrichi via API backend

## Structure du projet

- `/src` : Code frontend React
- `/server` : API Node.js avec endpoint `/api/enrich-cv`
- Templates PowerPoint dans `/server` pour l'enrichissement

## Tests

Des scripts de test sont disponibles dans le dossier `/server` :

```bash
# Test d'intégration complète
cd server
npm test

# Test spécifique
cd server
npm run test:frontend
```
