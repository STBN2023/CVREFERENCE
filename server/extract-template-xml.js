// Extraire et analyser la structure XML du template

const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function extractTemplateXML() {
  console.log('🔍 === EXTRACTION XML TEMPLATE ===\n');
  
  try {
    const templatePath = path.join(__dirname, 'template.pptx');
    const templateBuffer = fs.readFileSync(templatePath);
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(templateBuffer);
    
    // Extraire le slide principal
    const slideContent = await zipContent.files['ppt/slides/slide1.xml'].async('string');
    
    // Chercher le premier placeholder et son contexte complet
    const firstPlaceholder = '{{REF_RESIDENCE}}';
    const placeholderIndex = slideContent.indexOf(firstPlaceholder);
    
    if (placeholderIndex !== -1) {
      console.log(`📍 Placeholder trouvé à l'index: ${placeholderIndex}`);
      
      // Extraire 2000 caractères avant et après
      const contextBefore = slideContent.substring(Math.max(0, placeholderIndex - 2000), placeholderIndex);
      const contextAfter = slideContent.substring(placeholderIndex, placeholderIndex + 2000);
      
      console.log('\n📋 CONTEXTE COMPLET AUTOUR DU PLACEHOLDER:');
      console.log('─'.repeat(80));
      console.log(contextBefore + '🎯' + contextAfter);
      console.log('─'.repeat(80));
      
      // Analyser les balises ouvertes
      console.log('\n🏗️ ANALYSE DES BALISES ENGLOBANTES:');
      
      const openTags = [];
      const tagPattern = /<([^/>][^>]*)>/g;
      let match;
      
      // Chercher toutes les balises ouvertes avant le placeholder
      const beforePlaceholder = slideContent.substring(0, placeholderIndex);
      while ((match = tagPattern.exec(beforePlaceholder)) !== null) {
        const tagName = match[1].split(' ')[0];
        if (tagName.startsWith('p:') || tagName.startsWith('a:')) {
          openTags.push(tagName);
        }
      }
      
      // Garder seulement les dernières balises (plus proches du placeholder)
      const recentTags = openTags.slice(-15);
      console.log('Balises englobantes (du plus externe au plus interne):');
      recentTags.forEach((tag, index) => {
        const indent = '  '.repeat(index);
        console.log(`${indent}${index + 1}. <${tag}>`);
      });
      
      // Identifier le niveau à supprimer
      console.log('\n🎯 NIVEAUX DE SUPPRESSION POSSIBLES:');
      if (recentTags.includes('p:sp')) {
        console.log('✅ FORME COMPLÈTE <p:sp> - Supprime tout le volet/forme');
      }
      if (recentTags.includes('p:txBody')) {
        console.log('✅ VOLET TEXTE <p:txBody> - Supprime la zone de texte');
      }
      if (recentTags.includes('a:p')) {
        console.log('✅ PARAGRAPHE <a:p> - Supprime le paragraphe (actuel)');
      }
      
    } else {
      console.log('❌ Placeholder non trouvé dans le template');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

extractTemplateXML();
