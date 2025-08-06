const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const cors = require('cors');
const dbManager = require('./database/database');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration multer pour upload
const upload = multer({ dest: 'uploads/' });

// Dossiers
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

// Fonction utilitaire pour sécuriser les noms de fichiers
function safeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ===== ENDPOINTS =====

// Test de santé
app.get('/api/test', (req, res) => {
  console.log('🔍 [API] Test endpoint appelé');
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    message: 'Backend fonctionnel'
  });
});

// ===== ENDPOINTS BASE DE DONNÉES =====

// Récupérer tous les salariés
app.get('/api/salaries', async (req, res) => {
  console.log('👥 [API] Récupération des salariés');
  try {
    const salaries = await dbManager.getAllSalaries();
    console.log(`✅ [API] ${salaries.length} salariés trouvés`);
    res.json({ salaries });
  } catch (error) {
    console.error('❌ [API] Erreur salariés:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des salariés' });
  }
});

// Récupérer toutes les références
app.get('/api/references', async (req, res) => {
  console.log('📋 [API] Récupération des références');
  try {
    const references = await dbManager.getAllReferences();
    console.log(`✅ [API] ${references.length} références trouvées`);
    res.json({ references });
  } catch (error) {
    console.error('❌ [API] Erreur références:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des références' });
  }
});

// Récupérer un salarié par ID
app.get('/api/salaries/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`👤 [API] Récupération salarié ID: ${id}`);
  try {
    const salarie = await dbManager.getSalarieById(id);
    if (!salarie) {
      return res.status(404).json({ error: 'Salarié non trouvé' });
    }
    res.json({ salarie });
  } catch (error) {
    console.error('❌ [API] Erreur salarié:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération du salarié' });
  }
});

// Récupérer les références d'un salarié
app.get('/api/salaries/:id/references', async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [API] Récupération références salarié ID: ${id}`);
  try {
    const references = await dbManager.getReferencesBySalarie(id);
    console.log(`✅ [API] ${references.length} références trouvées pour salarié ${id}`);
    res.json({ references });
  } catch (error) {
    console.error('❌ [API] Erreur références salarié:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des références' });
  }
});

// Ajouter un nouveau salarié
app.post('/api/salaries', async (req, res) => {
  console.log('➕ [API] Ajout nouveau salarié');
  try {
    const result = await dbManager.addSalarie(req.body);
    console.log(`✅ [API] Salarié ajouté avec ID: ${result.id}`);
    res.status(201).json({ id: result.id, message: 'Salarié ajouté avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur ajout salarié:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du salarié' });
  }
});

// Ajouter une nouvelle référence
app.post('/api/references', async (req, res) => {
  console.log(' [API] Ajout nouvelle référence');
  try {
    const result = await dbManager.addReference(req.body);
    console.log(` [API] Référence ajoutée avec ID: ${result.id}`);
    res.status(201).json({ id: result.id, message: 'Référence ajoutée avec succès' });
  } catch (error) {
    console.error(' [API] Erreur ajout référence:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la référence' });
  }
});

// Modifier un salarié existant
app.put('/api/salaries/:id', async (req, res) => {
  const { id } = req.params;
  console.log(` [API] Modification salarié ID: ${id}`);
  try {
    const result = await dbManager.updateSalarie(id, req.body);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Salarié non trouvé' });
    }
    console.log(` [API] Salarié ${id} modifié avec succès`);
    res.json({ message: 'Salarié modifié avec succès' });
  } catch (error) {
    console.error(' [API] Erreur modification salarié:', error.message);
    res.status(500).json({ error: 'Erreur lors de la modification du salarié' });
  }
});

// Modifier une référence existante
app.put('/api/references/:id', async (req, res) => {
  const { id } = req.params;
  console.log(` [API] Modification référence ID: ${id}`);
  try {
    const result = await dbManager.updateReference(id, req.body);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Référence non trouvée' });
    }
    console.log(` [API] Référence ${id} modifiée avec succès`);
    res.json({ message: 'Référence modifiée avec succès' });
  } catch (error) {
    console.error(' [API] Erreur modification référence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la modification de la référence' });
  }
});

// ===================================
// ENDPOINTS TABLES DE RÉFÉRENCE
// ===================================

// Récupérer toutes les agences
app.get('/api/agences', async (req, res) => {
  console.log('🏢 [API] Récupération des agences');
  try {
    const agences = await dbManager.getAgences();
    console.log(`✅ [API] ${agences.length} agences trouvées`);
    res.json({ agences });
  } catch (error) {
    console.error('❌ [API] Erreur agences:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des agences' });
  }
});

// Ajouter une nouvelle agence
app.post('/api/agences', async (req, res) => {
  console.log('➕ [API] Ajout nouvelle agence');
  try {
    const result = await dbManager.addAgence(req.body);
    console.log(`✅ [API] Agence ajoutée avec ID: ${result.lastID}`);
    res.status(201).json({ id: result.lastID, message: 'Agence ajoutée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur ajout agence:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'agence' });
  }
});

// Mettre à jour une agence
app.put('/api/agences/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`✏️ [API] Mise à jour agence ID: ${id}`);
  try {
    await dbManager.updateAgence(id, req.body);
    console.log(`✅ [API] Agence ${id} mise à jour`);
    res.json({ message: 'Agence mise à jour avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour agence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'agence' });
  }
});

// Supprimer une agence
app.delete('/api/agences/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [API] Suppression agence ID: ${id}`);
  try {
    await dbManager.deleteAgence(id);
    console.log(`✅ [API] Agence ${id} supprimée`);
    res.json({ message: 'Agence supprimée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur suppression agence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'agence' });
  }
});

