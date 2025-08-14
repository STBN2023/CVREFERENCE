const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const cors = require('cors');
const ExcelJS = require('exceljs');
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
  console.log(`✏️ [API] Modification salarié ID: ${id}`);
  try {
    const result = await dbManager.updateSalarie(id, req.body);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Salarié non trouvé' });
    }
    console.log(`✅ [API] Salarié ${id} modifié avec succès`);
    res.json({ message: 'Salarié modifié avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur modification salarié:', error.message);
    res.status(500).json({ error: 'Erreur lors de la modification du salarié' });
  }
});

// Supprimer un salarié
app.delete('/api/salaries/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [API] Suppression salarié ID: ${id}`);
  try {
    const success = await dbManager.deleteSalarie(id);
    if (!success) {
      return res.status(404).json({ error: 'Salarié non trouvé' });
    }
    console.log(`✅ [API] Salarié ${id} supprimé avec succès`);
    res.json({ message: 'Salarié supprimé avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur suppression salarié:', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression du salarié' });
  }
});

// Modifier une référence existante
app.put('/api/references/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`✏️ [API] Modification référence ID: ${id}`);
  try {
    const result = await dbManager.updateReference(id, req.body);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Référence non trouvée' });
    }
    console.log(`✅ [API] Référence ${id} modifiée avec succès`);
    res.json({ message: 'Référence modifiée avec succès' });
  } catch (error) {
    console.error(' [API] Erreur modification référence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la modification de la référence' });
  }
});

// Supprimer une référence
app.delete('/api/references/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(` [API] Suppression référence ID: ${id}`);
    
    const success = await dbManager.deleteReference(id);
    
    if (success) {
      console.log(` [API] Référence ${id} supprimée avec succès`);
      res.json({ message: 'Référence supprimée avec succès' });
    } else {
      res.status(404).json({ error: 'Référence non trouvée' });
    }
  } catch (error) {
    console.error(' [API] Erreur suppression référence:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la référence' });
  }
});

// Supprimer toutes les références
app.delete('/api/references', async (req, res) => {
  try {
    console.log(' [API] Suppression de toutes les références...');
    
    // Supprimer toutes les associations d'abord
    await dbManager.run('DELETE FROM salaries_references');
    console.log(' [API] Associations salariés-références supprimées');
    
    // Supprimer toutes les références
    await dbManager.run('DELETE FROM projets_references');
    console.log(' [API] Toutes les références supprimées');
    
    // Réinitialiser les auto-increment
    await dbManager.run('DELETE FROM sqlite_sequence WHERE name="projets_references"');
    await dbManager.run('DELETE FROM sqlite_sequence WHERE name="salaries_references"');
    console.log(' [API] Auto-increment réinitialisés');
    
    // Vérification
    const referencesCount = await dbManager.get('SELECT COUNT(*) as count FROM projets_references');
    const associationsCount = await dbManager.get('SELECT COUNT(*) as count FROM salaries_references');
    
    res.json({ 
      message: 'Toutes les références ont été supprimées',
      referencesRemaining: referencesCount.count,
      associationsRemaining: associationsCount.count
    });
    
  } catch (error) {
    console.error(' [API] Erreur suppression toutes références:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des références' });
  }
});

// ===================================
// ENDPOINTS EXPORT EXCEL
// ===================================

// Export des salariés en Excel
app.get('/api/export-salaries', async (req, res) => {
    try {
        console.log('📊 [EXPORT] Génération export Excel des salariés...');
        
        const salaries = await dbManager.all('SELECT * FROM salaries ORDER BY nom, prenom');
        
        // Créer un nouveau workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Salariés');
        
        // Définir les colonnes
        worksheet.columns = [
            { header: 'Nom', key: 'nom', width: 20 },
            { header: 'Prenom', key: 'prenom', width: 20 },
            { header: 'Agence', key: 'agence', width: 15 },
            { header: 'Fonction', key: 'fonction', width: 25 },
            { header: 'Niveau_Expertise', key: 'niveau_expertise', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Telephone', key: 'telephone', width: 15 },
            { header: 'Actif', key: 'actif', width: 10 }
        ];
        
        // Ajouter les données
        salaries.forEach(salarie => {
            worksheet.addRow({
                nom: salarie.nom,
                prenom: salarie.prenom,
                agence: salarie.agence,
                fonction: salarie.fonction,
                niveau_expertise: salarie.niveau_expertise,
                email: salarie.email,
                telephone: salarie.telephone,
                actif: salarie.actif ? 'Oui' : 'Non'
            });
        });
        
        // Styliser l'en-tête
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F3FF' }
        };
        
        // Envoyer le fichier directement au client
        const filename = `salaries_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        await workbook.xlsx.write(res);
        console.log(`✅ [EXPORT] Export salariés envoyé: ${filename}`);
        
    } catch (error) {
        console.error('❌ [EXPORT] Erreur export salariés:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export des salariés' });
    }
});

// Export des références en Excel
app.get('/api/export-references', async (req, res) => {
    try {
        console.log('📊 [EXPORT] Génération export Excel des références...');
        
        const references = await dbManager.all('SELECT * FROM projets_references ORDER BY annee DESC, nom_projet');
        
        // Créer un nouveau workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Références');
        
        // Définir les colonnes
        worksheet.columns = [
            { header: 'Nom_Projet', key: 'nom_projet', width: 30 },
            { header: 'Client', key: 'client', width: 25 },
            { header: 'Ville', key: 'ville', width: 20 },
            { header: 'Annee', key: 'annee', width: 10 },
            { header: 'Type_Mission', key: 'type_mission', width: 20 },
            { header: 'Montant', key: 'montant', width: 15 },
            { header: 'Description', key: 'description_courte', width: 40 },
            { header: 'Duree_Mois', key: 'duree_mois', width: 12 },
            { header: 'Surface', key: 'surface', width: 12 },
            { header: 'Salaries', key: 'salaries', width: 30 }
        ];
        
        // Ajouter les données avec les salariés associés
        for (const reference of references) {
            // Récupérer les salariés associés
            const salariesAssocies = await dbManager.all(`
                SELECT s.prenom, s.nom 
                FROM salaries s 
                JOIN salaries_references sr ON s.id_salarie = sr.id_salarie 
                WHERE sr.id_reference = ?
                ORDER BY s.nom, s.prenom
            `, [reference.id_reference]);
            
            const salariesNames = salariesAssocies.map(s => `${s.prenom} ${s.nom}`).join(', ');
            
            worksheet.addRow({
                nom_projet: reference.nom_projet,
                client: reference.client,
                ville: reference.ville,
                annee: reference.annee,
                type_mission: reference.type_mission,
                montant: reference.montant,
                description_courte: reference.description_courte,
                duree_mois: reference.duree_mois,
                surface: reference.surface,
                salaries: salariesNames
            });
        }
        
        // Styliser l'en-tête
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F3FF' }
        };
        
        // Générer le fichier
        const filename = `references_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        const filepath = path.join(downloadsDir, filename);
        
        // Envoyer le fichier directement au client
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        await workbook.xlsx.write(res);
        console.log(`✅ [EXPORT] Export références envoyé: ${filename}`);
        
    } catch (error) {
        console.error('❌ [EXPORT] Erreur export références:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export des références' });
    }
});

