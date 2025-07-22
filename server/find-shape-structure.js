// Trouver la structure des formes/volets PowerPoint

const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function findShapeStructure() {
  console.log('🔍 === RECHERCHE STRUCTURE FORMES ===\n');
  
  try {
    const templatePath = path.join(__dirname, 'template.pptx');
    const templateBuffer = fs.readFileSync(templatePath);
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(templateBuffer);
    
    const slideContent = await zipContent.files['ppt/slides/slide1.xml'].async('string');
    
    // Chercher toutes les formes <p:sp>
    const shapePattern = /<p:sp[^>]*>[\s\S]*?<\/p:sp>/g;
    const shapes = slideContent.match(shapePattern);
    
    console.log(`📦 Formes trouvées: ${shapes ? shapes.length : 0}`);
    
    if (shapes) {
      shapes.forEach((shape, index) => {
        console.log(`\n🔍 === FORME ${index + 1} ===`);
        
        // Vérifier si cette forme contient des placeholders
        const placeholders = shape.match(/\{\{[^}]+\}\}/g);
        if (placeholders) {
          console.log(`📍 Placeholders dans cette forme: ${placeholders.length}`);
          placeholders.forEach(ph => console.log(`   • ${ph}`));
          
          // Montrer un extrait de la forme
          console.log('\n📋 EXTRAIT DE LA FORME:');
          console.log(shape.substring(0, 300) + '...');
          
          console.log('\n🎯 CETTE FORME DEVRAIT ÊTRE SUPPRIMÉE COMPLÈTEMENT');
        } else {
          console.log('📍 Aucun placeholder dans cette forme');
        }
        
        console.log('─'.repeat(60));
      });
    }
    
    // Chercher aussi les zones de texte <p:txBody>
    const textBodyPattern = /<p:txBody[^>]*>[\s\S]*?<\/p:txBody>/g;
    const textBodies = slideContent.match(textBodyPattern);
    
    console.log(`\n📝 Zones de texte trouvées: ${textBodies ? textBodies.length : 0}`);
    
    if (textBodies) {
      textBodies.forEach((textBody, index) => {
        console.log(`\n🔍 === ZONE TEXTE ${index + 1} ===`);
        
        const placeholders = textBody.match(/\{\{[^}]+\}\}/g);
        if (placeholders) {
          console.log(`📍 Placeholders dans cette zone: ${placeholders.length}`);
          placeholders.forEach(ph => console.log(`   • ${ph}`));
          
          console.log('\n🎯 CETTE ZONE TEXTE DEVRAIT ÊTRE SUPPRIMÉE COMPLÈTEMENT');
        }
      });
    }
    
    console.log('\n💡 === RECOMMANDATION FINALE ===');
    console.log('Pour supprimer un VOLET COMPLET, nous devons cibler:');
    console.log('1. 🎯 <p:sp>...</p:sp> (forme complète) - MEILLEUR CHOIX');
    console.log('2. 📝 <p:txBody>...</p:txBody> (zone de texte) - ALTERNATIVE');
    console.log('3. 📄 <a:p>...</a:p> (paragraphe) - ACTUEL (insuffisant)');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

findShapeStructure();
