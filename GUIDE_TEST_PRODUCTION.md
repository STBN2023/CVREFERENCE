# 🚀 Guide de Test en Production

## ✅ Statut des serveurs

- **Backend** : ✅ http://localhost:4000 (API d'enrichissement PowerPoint)
- **Frontend** : ✅ http://localhost:8080 (Interface React)

## 🔄 Workflow de test complet

### 1. **Page d'accueil** (`/`)
- Cliquer sur "Go 🚀" pour commencer le processus

### 2. **Sélection d'équipe** (`/team`)
- Ajouter des membres d'équipe
- Uploader leurs CV PowerPoint
- Passer à l'étape suivante

### 3. **Sélection de références** (`/references`)
- Ajouter des références projets avec :
  - Nom de résidence
  - Maître d'ouvrage (MOA)
  - Montant
  - Type de travaux
  - Année de réalisation

### 4. **Association** (`/association`)
- Associer les références aux membres d'équipe
- Maximum 5 références par membre

### 5. **Récapitulatif** (`/recap`)
- Vérifier les associations
- **TESTER L'ENRICHISSEMENT** : Cliquer sur "Télécharger CV enrichi" pour chaque membre

## 🧪 Points de test critiques

### ✅ Test d'enrichissement PowerPoint
1. **Prérequis** : Avoir un membre avec CV uploadé et références associées
2. **Action** : Cliquer sur "Télécharger CV enrichi" dans `/recap`
3. **Résultat attendu** :
   - Téléchargement automatique du fichier `cv_enrichi.pptx`
   - Message de succès "CV enrichi téléchargé !"
   - Fichier contenant les références formatées

### ✅ Format des références dans le PowerPoint
Chaque référence apparaîtra comme :
```
[Nom de la résidence]
Maître d'ouvrage: [MOA]
Montant: [Montant] €
Type de travaux effectués: [Travaux]  Réalisation: [Année]
```

### ✅ Gestion des erreurs
- **CV manquant** : Message d'erreur approprié
- **Aucune référence** : CV avec placeholders vides
- **Erreur serveur** : Message "Erreur lors de la génération du CV enrichi"

## 🔍 Debugging en cas de problème

### Logs du serveur backend
Vérifier dans le terminal du serveur :
```
=== DÉBUT ENRICHISSEMENT CV ===
Fichier reçu: [nom].pptx - Taille: [taille] bytes
Références reçues: [nombre] éléments
✓ Fichier PowerPoint enrichi généré avec succès
```

### Vérification des placeholders
Le template PowerPoint doit contenir :
- `reference_1`
- `reference_2`
- `reference_3`
- `reference_4`
- `reference_5`

### Tests rapides via API directe
```bash
# Dans le dossier server/
npm test              # Test basique
npm run test:frontend # Test avec données réalistes
```

## 📋 Checklist de test production

- [ ] Page d'accueil accessible
- [ ] Ajout de membres d'équipe fonctionnel
- [ ] Upload de CV PowerPoint réussi
- [ ] Ajout de références fonctionnel
- [ ] Association références-membres fonctionnelle
- [ ] Page récapitulatif affiche les bonnes données
- [ ] **Téléchargement CV enrichi fonctionne**
- [ ] Fichier téléchargé contient les références
- [ ] Gestion d'erreurs appropriée

## 🎯 Scénarios de test recommandés

### Scénario 1 : Cas nominal
1. Ajouter 2 membres avec CV
2. Ajouter 3 références
3. Associer 2 références au membre 1, 1 référence au membre 2
4. Télécharger les CV enrichis

### Scénario 2 : Cas limites
1. Membre sans références associées
2. Membre avec 5 références (limite max)
3. Références avec données manquantes

### Scénario 3 : Gestion d'erreurs
1. Tentative de téléchargement sans CV uploadé
2. Serveur backend arrêté
3. Template PowerPoint corrompu

## 🚨 En cas de problème

1. **Vérifier les logs** du serveur backend
2. **Redémarrer les serveurs** si nécessaire
3. **Tester l'API directement** avec les scripts de test
4. **Vérifier le template** PowerPoint dans `server/template.pptx`

---

**🎉 L'application est prête pour les tests en production !**