// Endpoint RAZ avec mot de passe admin
app.post('/api/admin/reset', async (req, res) => {
    try {
        const { password, target } = req.body;
        
        // Mot de passe admin (à configurer via variable d'environnement en production)
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (password !== ADMIN_PASSWORD) {
            console.log('🚫 [ADMIN] Tentative RAZ avec mot de passe incorrect');
            return res.status(401).json({ error: 'Mot de passe administrateur incorrect' });
        }
        
        console.log(`🗑️ [ADMIN] RAZ autorisée pour: ${target}`);
        
        if (target === 'salaries') {
            // Supprimer toutes les associations d'abord
            await dbManager.run('DELETE FROM salaries_references');
            // Supprimer tous les salariés
            await dbManager.run('DELETE FROM salaries');
            // Reset auto-increment
            await dbManager.run('DELETE FROM sqlite_sequence WHERE name="salaries"');
            await dbManager.run('DELETE FROM sqlite_sequence WHERE name="salaries_references"');
            
            const count = await dbManager.get('SELECT COUNT(*) as count FROM salaries');
            console.log(`✅ [ADMIN] RAZ salariés terminée - ${count.count} restants`);
            res.json({ message: 'RAZ des salariés effectuée', remaining: count.count });
            
        } else if (target === 'references') {
            // Supprimer toutes les associations d'abord
            await dbManager.run('DELETE FROM salaries_references');
            // Supprimer toutes les références
            await dbManager.run('DELETE FROM projets_references');
            // Reset auto-increment
            await dbManager.run('DELETE FROM sqlite_sequence WHERE name="projets_references"');
            await dbManager.run('DELETE FROM sqlite_sequence WHERE name="salaries_references"');
            
            const count = await dbManager.get('SELECT COUNT(*) as count FROM projets_references');
            console.log(`✅ [ADMIN] RAZ références terminée - ${count.count} restantes`);
            res.json({ message: 'RAZ des références effectuée', remaining: count.count });
            
        } else if (target === 'all') {
            // RAZ complète
            await dbManager.run('DELETE FROM salaries_references');
            await dbManager.run('DELETE FROM projets_references');
            await dbManager.run('DELETE FROM salaries');
            await dbManager.run('DELETE FROM sqlite_sequence WHERE name="salaries"');
            await dbManager.run('DELETE FROM sqlite_sequence WHERE name="projets_references"');
            await dbManager.run('DELETE FROM sqlite_sequence WHERE name="salaries_references"');
            
            const salariesCount = await dbManager.get('SELECT COUNT(*) as count FROM salaries');
            const referencesCount = await dbManager.get('SELECT COUNT(*) as count FROM projets_references');
            
            console.log(`✅ [ADMIN] RAZ complète terminée`);
            res.json({ 
                message: 'RAZ complète effectuée', 
                salariesRemaining: salariesCount.count,
                referencesRemaining: referencesCount.count
            });
            
        } else {
            res.status(400).json({ error: 'Target invalide. Utilisez: salaries, references ou all' });
        }
        
    } catch (error) {
        console.error('❌ [ADMIN] Erreur RAZ:', error);
        res.status(500).json({ error: 'Erreur lors de la RAZ' });
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

// Récupérer les références d'un salarié
app.get('/api/salaries/:id/references', async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [API] Récupération références salarié ID: ${id}`);
  try {
    const references = await dbManager.getSalarieReferences(id);
    console.log(`✅ [API] ${references.length} références trouvées pour le salarié ${id}`);
    res.json({ references });
  } catch (error) {
    console.error('❌ [API] Erreur récupération références salarié:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des références' });
  }
});

// Ajouter une référence à un salarié
app.post('/api/salaries/:id/references', async (req, res) => {
  const { id } = req.params;
  const { id_reference, role_projet, principal } = req.body;
  console.log(`➕ [API] Ajout référence ${id_reference} au salarié ${id}`);
  try {
    const result = await dbManager.addSalarieReference(id, id_reference, role_projet, principal);
    console.log(`✅ [API] Association créée avec ID: ${result.lastID}`);
    res.status(201).json({ id: result.lastID, message: 'Association créée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur ajout association:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'association' });
  }
});

// Supprimer une référence d'un salarié
app.delete('/api/salaries/:id/references/:refId', async (req, res) => {
  const { id, refId } = req.params;
  console.log(`❌ [API] Suppression référence ${refId} du salarié ${id}`);
  try {
    const result = await dbManager.removeSalarieReference(id, refId);
    console.log(`✅ [API] Association supprimée`);
    res.json({ message: 'Association supprimée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur suppression association:', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'association' });
  }
});

// Mettre à jour les références par défaut d'un salarié
app.put('/api/salaries/:id/references', async (req, res) => {
  const { id } = req.params;
  const { referenceIds } = req.body;
  console.log(`🔄 [API] Définition références par défaut salarié ${id}:`, referenceIds);
  try {
    const result = await dbManager.setSalarieDefaultReferences(id, referenceIds || []);
    console.log(`✅ [API] ${result.count} références par défaut définies pour le salarié ${id}`);
    res.json({ message: 'Références par défaut mises à jour', count: result.count });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour références par défaut:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des références par défaut' });
  }
});

// Récupérer les salariés associés à une référence
app.get('/api/references/:referenceId/salaries', async (req, res) => {
  const { referenceId } = req.params;
  console.log(`👥 [API] Récupération salariés pour référence ${referenceId}`);
  
  try {
    const salaries = await dbManager.all(`
      SELECT s.id_salarie, s.nom, s.prenom, s.agence, s.fonction, s.niveau_expertise
      FROM salaries s
      INNER JOIN salaries_references sr ON s.id_salarie = sr.id_salarie
      WHERE sr.id_reference = ?
      ORDER BY s.nom, s.prenom
    `, [referenceId]);
    
    console.log(`✅ [API] ${salaries.length} salariés trouvés pour la référence ${referenceId}`);
    res.json({ salaries });
  } catch (error) {
    console.error('❌ [API] Erreur récupération salariés référence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des salariés' });
  }
});

// Mettre à jour les associations d'une référence (remplacer tous les salariés associés)
app.put('/api/salaries/references/:referenceId', async (req, res) => {
  const { referenceId } = req.params;
  const { salarieIds } = req.body;
  console.log(`🔗 [API] Mise à jour associations référence ${referenceId}:`, salarieIds);
  
  try {
    // Supprimer toutes les associations existantes pour cette référence
    await dbManager.run('DELETE FROM salaries_references WHERE id_reference = ?', [referenceId]);
    
    // Créer les nouvelles associations
    let count = 0;
    if (salarieIds && salarieIds.length > 0) {
      for (const salarieId of salarieIds) {
        await dbManager.run(
          'INSERT INTO salaries_references (id_salarie, id_reference, role_projet, principal) VALUES (?, ?, ?, ?)',
          [salarieId, referenceId, null, false]
        );
        count++;
      }
    }
    
    console.log(`✅ [API] ${count} associations créées pour la référence ${referenceId}`);
    res.json({ message: 'Associations mises à jour', count });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour associations référence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des associations' });
  }
});

// Récupérer tous les salariés avec leurs références
app.get('/api/salaries-with-references', async (req, res) => {
  console.log('👥 [API] Récupération salariés avec références');
  try {
    const salaries = await dbManager.getSalariesWithReferences();
    console.log(`✅ [API] ${salaries.length} salariés avec références récupérés`);
    res.json({ salaries });
  } catch (error) {
    console.error('❌ [API] Erreur récupération salariés avec références:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des salariés avec références' });
  }
});

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
  console.log('   • POST /api/salaries/:id/references');
  console.log('   • PUT  /api/salaries/:id/references');
  console.log('   • DEL  /api/salaries/:id/references/:refId');
  console.log('   • GET  /api/salaries-with-references');
  console.log('   • POST /api/salaries');
  console.log('   • POST /api/references');
  console.log('   • POST /api/generate-cv');
  console.log('   • GET  /template.pptx');
  console.log('   • POST /api/enrich-cv');
  console.log('   • GET  /api/downloads');
  console.log('   • GET  /api/download/:filename');
  console.log('   • DEL  /api/download/:filename');
  console.log('=====================================\n');
});

// ===================================
// ENDPOINTS ASSOCIATIONS SALARIÉS-RÉFÉRENCES
// ===================================

// Récupérer les références d'un salarié
app.get('/api/salaries/:id/references', async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [API] Récupération références salarié ID: ${id}`);
  try {
    const references = await dbManager.getSalarieReferences(id);
    console.log(`✅ [API] ${references.length} références trouvées pour le salarié ${id}`);
    res.json({ references });
  } catch (error) {
    console.error('❌ [API] Erreur récupération références salarié:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des références' });
  }
});

