const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const cors = require('cors');

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

// ===== FONCTION CORRIGÉE : REMPLACEMENT PAR SHAPE SPÉCIFIQUE =====
async function remplacerPlaceholdersParShape(content, references) {
  console.log('🔄 [REMPLACEMENT] Début du remplacement par shape nommée');
  console.log(`📊 [REMPLACEMENT] ${references.length} références à traiter`);
  
  const files = Object.keys(content.files);
  let replacements = 0;
  
  for (const fileName of files) {
    if (fileName.includes('slide') && fileName.endsWith('.xml')) {
      const file = content.files[fileName];
      if (!file.dir) {
        let xmlContent = await file.async('string');
        let fileModified = false;
        
        console.log(`📄 [REMPLACEMENT] Traitement de ${fileName}`);
        
        // Pour chaque référence, traiter la shape correspondante
        for (let refIndex = 0; refIndex < Math.min(references.length, 5); refIndex++) {
          const shapeName = `reference_${refIndex + 1}`;
          const ref = references[refIndex];
          
          console.log(`   🎯 [REMPLACEMENT] Traitement de ${shapeName} avec référence ${refIndex + 1}`);
          console.log(`   📋 [REMPLACEMENT] Données: ${ref.nom_projet || ref.residence} - ${ref.client || ref.moa}`);
          
          // Pattern plus précis pour isoler une shape spécifique
          const shapePattern = new RegExp(
            `(<p:sp[\\s\\S]*?<p:cNvPr[^>]*name="${shapeName}"[\\s\\S]*?<\\/p:sp>)`,
            'g'
          );
          
          let shapeMatch = shapePattern.exec(xmlContent);
          if (shapeMatch) {
            console.log(`     ✅ [REMPLACEMENT] Shape ${shapeName} trouvée`);
            
            let shapeContent = shapeMatch[1];
            let originalShapeContent = shapeContent;
            
            // Remplacer tous les placeholders dans cette shape spécifique
            const residence = ref.nom_projet || ref.residence || `Projet ${refIndex + 1}`;
            const moa = ref.client || ref.moa || 'Client non spécifié';
            const montant = ref.montant ? `${ref.montant.toLocaleString()} €` : 'Non spécifié';
            const travaux = ref.type_mission || ref.travaux || 'Mission non spécifiée';
            const realisation = ref.annee || ref.realisation || 'Année non spécifiée';
            
            shapeContent = shapeContent.replace(/\{\{REF_RESIDENCE\}\}/g, residence);
            shapeContent = shapeContent.replace(/\{\{REF_MOA\}\}/g, moa);
            shapeContent = shapeContent.replace(/\{\{REF_MONTANT\}\}/g, montant);
            shapeContent = shapeContent.replace(/\{\{REF_TRAVAUX\}\}/g, travaux);
            shapeContent = shapeContent.replace(/\{\{REF_REALISATION\}\}/g, realisation);
            
            console.log(`       → REF_RESIDENCE = "${residence}"`);
            console.log(`       → REF_MOA = "${moa}"`);
            console.log(`       → REF_MONTANT = "${montant}"`);
            console.log(`       → REF_TRAVAUX = "${travaux}"`);
            console.log(`       → REF_REALISATION = "${realisation}"`);
            
            // Remplacer la shape originale par la shape modifiée
            xmlContent = xmlContent.replace(originalShapeContent, shapeContent);
            
            fileModified = true;
            replacements++;
            console.log(`     ✅ [REMPLACEMENT] Shape ${shapeName} mise à jour`);
          } else {
            console.log(`     ⚠️ [REMPLACEMENT] Shape ${shapeName} non trouvée dans ${fileName}`);
          }
        }
        
        if (fileModified) {
          content.file(fileName, xmlContent);
          console.log(`   ✅ Fichier ${fileName} modifié`);
        }
      }
    }
  }
  
  console.log(`✅ [REMPLACEMENT] ${replacements} shapes mises à jour au total`);
  return replacements;
}

// ===== FONCTION ALTERNATIVE : MASQUAGE PAR SUPPRESSION DE CONTENU =====
async function masquerShapesParSuppressionContenu(content, references) {
  console.log('🎭 [MASQUAGE-SIMPLE] Suppression du contenu des shapes vides');
  
  const files = Object.keys(content.files);
  let shapesVidees = 0;
  
  for (const fileName of files) {
    if (fileName.includes('slide') && fileName.endsWith('.xml')) {
      const file = content.files[fileName];
      if (!file.dir) {
        let xmlContent = await file.async('string');
        let fileModified = false;
        
        // Pour chaque shape de référence vide
        for (let i = references.length + 1; i <= 5; i++) {
          // Pattern pour trouver tout le contenu texte d'une shape spécifique
          const textContentPattern = new RegExp(
            `(<p:sp[\\s\\S]*?<p:cNvPr[^>]*name="reference_${i}"[\\s\\S]*?<p:txBody>)([\\s\\S]*?)(<\\/p:txBody>[\\s\\S]*?<\\/p:sp>)`,
            'g'
          );
          
          if (textContentPattern.test(xmlContent)) {
            console.log(`   🗑️ [MASQUAGE-SIMPLE] Vidage de reference_${i}`);
            
            // Remplacer tout le contenu texte par un contenu vide
            xmlContent = xmlContent.replace(textContentPattern, (match, before, textContent, after) => {
              return `${before}<a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr/></a:p>${after}`;
            });
            
            fileModified = true;
            shapesVidees++;
          }
        }
        
        if (fileModified) {
          content.file(fileName, xmlContent);
        }
      }
    }
  }
  
  console.log(`✅ [MASQUAGE-SIMPLE] ${shapesVidees} shapes vidées`);
  return shapesVidees;
}

