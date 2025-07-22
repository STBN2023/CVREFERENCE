// Debug de la structure réelle du template

const fs = require('fs');
const JSZip = require('jszip');

async function debugTemplate() {
  console.log('🔍 === DEBUG STRUCTURE TEMPLATE ===\n');
  
  try {
    const templateBuffer = fs.readFileSync('./template.pptx');
    const zip = await JSZip.loadAsync(templateBuffer);
    
    // Analyser le slide principal
    const slideContent = await zip.files['ppt/slides/slide1.xml'].async('text');
    
    // Trouver les placeholders et leur contexte exact
    const placeholders = slideContent.match(/\{\{[^}]+\}\}/g);
    if (placeholders) {
      console.log(`📋 ${placeholders.length} placeholders trouvés`);
      
      // Analyser le contexte autour du premier placeholder
      const firstPlaceholder = placeholders[0];
      console.log(`\n🎯 Analyse de: ${firstPlaceholder}`);
      
      // Trouver l'index du placeholder
      const index = slideContent.indexOf(firstPlaceholder);
      
      // Extraire 200 caractères avant et après
      const before = slideContent.substring(Math.max(0, index - 200), index);
      const after = slideContent.substring(index + firstPlaceholder.length, index + firstPlaceholder.length + 200);
      
      console.log('\n📊 CONTEXTE COMPLET:');
      console.log('AVANT:');
      console.log(before);
      console.log('\nPLACEHOLDER:');
      console.log(firstPlaceholder);
      console.log('\nAPRÈS:');
      console.log(after);
      
      // Tester différents patterns
      console.log('\n🧪 TEST DES PATTERNS:');
      
      const patterns = [
        { name: 'Pattern actuel', regex: new RegExp(`<a:t[^>]*>[^<]*\\{\\{REF_RESIDENCE\\}\\}[^<]*</a:t>`, 'g') },
        { name: 'Pattern simple', regex: new RegExp(`<a:t[^>]*>[\\s\\S]*?\\{\\{REF_RESIDENCE\\}\\}[\\s\\S]*?</a:t>`, 'g') },
        { name: 'Pattern très large', regex: new RegExp(`<a:t[^>]*>.*?\\{\\{REF_RESIDENCE\\}\\}.*?</a:t>`, 'gs') },
        { name: 'Pattern avec espaces', regex: new RegExp(`<a:t[^>]*>\\s*[^<]*\\{\\{REF_RESIDENCE\\}\\}[^<]*\\s*</a:t>`, 'g') }
      ];
      
      patterns.forEach(pattern => {
        const matches = slideContent.match(pattern.regex);
        console.log(`${pattern.name}: ${matches ? matches.length + ' trouvé(s)' : 'aucun'}`);
        if (matches && matches[0]) {
          console.log(`  Exemple: ${matches[0].substring(0, 100)}...`);
        }
      });
      
      // Chercher tous les éléments <a:t> qui contiennent des placeholders
      const allTextElements = slideContent.match(/<a:t[^>]*>.*?<\/a:t>/gs) || [];
      console.log(`\n📝 ${allTextElements.length} éléments <a:t> au total`);
      
      const textElementsWithPlaceholders = allTextElements.filter(element => 
        element.includes('{{REF_')
      );
      
      console.log(`📝 ${textElementsWithPlaceholders.length} éléments <a:t> avec placeholders:`);
      textElementsWithPlaceholders.slice(0, 3).forEach((element, i) => {
        console.log(`  ${i + 1}. ${element}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

debugTemplate();