// Associer une référence à un salarié
app.post('/api/salaries/:id/references', async (req, res) => {
  const { id } = req.params;
  const { referenceId, role_projet, date_debut, date_fin, principal } = req.body;
  console.log(`➕ [API] Association salarié ${id} avec référence ${referenceId}`);
  try {
    await dbManager.addSalarieReference(id, referenceId, {
      role_projet,
      date_debut,
      date_fin,
      principal
    });
    console.log(`✅ [API] Association créée: salarié ${id} <-> référence ${referenceId}`);
    res.status(201).json({ message: 'Association créée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur création association:', error.message);
    res.status(500).json({ error: 'Erreur lors de la création de l\'association' });
  }
});

// Supprimer l'association entre un salarié et une référence
app.delete('/api/salaries/:id/references/:refId', async (req, res) => {
  const { id, refId } = req.params;
  console.log(`🗑️ [API] Suppression association salarié ${id} <-> référence ${refId}`);
  try {
    await dbManager.removeSalarieReference(id, refId);
    console.log(`✅ [API] Association supprimée: salarié ${id} <-> référence ${refId}`);
    res.json({ message: 'Association supprimée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur suppression association:', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'association' });
  }
});

// Définir les références par défaut d'un salarié
app.put('/api/salaries/:id/references', async (req, res) => {
  const { id } = req.params;
  const { referenceIds } = req.body;
  console.log(`🔄 [API] Définition références par défaut salarié ${id}:`, referenceIds);
  try {
    const result = await dbManager.setSalarieDefaultReferences(id, referenceIds || []);
    console.log(`✅ [API] ${result.count} références par défaut définies pour le salarié ${id}`);
    res.json({ message: 'Références par défaut mises à jour', count: result.count });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour références par défaut:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des références par défaut' });
  }
});

// Récupérer les salariés associés à une référence
app.get('/api/references/:referenceId/salaries', async (req, res) => {
  const { referenceId } = req.params;
  console.log(`👥 [API] Récupération salariés pour référence ${referenceId}`);
  
  try {
    const salaries = await dbManager.all(`
      SELECT s.id_salarie, s.nom, s.prenom, s.agence, s.fonction, s.niveau_expertise
      FROM salaries s
      INNER JOIN salaries_references sr ON s.id_salarie = sr.id_salarie
      WHERE sr.id_reference = ?
      ORDER BY s.nom, s.prenom
    `, [referenceId]);
    
    console.log(`✅ [API] ${salaries.length} salariés trouvés pour la référence ${referenceId}`);
    res.json({ salaries });
  } catch (error) {
    console.error('❌ [API] Erreur récupération salariés référence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des salariés' });
  }
});

// Mettre à jour les associations d'une référence (remplacer tous les salariés associés)
app.put('/api/salaries/references/:referenceId', async (req, res) => {
  const { referenceId } = req.params;
  const { salarieIds } = req.body;
  console.log(`🔗 [API] Mise à jour associations référence ${referenceId}:`, salarieIds);
  
  try {
    // Supprimer toutes les associations existantes pour cette référence
    await dbManager.run('DELETE FROM salaries_references WHERE id_reference = ?', [referenceId]);
    
    // Créer les nouvelles associations
    let count = 0;
    if (salarieIds && salarieIds.length > 0) {
      for (const salarieId of salarieIds) {
        await dbManager.run(
          'INSERT INTO salaries_references (id_salarie, id_reference, role_projet, principal) VALUES (?, ?, ?, ?)',
          [salarieId, referenceId, null, false]
        );
        count++;
      }
    }
    
    console.log(`✅ [API] ${count} associations créées pour la référence ${referenceId}`);
    res.json({ message: 'Associations mises à jour', count });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour associations référence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des associations' });
  }
});

// Récupérer tous les salariés avec leurs références
app.get('/api/salaries-with-references', async (req, res) => {
  console.log('👥 [API] Récupération salariés avec références');
  try {
    const salaries = await dbManager.getSalariesWithReferences();
    console.log(`✅ [API] ${salaries.length} salariés avec références récupérés`);
    res.json({ salaries });
  } catch (error) {
    console.error('❌ [API] Erreur récupération salariés avec références:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des salariés avec références' });
  }
});

// Endpoint pour générer les CV avec le template par défaut
app.post('/api/generate-cv', async (req, res) => {
  console.log('\n=== 🚀 [GENERATE-CV] DÉBUT GÉNÉRATION ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    const { teamData, referencesData, associations } = req.body;
    
    if (!teamData || !referencesData || !associations) {
      console.error('❌ [GENERATE-CV] Données manquantes');
      return res.status(400).json({ error: 'Données manquantes (teamData, referencesData, associations)' });
    }
    
    console.log('📊 [GENERATE-CV] Données reçues:', {
      team: teamData.length,
      references: referencesData.length,
      associations: Object.keys(associations).length
    });
    
    // Vérifier que le template existe
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.error('❌ [GENERATE-CV] Template non trouvé:', templatePath);
      return res.status(404).json({ error: 'Template PowerPoint non trouvé' });
    }
    
    const generatedFiles = [];
    
    // Générer un CV pour chaque membre de l'équipe
    for (const member of teamData) {
      console.log(`👤 [GENERATE-CV] Génération CV pour: ${member.name}`);
      
      // Récupérer les références associées à ce membre
      const memberReferences = associations[member.id] || [];
      const memberReferencesData = memberReferences.map(refId => 
        referencesData.find(ref => ref.id === refId)
      ).filter(Boolean);
      
      console.log(`📋 [GENERATE-CV] ${member.name}: ${memberReferencesData.length} références`);
      
      // Lire le template
      const zip = new JSZip();
      const templateBuffer = fs.readFileSync(templatePath);
      const content = await zip.loadAsync(templateBuffer);
      
      // Construction du texte des références
      const refsText = memberReferencesData.map((ref, index) => {
        const nom = ref.nom_projet || `Projet ${index + 1}`;
        const client = ref.client || 'Client non spécifié';
        const montant = ref.montant ? `${ref.montant.toLocaleString()} €` : 'Non spécifié';
        const annee = ref.annee || 'Non spécifié';
        const ville = ref.ville || 'Non spécifié';
        const type = ref.type_mission || 'Non spécifié';
        
        return `${index + 1}. ${nom}\n   Client: ${client}\n   Ville: ${ville}\n   Type: ${type}\n   Montant: ${montant}\n   Année: ${annee}`;
      }).join('\n\n') || 'Aucune référence disponible';
      
      // Remplacement des placeholders
      const files = Object.keys(content.files);
      let replacements = 0;
      
      for (const fileName of files) {
        if (fileName.includes('slide') && fileName.endsWith('.xml')) {
          const file = content.files[fileName];
          if (!file.dir) {
            let xmlContent = await file.async('string');
            let modified = false;
            
            // Remplacer {{REFS}}
            if (xmlContent.includes('{{REFS}}')) {
              xmlContent = xmlContent.replace(/\{\{REFS\}\}/g, refsText);
              modified = true;
              replacements++;
            }
            
            // Remplacer {{NOM}} avec le nom du membre
            if (xmlContent.includes('{{NOM}}')) {
              xmlContent = xmlContent.replace(/\{\{NOM\}\}/g, member.name);
              modified = true;
            }
            
            // Remplacer {{PRENOM}} avec le prénom
            if (xmlContent.includes('{{PRENOM}}')) {
              const prenom = member.prenom || member.name.split(' ')[0];
              xmlContent = xmlContent.replace(/\{\{PRENOM\}\}/g, prenom);
              modified = true;
            }
            
            // Remplacer {{FONCTION}} avec la fonction
            if (xmlContent.includes('{{FONCTION}}')) {
              const fonction = member.fonction || 'Non spécifié';
              xmlContent = xmlContent.replace(/\{\{FONCTION\}\}/g, fonction);
              modified = true;
            }
            
            // Remplacer {{AGENCE}} avec l'agence
            if (xmlContent.includes('{{AGENCE}}')) {
              const agence = member.agence || 'Non spécifié';
              xmlContent = xmlContent.replace(/\{\{AGENCE\}\}/g, agence);
              modified = true;
            }
            
            if (modified) {
              content.file(fileName, xmlContent);
            }
          }
        }
      }
      
      // Génération du fichier
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const safeFileName = member.name.replace(/[^a-zA-Z0-9]/g, '_');
      const outputFilename = `cv_${safeFileName}_${timestamp}.pptx`;
      const outputPath = path.join(downloadsDir, outputFilename);
      
      const outputBuffer = await content.generateAsync({ type: 'nodebuffer' });
      fs.writeFileSync(outputPath, outputBuffer);
      
      generatedFiles.push({
        member: member.name,
        filename: outputFilename,
        downloadUrl: `/api/download/${outputFilename}`,
        referencesCount: memberReferencesData.length,
        replacements: replacements,
        fileSize: outputBuffer.length
      });
      
      console.log(`✅ [GENERATE-CV] CV généré pour ${member.name}: ${outputFilename}`);
    }
    
    const response = {
      message: 'CV générés avec succès',
      generatedFiles: generatedFiles,
      totalFiles: generatedFiles.length
    };
    
    console.log('✅ [GENERATE-CV] Succès:', response.totalFiles, 'fichiers générés');
    console.log('=== 🏁 [GENERATE-CV] FIN GÉNÉRATION ===\n');
    
    res.json(response);
    
  } catch (error) {
    console.error('💥 [GENERATE-CV] ERREUR:', error.message);
    console.error('💥 [GENERATE-CV] Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Erreur lors de la génération des CV',
      details: error.message 
    });
  }
});