// Récupérer toutes les fonctions
app.get('/api/fonctions', async (req, res) => {
  console.log('💼 [API] Récupération des fonctions');
  try {
    const fonctions = await dbManager.getFonctions();
    console.log(`✅ [API] ${fonctions.length} fonctions trouvées`);
    res.json({ fonctions });
  } catch (error) {
    console.error('❌ [API] Erreur fonctions:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des fonctions' });
  }
});

// Ajouter une nouvelle fonction
app.post('/api/fonctions', async (req, res) => {
  console.log('➕ [API] Ajout nouvelle fonction');
  try {
    const result = await dbManager.addFonction(req.body);
    console.log(`✅ [API] Fonction ajoutée avec ID: ${result.lastID}`);
    res.status(201).json({ id: result.lastID, message: 'Fonction ajoutée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur ajout fonction:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la fonction' });
  }
});

// Mettre à jour une fonction
app.put('/api/fonctions/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`✏️ [API] Mise à jour fonction ID: ${id}`);
  try {
    await dbManager.updateFonction(id, req.body);
    console.log(`✅ [API] Fonction ${id} mise à jour`);
    res.json({ message: 'Fonction mise à jour avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour fonction:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la fonction' });
  }
});

// Supprimer une fonction
app.delete('/api/fonctions/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [API] Suppression fonction ID: ${id}`);
  try {
    await dbManager.deleteFonction(id);
    console.log(`✅ [API] Fonction ${id} supprimée`);
    res.json({ message: 'Fonction supprimée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur suppression fonction:', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression de la fonction' });
  }
});

// Récupérer tous les niveaux d'expertise
app.get('/api/niveaux', async (req, res) => {
  console.log('🎖️ [API] Récupération des niveaux d\'expertise');
  try {
    const niveaux = await dbManager.getNiveauxExpertise();
    console.log(`✅ [API] ${niveaux.length} niveaux trouvés`);
    res.json({ niveaux });
  } catch (error) {
    console.error('❌ [API] Erreur niveaux:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des niveaux' });
  }
});

// Ajouter un nouveau niveau d'expertise
app.post('/api/niveaux', async (req, res) => {
  console.log('➕ [API] Ajout nouveau niveau d\'expertise');
  try {
    const result = await dbManager.addNiveauExpertise(req.body);
    console.log(`✅ [API] Niveau ajouté avec ID: ${result.lastID}`);
    res.status(201).json({ id: result.lastID, message: 'Niveau ajouté avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur ajout niveau:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du niveau' });
  }
});