// ===== FONCTION DE DEBUG APPROFONDI =====
async function debugCompletStructure(content) {
  console.log('\n🔍 [DEBUG] === ANALYSE COMPLÈTE DE LA STRUCTURE ===');
  
  const files = Object.keys(content.files);
  
  for (const fileName of files) {
    if (fileName.includes('slide') && fileName.endsWith('.xml')) {
      const file = content.files[fileName];
      if (!file.dir) {
        const xmlContent = await file.async('string');
        
        console.log(`\n📄 [DEBUG] ======= FICHIER: ${fileName} =======`);
        
        // 1. Chercher TOUS les noms de shapes
        console.log('\n🎯 [DEBUG] TOUTES LES SHAPES TROUVÉES :');
        const shapeNamePattern = /<p:cNvPr[^>]*name="([^"]*)"[^>]*>/g;
        let match;
        let shapeIndex = 1;
        
        while ((match = shapeNamePattern.exec(xmlContent)) !== null) {
          console.log(`   ${shapeIndex}. "${match[1]}"`);
          shapeIndex++;
        }
        
        // 2. Chercher spécifiquement les shapes "reference_"
        console.log('\n🔍 [DEBUG] SHAPES "reference_" TROUVÉES :');
        const referenceShapePattern = /<p:cNvPr[^>]*name="(reference_[^"]*)"[^>]*>/g;
        let refMatch;
        let refFound = false;
        
        while ((refMatch = referenceShapePattern.exec(xmlContent)) !== null) {
          console.log(`   ✅ Trouvé: "${refMatch[1]}"`);
          refFound = true;
        }
        
        if (!refFound) {
          console.log('   ❌ AUCUNE shape "reference_" trouvée !');
        }
        
        // 3. Chercher TOUS les placeholders
        console.log('\n📋 [DEBUG] TOUS LES PLACEHOLDERS TROUVÉS :');
        const placeholderPattern = /\{\{([^}]+)\}\}/g;
        let placeholderMatch;
        let placeholderIndex = 1;
        
        while ((placeholderMatch = placeholderPattern.exec(xmlContent)) !== null) {
          console.log(`   ${placeholderIndex}. {{${placeholderMatch[1]}}}`);
          placeholderIndex++;
        }
        
        // 4. Chercher les placeholders spécifiques REF_
        console.log('\n🎯 [DEBUG] PLACEHOLDERS "REF_" TROUVÉS :');
        const refPlaceholderPattern = /\{\{(REF_[^}]+)\}\}/g;
        let refPlaceholderMatch;
        let refPlaceholderFound = false;
        
        while ((refPlaceholderMatch = refPlaceholderPattern.exec(xmlContent)) !== null) {
          console.log(`   ✅ Trouvé: {{${refPlaceholderMatch[1]}}}`);
          refPlaceholderFound = true;
        }
        
        if (!refPlaceholderFound) {
          console.log('   ❌ AUCUN placeholder "REF_" trouvé !');
        }
        
        // 5. Extraire un échantillon du XML pour inspection manuelle
        console.log('\n📄 [DEBUG] ÉCHANTILLON DU XML (premiers 500 caractères) :');
        console.log(xmlContent.substring(0, 500) + '...');
        
        // 6. Chercher les structures p:txBody (zones de texte)
        console.log('\n📝 [DEBUG] ZONES DE TEXTE TROUVÉES :');
        const txBodyPattern = /<p:txBody[^>]*>([\s\S]*?)<\/p:txBody>/g;
        let txBodyMatch;
        let txBodyIndex = 1;
        
        while ((txBodyMatch = txBodyPattern.exec(xmlContent)) !== null) {
          const textContent = txBodyMatch[1];
          // Extraire le texte lisible
          const textPattern = /<a:t[^>]*>(.*?)<\/a:t>/g;
          let textMatch;
          let extractedText = '';
          
          while ((textMatch = textPattern.exec(textContent)) !== null) {
            extractedText += textMatch[1] + ' ';
          }
          
          console.log(`   ${txBodyIndex}. Contenu: "${extractedText.trim()}"`);
          txBodyIndex++;
        }
      }
    }
  }
  
  console.log('\n🔍 [DEBUG] === FIN DE L\'ANALYSE ===\n');
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
      if (references.length > 0) {
        console.log('📋 [ENRICH-CV] Références reçues:');
        references.forEach((ref, index) => {
          console.log(`   ${index + 1}. ${ref.nom_projet || ref.residence} - ${ref.client || ref.moa}`);
        });
      }
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
    
    // 4. Remplacement par shape nommée (corrigé)
    const replacements = await remplacerPlaceholdersParShape(content, references);
    
    console.log('✅ [ENRICH-CV] Remplacement par shape terminé');
    console.log(`📊 [ENRICH-CV] ${references.length} références utilisées, ${replacements} shapes mises à jour`);
    
    // 5. Masquage des shapes vides (seulement si nécessaire)
    let shapesMasquees = 0;
    if (references.length < 5) {
      shapesMasquees = await masquerShapesParSuppressionContenu(content, references);
    } else {
      console.log('🎭 [MASQUAGE] Aucun masquage nécessaire (5 références ou plus)');
    }
    
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
      shapesMasquees: shapesMasquees,
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

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('\n🚀 ===== BACKEND CV ENRICHMENT =====');
  console.log(`🌐 Serveur démarré sur http://localhost:${PORT}`);
  console.log('📁 Dossier uploads:', uploadsDir);
  console.log('📁 Dossier downloads:', downloadsDir);
  console.log('📋 Endpoints disponibles:');
  console.log('   • GET  /api/test');
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