// Récupérer les dernières références pour plusieurs salariés
app.post('/api/salaries/latest-references', async (req, res) => {
  const { salarieIds, limit = 5 } = req.body;
  console.log(`📅 [API] Récupération dernières références pour ${salarieIds?.length || 0} salariés (limite: ${limit})`);
  
  if (!salarieIds || !Array.isArray(salarieIds) || salarieIds.length === 0) {
    console.error('❌ [API] Erreur: salarieIds manquant ou invalide');
    return res.status(400).json({ error: 'Liste des IDs de salariés requise' });
  }
  
  try {
    const salarieReferences = await dbManager.getLatestReferencesBySalaries(salarieIds, limit);
    
    // Compter le total de références
    const totalReferences = Object.values(salarieReferences).reduce((total, refs) => total + refs.length, 0);
    
    console.log(`✅ [API] ${totalReferences} références récupérées pour ${salarieIds.length} salariés`);
    res.json({ salarieReferences });
  } catch (error) {
    console.error('❌ [API] Erreur récupération dernières références:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des dernières références' });
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Promise rejetée:', reason);
  process.exit(1);
});

// Importer les fonctions à partir d'un fichier Excel
app.post('/api/import-fonctions', upload.single('xlsx'), async (req, res) => {
  console.log('\n=== 📊 [IMPORT-FONCTIONS] DÉBUT IMPORT ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    // 1. Validation du fichier
    if (!req.file) {
      console.error('❌ [IMPORT-FONCTIONS] Aucun fichier fourni');
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    console.log('📁 [IMPORT-FONCTIONS] Fichier reçu:', {
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });
    
    // 2. Lecture du fichier Excel avec ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];
    
    // Convertir les données en JSON
    const data = [];
    const headerRow = worksheet.getRow(1);
    const headers = [];
    
    // Récupérer les en-têtes
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value;
    });
    
    // Récupérer les données
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Ignorer la ligne d'en-tête
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) {
            rowData[headers[colNumber]] = cell.value;
          }
        });
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }
    });
    
    console.log('📊 [IMPORT-FONCTIONS] Données reçues:', data.length, 'fonctions');
    
    // 3. Validation de la structure
    if (data.length === 0) {
      throw new Error('Le fichier Excel est vide');
    }
    
    const firstRow = data[0];
    if (!firstRow.Fonction && !firstRow.fonction) {
      throw new Error('Colonne "Fonction" manquante dans le fichier Excel');
    }
    
    // 4. Importer les fonctions avec contrôle d'unicité
    let addedCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        const result = await dbManager.addFonctionWithUniqueness(row);
        if (result.exists) {
          existingCount++;
        } else {
          addedCount++;
        }
      } catch (error) {
        console.error('❌ [IMPORT-FONCTIONS] Erreur ligne:', error.message);
        errorCount++;
      }
    }
    
    // 5. Nettoyage du fichier temporaire
    fs.unlinkSync(req.file.path);
    console.log('🧹 [IMPORT-FONCTIONS] Fichier temporaire supprimé');
    
    // 6. Réponse de succès
    const response = {
      message: 'Import des fonctions terminé',
      total: data.length,
      added: addedCount,
      existing: existingCount,
      errors: errorCount
    };
    
    console.log('✅ [IMPORT-FONCTIONS] Résultat:', response);
    console.log('=== 🏁 [IMPORT-FONCTIONS] FIN IMPORT ===\n');
    
    res.json(response);
    
  } catch (error) {
    console.error('💥 [IMPORT-FONCTIONS] ERREUR:', error.message);
    console.error('💥 [IMPORT-FONCTIONS] Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'import des fonctions',
      details: error.message 
    });
  }
});

