# 📋 RÈGLES DES PLACEHOLDERS - CV ENRICHMENT

## 🎯 Vue d'ensemble

L'application d'enrichissement de CV PowerPoint utilise un système de placeholders pour injecter dynamiquement les références projets dans les templates PowerPoint.

## 📝 Placeholders disponibles

### 🔍 Placeholders détectés dans le template actuel

D'après l'analyse du fichier `template.pptx`, les placeholders suivants sont utilisés :

| Placeholder | Description | Données source |
|-------------|-------------|----------------|
| `{{REF_RESIDENCE}}` | Nom du projet/résidence | `ref.nom_projet` ou `ref.residence` |
| `{{REF_MOA}}` | Maître d'ouvrage/Client | `ref.client` ou `ref.moa` |
| `{{REF_MONTANT}}` | Montant du projet | `ref.montant` (formaté en euros) |
| `{{REF_TRAVAUX}}` | Type de mission/travaux | `ref.type_mission` ou `ref.travaux` |
| `{{REF_REALISATION}}` | Année de réalisation | `ref.annee` ou `ref.realisation` |

### 📊 Statistiques template

- **Slides analysés** : 13
- **Total placeholders** : 25 occurrences
- **Types uniques** : 5 placeholders différents

## 🔧 Logique de remplacement

### 1. Données d'entrée (format JSON)

```json
{
  "nom_projet": "Tour Majunga",
  "client": "Société Générale", 
  "montant": 12000000,
  "annee": 2021,
  "type_mission": "Construction",
  "ville": "Paris",
  "description_projet": "Construction d'une tour de bureaux de 45 étages."
}
```

### 2. Mapping des placeholders

```javascript
const placeholderData = {
  'REF_RESIDENCE': references.map(ref => ref.nom_projet || ref.residence || 'Projet non spécifié').join(', '),
  'REF_MOA': references.map(ref => ref.client || ref.moa || 'Client non spécifié').join(', '),
  'REF_MONTANT': references.map(ref => ref.montant ? `${ref.montant.toLocaleString()} €` : 'Non spécifié').join(', '),
  'REF_TRAVAUX': references.map(ref => ref.type_mission || ref.travaux || 'Mission non spécifiée').join(', '),
  'REF_REALISATION': references.map(ref => ref.annee || ref.realisation || 'Année non spécifiée').join(', ')
};
```

### 3. Exemple de résultat

Pour 2 références :
- `{{REF_RESIDENCE}}` → `"Tour Majunga, Hôpital Sud"`
- `{{REF_MOA}}` → `"Société Générale, CHU Lyon"`
- `{{REF_MONTANT}}` → `"12 000 000 €, 8 000 000 €"`
- `{{REF_TRAVAUX}}` → `"Construction, Rénovation"`
- `{{REF_REALISATION}}` → `"2021, 2019"`

## 🚨 Problèmes identifiés

### ❌ Incohérence actuelle

- **Template utilise** : `{{REF_RESIDENCE}}`, `{{REF_MOA}}`, etc.
- **Backend cherche** : `{{REFS}}` uniquement
- **Résultat** : Aucun remplacement effectué

### ✅ Solutions possibles

#### Option 1 : Modifier le backend (RECOMMANDÉ)
```javascript
// Remplacer chaque placeholder spécifique
Object.entries(placeholderData).forEach(([placeholder, value]) => {
  const pattern = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
  xmlContent = xmlContent.replace(pattern, value);
});
```

#### Option 2 : Modifier le template
- Remplacer tous les placeholders par `{{REFS}}`
- Utiliser un format texte unique

## 📋 Format de données recommandé

### Structure JSON standard

```json
{
  "nom_projet": "string",      // Nom du projet
  "client": "string",          // Client/MOA
  "montant": number,           // Montant en euros
  "annee": number,             // Année de réalisation
  "type_mission": "string",    // Type de mission
  "ville": "string",           // Ville du projet
  "description_projet": "string" // Description détaillée
}
```

### Champs alternatifs supportés

```json
{
  "residence": "string",       // Alternative à nom_projet
  "moa": "string",            // Alternative à client
  "travaux": "string",        // Alternative à type_mission
  "realisation": number       // Alternative à annee
}
```

## 🔄 Processus de remplacement

1. **Lecture** du fichier PPTX (JSZip)
2. **Extraction** des fichiers XML des slides
3. **Recherche** des placeholders dans chaque slide
4. **Remplacement** par les données formatées
5. **Génération** du nouveau fichier PPTX
6. **Sauvegarde** dans le dossier `/downloads`

## 🧪 Tests et vérification

### Script de vérification

```bash
node verify-placeholders.js
```

Ce script :
- ✅ Analyse le template original
- ✅ Vérifie les placeholders non remplacés
- ✅ Détecte les références injectées
- ✅ Compare template vs CV générés

### Commandes de test

```bash
# Test complet avec données réelles
node tests/test-real-app-data.js

# Test de remplacement simple
node tests/test-enrichment.js

# Vérification du contenu visible
node tests/test-visible-content.js
```

## 📊 Métriques de qualité

### ✅ Critères de succès

- [ ] Tous les placeholders du template sont remplacés
- [ ] Aucun placeholder `{{...}}` ne reste dans le CV final
- [ ] Les données sont correctement formatées
- [ ] Le fichier PPTX généré est valide
- [ ] Le contenu est visible dans PowerPoint

### 🔍 Points de contrôle

1. **Template** : Placeholders présents et cohérents
2. **Backend** : Logique de remplacement correcte
3. **Données** : Format JSON valide et complet
4. **Résultat** : CV enrichi sans placeholders résiduels

## 📝 Notes de développement

- **Encodage** : UTF-8 pour les caractères accentués
- **Format** : PowerPoint Open XML (.pptx)
- **Bibliothèque** : JSZip pour manipulation des archives
- **Regex** : `/\{\{PLACEHOLDER\}\}/g` pour remplacement global

---

**Dernière mise à jour** : 22/07/2025  
**Version** : 1.0  
**Statut** : 🔧 Correction en cours