// Mettre à jour un niveau d'expertise
app.put('/api/niveaux/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`✏️ [API] Mise à jour niveau ID: ${id}`);
  try {
    await dbManager.updateNiveauExpertise(id, req.body);
    console.log(`✅ [API] Niveau ${id} mis à jour`);
    res.json({ message: 'Niveau mis à jour avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour niveau:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du niveau' });
  }
});

// Supprimer un niveau d'expertise
app.delete('/api/niveaux/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [API] Suppression niveau ID: ${id}`);
  try {
    await dbManager.deleteNiveauExpertise(id);
    console.log(`✅ [API] Niveau ${id} supprimé`);
    res.json({ message: 'Niveau supprimé avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur suppression niveau:', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression du niveau' });
  }
});

// Servir le template PowerPoint
app.get('/template.pptx', (req, res) => {
  console.log('📁 [TEMPLATE] Demande de template');
  const templatePath = path.join(__dirname, 'template.pptx');
  
  if (!fs.existsSync(templatePath)) {
    console.error('❌ [TEMPLATE] Fichier template.pptx introuvable');
    return res.status(404).json({ error: 'Template non trouvé' });
  }
  
  console.log('✅ [TEMPLATE] Envoi du template');
  res.sendFile(templatePath);
});

// Endpoint principal : enrichissement de CV
app.post('/api/enrich-cv', upload.single('pptx'), async (req, res) => {
  console.log('\n=== 🚀 [ENRICH-CV] DÉBUT TRAITEMENT ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    // 1. Validation du fichier
    if (!req.file) {
      console.error('❌ [ENRICH-CV] Aucun fichier fourni');
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    console.log('📁 [ENRICH-CV] Fichier reçu:', {
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });
    
    // 2. Parse des références
    let references = [];
    try {
      references = JSON.parse(req.body.references || '[]');
      console.log('📋 [ENRICH-CV] Références parsées:', references.length, 'éléments');
    } catch (err) {
      console.error('❌ [ENRICH-CV] Erreur parsing JSON:', err.message);
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Format JSON invalide pour les références' });
    }
    
    // 3. Lecture du fichier PPTX
    console.log('📖 [ENRICH-CV] Lecture du fichier PPTX...');
    const zip = new JSZip();
    const fileBuffer = fs.readFileSync(req.file.path);
    const content = await zip.loadAsync(fileBuffer);
    
    // 4. Construction du texte de remplacement
    const refsText = references.map((ref, index) => {
      const nom = ref.nom_projet || ref.residence || `Projet ${index + 1}`;
      const client = ref.client || ref.moa || 'Client non spécifié';
      const montant = ref.montant ? `${ref.montant.toLocaleString()} €` : 'Non spécifié';
      const annee = ref.annee || ref.realisation || 'Non spécifié';
      
      return `${index + 1}. ${nom}\n   Client: ${client}\n   Montant: ${montant}\n   Année: ${annee}`;
    }).join('\n\n') || 'Aucune référence disponible';
    
    console.log('📝 [ENRICH-CV] Texte de remplacement généré:', refsText.length, 'caractères');
    
    // 5. Remplacement dans les slides
    const files = Object.keys(content.files);
    let replacements = 0;
    
    for (const fileName of files) {
      if (fileName.includes('slide') && fileName.endsWith('.xml')) {
        const file = content.files[fileName];
        if (!file.dir) {
          const xmlContent = await file.async('string');
          
          // Chercher et remplacer {{REFS}}
          if (xmlContent.includes('{{REFS}}')) {
            console.log('🔄 [ENRICH-CV] Remplacement dans:', fileName);
            const newContent = xmlContent.replace(/\{\{REFS\}\}/g, refsText);
            content.file(fileName, newContent);
            replacements++;
          }
        }
      }
    }
    
    console.log('✅ [ENRICH-CV] Remplacements effectués:', replacements, 'fichiers modifiés');
    
    // 6. Génération du fichier de sortie
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputFilename = `cv_enrichi_${timestamp}.pptx`;
    const outputPath = path.join(downloadsDir, outputFilename);
    
    console.log('💾 [ENRICH-CV] Génération du fichier:', outputFilename);
    const outputBuffer = await content.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, outputBuffer);
    
    // 7. Nettoyage du fichier temporaire
    fs.unlinkSync(req.file.path);
    console.log('🧹 [ENRICH-CV] Fichier temporaire supprimé');
    
    // 8. Réponse de succès
    const response = {
      message: 'CV enrichi généré avec succès',
      filename: outputFilename,
      downloadUrl: `/api/download/${outputFilename}`,
      referencesCount: references.length,
      replacements: replacements,
      fileSize: outputBuffer.length
    };
    
    console.log('✅ [ENRICH-CV] Succès:', response);
    console.log('=== 🏁 [ENRICH-CV] FIN TRAITEMENT ===\n');
    
    res.json(response);
    
  } catch (error) {
    console.error('💥 [ENRICH-CV] ERREUR:', error.message);
    console.error('💥 [ENRICH-CV] Stack:', error.stack);
    
    // Nettoyage en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🧹 [ENRICH-CV] Fichier temporaire supprimé après erreur');
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'enrichissement du CV',
      details: error.message 
    });
  }
});