// Importer les salariés à partir d'un fichier Excel (LEGACY - chemin modifié pour éviter les conflits)
app.post('/api/import-salaries-legacy', upload.single('file'), async (req, res) => {
  console.log('\n=== 👥 [IMPORT-SALARIES] DÉBUT IMPORT ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    // 1. Validation du fichier
    if (!req.file) {
      console.error('❌ [IMPORT-SALARIES] Aucun fichier fourni');
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    console.log('📁 [IMPORT-SALARIES] Fichier reçu:', {
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });
    
    // 2. Lecture du fichier Excel avec ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];
    
    // Convertir les données en JSON
    const data = [];
    const headerRow = worksheet.getRow(1);
    const headers = [];
    
    // Récupérer les en-têtes
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value;
    });
    
    // Récupérer les données
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Ignorer la ligne d'en-tête
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) {
            rowData[headers[colNumber]] = cell.value;
          }
        });
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }
    });
    
    console.log('📊 [IMPORT-SALARIES] Données reçues:', data.length, 'salariés');
    
    // 3. Validation de la structure
    if (data.length === 0) {
      throw new Error('Le fichier Excel est vide');
    }
    
    const firstRow = data[0];
    if (!firstRow.Nom && !firstRow.nom) {
      throw new Error('Colonne "Nom" manquante dans le fichier Excel');
    }
    if (!firstRow.Prenom && !firstRow.prenom) {
      throw new Error('Colonne "Prenom" manquante dans le fichier Excel');
    }
    
    // 4. Importer les salariés avec contrôle d'unicité
    let addedCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        const result = await dbManager.addSalarieWithUniqueness(row);
        if (result.exists) {
          existingCount++;
        } else {
          addedCount++;
        }
      } catch (error) {
        console.error('❌ [IMPORT-SALARIES] Erreur ligne:', error.message);
        errorCount++;
      }
    }
    
    // 5. Nettoyage du fichier temporaire
    fs.unlinkSync(req.file.path);
    console.log('🧹 [IMPORT-SALARIES] Fichier temporaire supprimé');
    
    // 6. Récupérer l'état final de la base
    const totalSalaries = await dbManager.get('SELECT COUNT(*) as count FROM salaries');
    
    // 7. Préparer le récapitulatif détaillé
    const importDetails = {
      statistiques: {
        fichier: req.file.originalname,
        lignes_traitees: data.length,
        salaries_ajoutes: addedCount,
        salaries_existants: existingCount,
        erreurs: errorCount,
        total_base: totalSalaries.count
      },
      erreurs_detaillees: [], // Pour l'instant vide, peut être amélioré
      doublons_detectes: [], // Pour l'instant vide, peut être amélioré
      salaries_ajoutes: [], // Pour l'instant vide, peut être amélioré
      recommandations: []
    };

    // Générer des recommandations
    if (errorCount > 0) {
      importDetails.recommandations.push('Vérifiez que toutes les lignes ont un nom et un prénom renseignés');
    }
    if (existingCount > 0) {
      importDetails.recommandations.push(`${existingCount} salariés existaient déjà dans la base de données`);
    }
    if (addedCount > 0) {
      importDetails.recommandations.push(`${addedCount} nouveaux salariés ont été ajoutés avec succès`);
    }
    if (addedCount === 0 && errorCount === 0 && existingCount > 0) {
      importDetails.recommandations.push('Tous les salariés du fichier existaient déjà dans la base');
    }

    // 8. Réponse de succès avec détails
    const response = {
      success: true,
      message: 'Import des salariés terminé',
      stats: {
        total: data.length,
        added: addedCount,
        existing: existingCount,
        errors: errorCount
      },
      importDetails: importDetails
    };
    
    console.log('✅ [IMPORT-SALARIES] Résultat:', response);
    console.log('=== 🏁 [IMPORT-SALARIES] FIN IMPORT ===\n');
    
    res.json(response);
    
  } catch (error) {
    console.error('💥 [IMPORT-SALARIES] ERREUR:', error.message);
    console.error('💥 [IMPORT-SALARIES] Stack:', error.stack);
    
    // Nettoyage du fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'import des salariés',
      details: error.message 
    });
  }
});

// Importer les références à partir d'un fichier Excel
app.post('/api/import-references', upload.single('file'), async (req, res) => {
  console.log('\n=== 📋 [IMPORT-REFERENCES] DÉBUT IMPORT ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    // 1. Validation du fichier
    if (!req.file) {
      console.error('❌ [IMPORT-REFERENCES] Aucun fichier fourni');
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    console.log('📁 [IMPORT-REFERENCES] Fichier reçu:', {
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });
    
    // 2. Lecture du fichier Excel avec ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];
    
    // Convertir les données en JSON
    const data = [];
    const headerRow = worksheet.getRow(1);
    const headers = [];
    
    // Récupérer les en-têtes
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value;
    });
    
    // Récupérer les données
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Ignorer la ligne d'en-tête
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) {
            rowData[headers[colNumber]] = cell.value;
          }
        });
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }
    });
    
    console.log('📊 [IMPORT-REFERENCES] Données reçues:', data.length, 'références');
    
    // 3. Validation de la structure
    if (data.length === 0) {
      throw new Error('Le fichier Excel est vide');
    }
    
    const firstRow = data[0];
    if (!firstRow.Nom_Projet && !firstRow.nom_projet) {
      throw new Error('Colonne "Nom_Projet" manquante dans le fichier Excel');
    }
    if (!firstRow.Client && !firstRow.client) {
      throw new Error('Colonne "Client" manquante dans le fichier Excel');
    }
    
    // 4. Importer les références avec contrôle d'unicité et associations
    let addedCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    let associationsCount = 0;
    
    for (const row of data) {
      try {
        const result = await dbManager.addReferenceWithUniqueness(row);
        if (result.exists) {
          existingCount++;
        } else {
          addedCount++;
        }
        
        // 5. Gérer les associations avec les salariés si présentes
        const salariesField = row.Salaries || row.salaries || row.Salariés || row.salariés;
        if (salariesField && typeof salariesField === 'string') {
          // Séparer les noms par virgule, point-virgule ou pipe
          const salarieNames = salariesField.split(/[,;|]/).map(name => name.trim()).filter(name => name.length > 0);
          
          for (const salarieName of salarieNames) {
            try {
              // Chercher le salarié par nom complet ou prénom+nom
              const nameParts = salarieName.split(' ').filter(part => part.length > 0);
              let salarie = null;
              
              if (nameParts.length >= 2) {
                // Format "Prénom Nom" ou "Nom Prénom"
                const [first, ...rest] = nameParts;
                const last = rest.join(' ');
                
                // Essayer Prénom Nom
                salarie = await dbManager.get(
                  'SELECT id_salarie FROM salaries WHERE LOWER(prenom) = LOWER(?) AND LOWER(nom) = LOWER(?)',
                  [first, last]
                );
                
                // Si pas trouvé, essayer Nom Prénom
                if (!salarie) {
                  salarie = await dbManager.get(
                    'SELECT id_salarie FROM salaries WHERE LOWER(nom) = LOWER(?) AND LOWER(prenom) = LOWER(?)',
                    [first, last]
                  );
                }
              } else {
                // Recherche par nom ou prénom seul
                salarie = await dbManager.get(
                  'SELECT id_salarie FROM salaries WHERE LOWER(nom) = LOWER(?) OR LOWER(prenom) = LOWER(?)',
                  [salarieName, salarieName]
                );
              }
              
              if (salarie) {
                // Créer l'association si elle n'existe pas déjà
                const existingAssoc = await dbManager.get(
                  'SELECT * FROM salaries_references WHERE id_salarie = ? AND id_reference = ?',
                  [salarie.id_salarie, result.id]
                );
                
                if (!existingAssoc) {
                  await dbManager.run(
                    'INSERT INTO salaries_references (id_salarie, id_reference, role_projet, principal) VALUES (?, ?, ?, ?)',
                    [salarie.id_salarie, result.id, null, false]
                  );
                  associationsCount++;
                  console.log(`🔗 [IMPORT-REFERENCES] Association créée: ${salarieName} -> Référence ${result.id}`);
                }
              } else {
                console.warn(`⚠️ [IMPORT-REFERENCES] Salarié "${salarieName}" non trouvé pour la référence ${result.id}`);
              }
            } catch (assocError) {
              console.error(`❌ [IMPORT-REFERENCES] Erreur association "${salarieName}":`, assocError.message);
            }
          }
        }
      } catch (error) {
        console.error('❌ [IMPORT-REFERENCES] Erreur ligne:', error.message);
        errorCount++;
      }
    }
    
    // 5. Nettoyage du fichier temporaire
    fs.unlinkSync(req.file.path);
    console.log('🧹 [IMPORT-REFERENCES] Fichier temporaire supprimé');
    
    // 6. Réponse de succès
    const response = {
      message: 'Import des références terminé',
      total: data.length,
      added: addedCount,
      existing: existingCount,
      errors: errorCount,
      associations: associationsCount
    };
    
    console.log('✅ [IMPORT-REFERENCES] Résultat:', response);
    console.log('=== 🏁 [IMPORT-REFERENCES] FIN IMPORT ===\n');
    
    res.json(response);
    
  } catch (error) {
    console.error('💥 [IMPORT-REFERENCES] ERREUR:', error.message);
    console.error('💥 [IMPORT-REFERENCES] Stack:', error.stack);
    
    // Nettoyage du fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'import des références',
      details: error.message 
    });
  }
});

// ===================================
// ENDPOINTS CRUD SALARIÉS
// ===================================

// Récupérer tous les salariés
app.get('/api/salaries', async (req, res) => {
  try {
    console.log('👥 [API] Récupération des salariés...');
    const salaries = await dbManager.all('SELECT * FROM salaries ORDER BY nom, prenom');
    console.log(`✅ [API] ${salaries.length} salariés récupérés`);
    res.json(salaries);
  } catch (error) {
    console.error('❌ [API] Erreur récupération salariés:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des salariés' });
  }
});

// Créer un nouveau salarié
app.post('/api/salaries', async (req, res) => {
  try {
    console.log('👥 [API] Création d\'un nouveau salarié...');
    const { nom, prenom, agence, fonction, niveau_expertise, email, telephone } = req.body;
    
    // Validation des champs requis
    if (!nom || !prenom) {
      return res.status(400).json({ error: 'Le nom et le prénom sont requis' });
    }
    
    // Générer un email si non fourni
    const generatedEmail = email || `${prenom.toLowerCase()}.${nom.toLowerCase()}@entreprise.com`;
    
    const result = await dbManager.run(
      `INSERT INTO salaries (nom, prenom, agence, fonction, niveau_expertise, email, telephone, actif, date_creation) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [nom, prenom, agence || '', fonction || '', niveau_expertise || 'Non spécifié', generatedEmail, telephone || '', true]
    );
    
    console.log(`✅ [API] Salarié créé avec ID: ${result.lastID}`);
    res.json({ 
      id: result.lastID, 
      nom, prenom, agence, fonction, niveau_expertise, 
      email: generatedEmail, telephone, actif: true 
    });
  } catch (error) {
    console.error('❌ [API] Erreur création salarié:', error);
    res.status(500).json({ error: 'Erreur lors de la création du salarié' });
  }
});

// Mettre à jour un salarié
app.put('/api/salaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, agence, fonction, niveau_expertise, email, telephone, actif } = req.body;
    
    console.log(`👥 [API] Mise à jour du salarié ID: ${id}`);
    
    const result = await dbManager.run(
      `UPDATE salaries SET nom = ?, prenom = ?, agence = ?, fonction = ?, niveau_expertise = ?, 
       email = ?, telephone = ?, actif = ?, date_modification = datetime('now') 
       WHERE id_salarie = ?`,
      [nom, prenom, agence, fonction, niveau_expertise, email, telephone, actif, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Salarié non trouvé' });
    }
    
    console.log(`✅ [API] Salarié ${id} mis à jour`);
    res.json({ id, nom, prenom, agence, fonction, niveau_expertise, email, telephone, actif });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour salarié:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du salarié' });
  }
});

// Supprimer un salarié
app.delete('/api/salaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 [API] Suppression du salarié ID: ${id}`);
    
    // Supprimer d'abord les associations
    await dbManager.run('DELETE FROM salaries_references WHERE id_salarie = ?', [id]);
    
    // Puis supprimer le salarié
    const result = await dbManager.run('DELETE FROM salaries WHERE id_salarie = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Salarié non trouvé' });
    }
    
    console.log(`✅ [API] Salarié ${id} supprimé`);
    res.json({ message: 'Salarié supprimé avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur suppression salarié:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du salarié' });
  }
});

// ===================================
// ENDPOINTS CRUD RÉFÉRENCES
// ===================================

// Récupérer toutes les références avec les salariés associés
app.get('/api/references', async (req, res) => {
  try {
    console.log('📋 [API] Récupération des références...');
    
    // Récupérer toutes les références
    const references = await dbManager.all(`
      SELECT * FROM projets_references 
      ORDER BY annee DESC, nom_projet ASC
    `);
    
    // Pour chaque référence, récupérer les salariés associés
    for (let reference of references) {
      const salaries = await dbManager.all(`
        SELECT s.id_salarie as id, s.nom, s.prenom, sr.role_projet, sr.principal
        FROM salaries s
        JOIN salaries_references sr ON s.id_salarie = sr.id_salarie
        WHERE sr.id_reference = ?
        ORDER BY sr.principal DESC, s.nom ASC
      `, [reference.id_reference]);
      
      reference.salaries = salaries.map(s => s.id);
      reference.salariesDetails = salaries;
    }
    
    console.log(`✅ [API] ${references.length} références récupérées avec succès`);
    res.json(references);
  } catch (error) {
    console.error('❌ [API] Erreur récupération références:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des références' });
  }
});

// Créer une nouvelle référence
app.post('/api/references', async (req, res) => {
  try {
    console.log('📋 [API] Création d\'une nouvelle référence...');
    const { 
      nom_projet, client, ville, annee, type_mission, montant, 
      description_projet, duree_mois, surface, salaries 
    } = req.body;
    
    // Validation des champs requis
    if (!nom_projet || !client) {
      return res.status(400).json({ error: 'Le nom du projet et le client sont requis' });
    }
    
    const result = await dbManager.run(
      `INSERT INTO projets_references (
        nom_projet, client, ville, annee, type_mission, montant, 
        description_projet, duree_mois, surface, date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [nom_projet, client, ville || '', annee || new Date().getFullYear(), 
       type_mission || '', montant || 0, description_projet || '', 
       duree_mois || 0, surface || 0]
    );
    
    const referenceId = result.lastID;
    
    // Créer les associations avec les salariés si fournis
    if (salaries && salaries.length > 0) {
      for (const salarieId of salaries) {
        await dbManager.run(
          'INSERT INTO salaries_references (id_salarie, id_reference, role_projet, principal) VALUES (?, ?, ?, ?)',
          [salarieId, referenceId, null, false]
        );
      }
    }
    
    console.log(`✅ [API] Référence créée avec ID: ${referenceId}`);
    res.json({ 
      id: referenceId, nom_projet, client, ville, annee, type_mission, 
      montant, description_projet, duree_mois, surface, salaries: salaries || []
    });
  } catch (error) {
    console.error('❌ [API] Erreur création référence:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la référence' });
  }
});

// Mettre à jour une référence
app.put('/api/references/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nom_projet, client, ville, annee, type_mission, montant, 
      description_projet, duree_mois, surface, salaries 
    } = req.body;
    
    console.log(`📋 [API] Mise à jour de la référence ID: ${id}`);
    
    const result = await dbManager.run(
      `UPDATE projets_references SET 
       nom_projet = ?, client = ?, ville = ?, annee = ?, type_mission = ?, 
       montant = ?, description_projet = ?, duree_mois = ?, surface = ?, 
       date_modification = datetime('now') 
       WHERE id_reference = ?`,
      [nom_projet, client, ville, annee, type_mission, montant, 
       description_projet, duree_mois, surface, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Référence non trouvée' });
    }
    
    // Mettre à jour les associations avec les salariés
    await dbManager.run('DELETE FROM salaries_references WHERE id_reference = ?', [id]);
    
    if (salaries && salaries.length > 0) {
      for (const salarieId of salaries) {
        await dbManager.run(
          'INSERT INTO salaries_references (id_salarie, id_reference, role_projet, principal) VALUES (?, ?, ?, ?)',
          [salarieId, id, null, false]
        );
      }
    }
    
    console.log(`✅ [API] Référence ${id} mise à jour`);
    res.json({ 
      id, nom_projet, client, ville, annee, type_mission, 
      montant, description_projet, duree_mois, surface, salaries: salaries || []
    });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour référence:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la référence' });
  }
});

// Supprimer une référence
app.delete('/api/references/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 [API] Suppression de la référence ID: ${id}`);
    
    // Supprimer d'abord les associations
    await dbManager.run('DELETE FROM salaries_references WHERE id_reference = ?', [id]);
    
    // Puis supprimer la référence
    const result = await dbManager.run('DELETE FROM projets_references WHERE id_reference = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Référence non trouvée' });
    }
    
    console.log(`✅ [API] Référence ${id} supprimée`);
    res.json({ message: 'Référence supprimée avec succès' });
  } catch (error) {
    console.error('❌ [API] Erreur suppression référence:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la référence' });
  }
});