// Liste des fichiers téléchargeables
app.get('/api/downloads', (req, res) => {
  console.log('📁 [DOWNLOADS] Liste des téléchargements demandée');
  
  try {
    const files = fs.readdirSync(downloadsDir)
      .filter(f => f.endsWith('.pptx'))
      .map(f => {
        const fullPath = path.join(downloadsDir, f);
        const stat = fs.statSync(fullPath);
        return {
          filename: f,
          sizeBytes: stat.size,
          createdAt: stat.birthtimeMs || stat.ctimeMs,
          formattedSize: `${Math.round(stat.size / 1024)} KB`
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Plus récents en premier
    
    console.log('📊 [DOWNLOADS] Fichiers trouvés:', files.length);
    res.json({ files });
    
  } catch (error) {
    console.error('❌ [DOWNLOADS] Erreur:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
  }
});

// Téléchargement d'un fichier
app.get('/api/download/:filename', (req, res) => {
  const filename = safeFilename(req.params.filename);
  const filePath = path.join(downloadsDir, filename);
  
  console.log('⬇️ [DOWNLOAD] Téléchargement demandé:', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ [DOWNLOAD] Fichier introuvable:', filename);
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  
  console.log('✅ [DOWNLOAD] Envoi du fichier:', filename);
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('❌ [DOWNLOAD] Erreur envoi:', err.message);
    } else {
      console.log('✅ [DOWNLOAD] Fichier envoyé avec succès:', filename);
    }
  });
});

// Suppression d'un fichier
app.delete('/api/download/:filename', (req, res) => {
  const filename = safeFilename(req.params.filename);
  const filePath = path.join(downloadsDir, filename);
  
  console.log('🗑️ [DELETE] Suppression demandée:', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ [DELETE] Fichier introuvable:', filename);
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  
  try {
    fs.unlinkSync(filePath);
    console.log('✅ [DELETE] Fichier supprimé:', filename);
    res.json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('❌ [DELETE] Erreur suppression:', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Démarrage du serveur avec initialisation de la base de données
app.listen(PORT, async () => {
  console.log('\n🚀 ===== BACKEND CV ENRICHMENT =====');
  console.log(`🌐 Serveur démarré sur http://localhost:${PORT}`);
  console.log('📁 Dossier uploads:', uploadsDir);
  console.log('📁 Dossier downloads:', downloadsDir);
  
  // Initialiser la base de données
  try {
    await dbManager.initialize();
  } catch (error) {
    console.error('💥 [FATAL] Erreur initialisation base de données:', error);
    process.exit(1);
  }
  
  console.log('📋 Endpoints disponibles:');
  console.log('   • GET  /api/test');
  console.log('   • GET  /api/salaries');
  console.log('   • GET  /api/references');
  console.log('   • GET  /api/salaries/:id');
  console.log('   • GET  /api/salaries/:id/references');
  console.log('   • POST /api/salaries');
  console.log('   • POST /api/references');
  console.log('   • GET  /template.pptx');
  console.log('   • POST /api/enrich-cv');
  console.log('   • GET  /api/downloads');
  console.log('   • GET  /api/download/:filename');
  console.log('   • DEL  /api/download/:filename');
  console.log('=====================================\n');
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('💥 [FATAL] Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [FATAL] Promise rejetée:', reason);
  process.exit(1);
});