// ===================================
// IMPORT EXCEL SALARIÉS
// ===================================

// Import des salariés depuis un fichier Excel
app.post('/api/import-salaries', upload.single('file'), async (req, res) => {
  try {
    console.log('📥 [IMPORT] Import salariés Excel démarré...');
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const workbook = new ExcelJS.Workbook();
    // Utiliser le fichier sur disque (multer dest) comme pour les références
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      return res.status(400).json({ error: 'Aucune feuille trouvée dans le fichier Excel' });
    }

    const stats = {
      total: 0,
      added: 0,
      existing: 0,
      errors: 0
    };

    const detailedErrors = [];
    const processedSalaries = [];
    const duplicateEmails = [];

    // Parcourir les lignes de manière synchrone
    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) { // Ignorer l'en-tête
        rows.push({ row, rowNumber });
      }
    });

    // Traiter chaque ligne de manière séquentielle
    for (const { row, rowNumber } of rows) {
      try {
        stats.total++;
        
        const nom = row.getCell(1).value?.toString()?.trim();
        const prenom = row.getCell(2).value?.toString()?.trim();
        const agence = row.getCell(3).value?.toString()?.trim() || '';
        const fonction = row.getCell(4).value?.toString()?.trim() || '';
        const niveau_expertise = row.getCell(5).value?.toString()?.trim() || 'Non spécifié';
        const email = row.getCell(6).value?.toString()?.trim();
        const telephone = row.getCell(7).value?.toString()?.trim() || '';

        // Validation des champs requis
        if (!nom || !prenom) {
          detailedErrors.push({
            ligne: rowNumber,
            erreur: 'Nom et prénom requis',
            donnees: { nom, prenom }
          });
          stats.errors++;
          continue;
        }

        // Générer un email si non fourni
        const finalEmail = email || `${prenom.toLowerCase()}.${nom.toLowerCase()}@entreprise.com`;

        // Vérifier si le salarié existe déjà (par email)
        const existing = await dbManager.get('SELECT * FROM salaries WHERE email = ?', [finalEmail]);
        
        if (existing) {
          duplicateEmails.push({
            ligne: rowNumber,
            nom: `${prenom} ${nom}`,
            email: finalEmail
          });
          stats.existing++;
          continue;
        }

        // Créer le nouveau salarié
        const result = await dbManager.run(
          `INSERT INTO salaries (nom, prenom, agence, fonction, niveau_expertise, email, telephone, actif, date_creation) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [nom, prenom, agence, fonction, niveau_expertise, finalEmail, telephone, true]
        );

        processedSalaries.push({
          id: result.lastID,
          nom: `${prenom} ${nom}`,
          agence,
          fonction,
          niveau_expertise,
          email: finalEmail
        });

        stats.added++;
        console.log(`✅ [IMPORT] Salarié ajouté: ${prenom} ${nom} (${finalEmail})`);

      } catch (error) {
        console.error(`❌ [IMPORT] Erreur ligne ${rowNumber}:`, error);
        detailedErrors.push({
          ligne: rowNumber,
          erreur: error.message,
          donnees: { nom: row.getCell(1).value, prenom: row.getCell(2).value }
        });
        stats.errors++;
      }
    }

    // Récupérer l'état final de la base
    const totalSalaries = await dbManager.get('SELECT COUNT(*) as count FROM salaries');

    // Préparer le récapitulatif détaillé
    const importDetails = {
      statistiques: {
        fichier: req.file.originalname,
        lignes_traitees: stats.total,
        salaries_ajoutes: stats.added,
        salaries_existants: stats.existing,
        erreurs: stats.errors,
        total_base: totalSalaries.count
      },
      erreurs_detaillees: detailedErrors,
      doublons_detectes: duplicateEmails,
      salaries_ajoutes: processedSalaries,
      recommandations: []
    };

    // Générer des recommandations
    if (stats.errors > 0) {
      importDetails.recommandations.push('Vérifiez que toutes les lignes ont un nom et un prénom renseignés');
    }
    if (duplicateEmails.length > 0) {
      importDetails.recommandations.push('Des salariés avec les mêmes emails existent déjà dans la base');
    }
    if (stats.added > 0) {
      importDetails.recommandations.push(`${stats.added} nouveaux salariés ont été ajoutés avec succès`);
    }

    // Nettoyer le fichier temporaire
    try {
      fs.unlinkSync(req.file.path);
      console.log('🧹 [IMPORT-SALARIES] Fichier temporaire supprimé');
    } catch (cleanupError) {
      console.warn('⚠️ [IMPORT-SALARIES] Erreur nettoyage fichier:', cleanupError.message);
    }

    console.log(`✅ [IMPORT] Import salariés terminé: ${stats.added}/${stats.total} ajoutés`);

    res.json({
      success: true,
      stats,
      importDetails,
      message: `Import terminé : ${stats.added} salariés ajoutés sur ${stats.total} traités`
    });

  } catch (error) {
    console.error('❌ [IMPORT] Erreur import salariés:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'import des salariés',
      message: error && error.message ? error.message : String(error),
      details: error && error.stack ? error.stack : undefined
    });
  }
});

// ===================================
// IMPORT EXCEL RÉFÉRENCES
// ===================================

// Import des références depuis un fichier Excel
app.post('/api/import-references', upload.single('file'), async (req, res) => {
  try {
    console.log('=== 📋 [IMPORT-REFERENCES] DÉBUT IMPORT ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    console.log('📁 [IMPORT-REFERENCES] Fichier reçu:', {
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      return res.status(400).json({ error: 'Aucune feuille trouvée dans le fichier Excel' });
    }

    // Statistiques d'import
    const stats = { total: 0, added: 0, existing: 0, errors: 0 };
    const detailedErrors = [];
    const duplicateProjects = [];
    const processedReferences = [];

    // Collecter toutes les lignes d'abord
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Ignorer l'en-tête
        rows.push({ row, rowNumber });
      }
    });

    console.log(`📊 [IMPORT-REFERENCES] Données reçues: ${rows.length} références`);

    // Traitement synchrone des lignes
    for (const { row, rowNumber } of rows) {
      try {
        stats.total++;

        // Extraction des données de la ligne
        const nom_projet = row.getCell(1).value?.toString()?.trim();
        const client = row.getCell(2).value?.toString()?.trim();
        const ville = row.getCell(3).value?.toString()?.trim();
        const annee = row.getCell(4).value;
        const parsedAnnee = typeof annee === 'number' 
          ? annee 
          : (parseInt((annee ?? '').toString().trim(), 10) || new Date().getFullYear());
        const type_mission = row.getCell(5).value?.toString()?.trim();
        const montant = row.getCell(6).value;
        const description_projet = row.getCell(7).value?.toString()?.trim();
        const duree_mois = row.getCell(8).value;
        const surface = row.getCell(9).value;

        // Validation des champs requis
        if (!nom_projet || !client) {
          detailedErrors.push({
            ligne: rowNumber,
            erreur: 'Nom du projet et client sont requis',
            donnees: { nom_projet, client }
          });
          stats.errors++;
          continue;
        }

        // Vérifier si la référence existe déjà (par nom_projet + client + année)
        const existingRef = await dbManager.get(
          'SELECT id_reference FROM projets_references WHERE LOWER(nom_projet) = LOWER(?) AND LOWER(client) = LOWER(?) AND annee = ?',
          [nom_projet, client, parsedAnnee]
        );

        if (existingRef) {
          duplicateProjects.push({
            ligne: rowNumber,
            nom_projet: nom_projet,
            client: client,
            annee: parsedAnnee,
            ville: ville,
            type_mission: type_mission,
            montant: montant,
            description_projet: description_projet,
            duree_mois: duree_mois,
            surface: surface
          });
          stats.existing++;
          continue;
        }

        // Créer la nouvelle référence
        const result = await dbManager.run(
          `INSERT INTO projets_references (nom_projet, client, ville, annee, type_mission, montant, description_projet, duree_mois, surface, date_creation) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [nom_projet, client, ville, parsedAnnee, type_mission, montant, description_projet, duree_mois, surface]
        );

        processedReferences.push({
          id: result.lastID,
          nom_projet,
          client,
          ville,
          annee: parsedAnnee,
          type_mission
        });

        stats.added++;
        console.log(`✅ [IMPORT] Référence ajoutée: ${nom_projet} - ${client}`);

      } catch (error) {
        console.error(`❌ [IMPORT] Erreur ligne ${rowNumber}:`, error);
        const errMsg = String(error && error.message ? error.message : error);
        detailedErrors.push({
          ligne: rowNumber,
          erreur: /UNIQUE constraint failed/i.test(errMsg) ? 'Référence déjà existante (contrainte d\'unicité)' : errMsg,
          donnees: {
            nom_projet: row.getCell(1).value,
            client: row.getCell(2).value,
            ville: row.getCell(3).value,
            annee: parsedAnnee,
            type_mission: row.getCell(5).value,
            montant: row.getCell(6).value,
            description_projet: row.getCell(7).value,
            duree_mois: row.getCell(8).value,
            surface: row.getCell(9).value
          }
        });
        stats.errors++;
      }
    }

    // Récupérer l'état final de la base
    const totalReferences = await dbManager.get('SELECT COUNT(*) as count FROM projets_references');

    // Préparer le récapitulatif détaillé
    const importDetails = {
      statistiques: {
        fichier: req.file.originalname,
        lignes_traitees: stats.total,
        references_ajoutees: stats.added,
        references_existantes: stats.existing,
        erreurs: stats.errors,
        total_base: totalReferences.count
      },
      erreurs_detaillees: detailedErrors,
      doublons_detectes: duplicateProjects,
      references_ajoutees: processedReferences,
      recommandations: []
    };

    // Générer des recommandations
    if (stats.errors > 0) {
      importDetails.recommandations.push('Vérifiez que toutes les lignes ont un nom de projet et un client renseignés');
    }
    if (duplicateProjects.length > 0) {
      importDetails.recommandations.push('Des références avec les mêmes projets/clients/années existent déjà dans la base');
    }
    if (stats.added > 0) {
      importDetails.recommandations.push(`${stats.added} nouvelles références ont été ajoutées avec succès`);
    }

    // Nettoyer le fichier temporaire
    try {
      fs.unlinkSync(req.file.path);
      console.log('🧹 [IMPORT-REFERENCES] Fichier temporaire supprimé');
    } catch (cleanupError) {
      console.warn('⚠️ [IMPORT-REFERENCES] Erreur nettoyage fichier:', cleanupError.message);
    }

    console.log(`✅ [IMPORT-REFERENCES] Résultat:`, {
      success: true,
      message: 'Import des références terminé',
      stats,
      importDetails
    });

    res.json({
      success: true,
      message: `Import terminé : ${stats.added} références ajoutées sur ${stats.total} traitées`,
      total: stats.total,
      added: stats.added,
      existing: stats.existing,
      errors: stats.errors,
      associations: stats.associations || 0,
      stats,
      importDetails
    });

    console.log('=== 🏁 [IMPORT-REFERENCES] FIN IMPORT ===');

  } catch (error) {
    console.error('❌ [IMPORT-REFERENCES] Erreur import références:', error);
    
    // Nettoyer le fichier en cas d'erreur
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ [IMPORT-REFERENCES] Erreur nettoyage fichier après erreur:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'import des références',
      details: error.message 
    });
  }
});

// ===================================
// ENDPOINT RÉFÉRENTIELS COMBINÉS
// ===================================

// Endpoint pour récupérer tous les référentiels en une seule requête
app.get('/api/referentials', async (req, res) => {
  try {
    console.log('📋 [API] Récupération des référentiels combinés...');
    
    // Récupérer les données depuis la vraie base de données
    const [agences, fonctions, niveaux] = await Promise.all([
      dbManager.getAgences(),
      dbManager.getFonctions(),
      dbManager.getNiveauxExpertise()
    ]);
    
    const referentials = {
      agences: agences.map(a => a.nom),
      fonctions: fonctions.map(f => f.nom),
      niveaux_expertise: niveaux.map(n => n.nom)
    };
    
    console.log('✅ [API] Référentiels fournis avec succès');
    res.json(referentials);
    
  } catch (error) {
    console.error('❌ [API] Erreur récupération référentiels:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des référentiels',
      details: error.message 
    });
  }
});

// ===================================
// ENDPOINTS CRUD AGENCES
// ===================================

// GET - Récupérer toutes les agences
app.get('/api/agences', async (req, res) => {
  try {
    const agences = await dbManager.getAgences();
    res.json(agences);
  } catch (error) {
    console.error('❌ [API] Erreur récupération agences:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des agences' });
  }
});

// POST - Ajouter une nouvelle agence
app.post('/api/agences', async (req, res) => {
  try {
    const result = await dbManager.addAgence(req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur ajout agence:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'agence' });
  }
});

// PUT - Modifier une agence
app.put('/api/agences/:id', async (req, res) => {
  try {
    const result = await dbManager.updateAgence(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur modification agence:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'agence' });
  }
});

// DELETE - Supprimer une agence
app.delete('/api/agences/:id', async (req, res) => {
  try {
    const result = await dbManager.deleteAgence(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur suppression agence:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'agence' });
  }
});

// ===================================
// ENDPOINTS CRUD FONCTIONS
// ===================================

// GET - Récupérer toutes les fonctions
app.get('/api/fonctions', async (req, res) => {
  try {
    const fonctions = await dbManager.getFonctions();
    res.json(fonctions);
  } catch (error) {
    console.error('❌ [API] Erreur récupération fonctions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fonctions' });
  }
});

// POST - Ajouter une nouvelle fonction
app.post('/api/fonctions', async (req, res) => {
  try {
    const result = await dbManager.addFonction(req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur ajout fonction:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la fonction' });
  }
});

// PUT - Modifier une fonction
app.put('/api/fonctions/:id', async (req, res) => {
  try {
    const result = await dbManager.updateFonction(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur modification fonction:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la fonction' });
  }
});

// DELETE - Supprimer une fonction
app.delete('/api/fonctions/:id', async (req, res) => {
  try {
    const result = await dbManager.deleteFonction(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur suppression fonction:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la fonction' });
  }
});

// ===================================
// ENDPOINTS CRUD NIVEAUX D'EXPERTISE
// ===================================

// GET - Récupérer tous les niveaux d'expertise
app.get('/api/niveaux', async (req, res) => {
  try {
    const niveaux = await dbManager.getNiveauxExpertise();
    res.json(niveaux);
  } catch (error) {
    console.error('❌ [API] Erreur récupération niveaux:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des niveaux d\'expertise' });
  }
});

// POST - Ajouter un nouveau niveau d'expertise
app.post('/api/niveaux', async (req, res) => {
  try {
    const result = await dbManager.addNiveauExpertise(req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur ajout niveau:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du niveau d\'expertise' });
  }
});

// PUT - Modifier un niveau d'expertise
app.put('/api/niveaux/:id', async (req, res) => {
  try {
    const result = await dbManager.updateNiveauExpertise(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur modification niveau:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du niveau d\'expertise' });
  }
});

// DELETE - Supprimer un niveau d'expertise
app.delete('/api/niveaux/:id', async (req, res) => {
  try {
    const result = await dbManager.deleteNiveauExpertise(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erreur suppression niveau:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du niveau d\'expertise' });
  }
});
