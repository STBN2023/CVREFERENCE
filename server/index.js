const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Automizer = require("pptx-automizer").default;
const cors = require("cors");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.use(express.json());

// NOUVELLE VERSION : adapte les placeholders à ceux de l'image
function fillReferenceTemplate(template, ref) {
  if (!ref) return "";
  return template
    .replace(/{{REF_RESIDENCE}}/g, ref.residence || "")
    .replace(/{{REF_MOA}}/g, ref.moa || "")
    .replace(/{{REF_MONTANT}}/g, ref.montant ? ref.montant.toLocaleString() + " €" : "")
    .replace(/{{REF_TRAVAUX}}/g, ref.travaux || "")
    .replace(/{{REF_REALISATION}}/g, ref.realisation || "");
}

app.get("/api/test-pptx", (req, res) => {
  const pptxPath = path.join(__dirname, "test.pptx");
  if (fs.existsSync(pptxPath)) {
    res.download(pptxPath, "test.pptx");
  } else {
    res.status(404).send("Fichier test.pptx non trouvé");
  }
});

app.post("/api/enrich-cv", upload.single("pptx"), async (req, res) => {
  let pptxPath, outputPath;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier PowerPoint reçu (champ 'pptx' manquant)." });
    }
    pptxPath = req.file.path;

    const templatePath = path.join(__dirname, "template.pptx");
    if (!fs.existsSync(templatePath)) {
      fs.unlinkSync(pptxPath);
      return res.status(500).json({ error: "Le template PowerPoint 'template.pptx' est manquant dans le dossier server." });
    }

    let references = [];
    try {
      references = JSON.parse(req.body.references || "[]");
      if (!Array.isArray(references)) throw new Error("Le champ 'references' doit être un tableau JSON.");
    } catch (e) {
      fs.unlinkSync(pptxPath);
      return res.status(400).json({ error: "Le champ 'references' n'est pas un JSON valide.", details: e.message });
    }

    outputPath = path.join("uploads", `enriched_${Date.now()}.pptx`);

    let automizer;
    try {
      automizer = new Automizer({ templateDir: __dirname })
        .load(templatePath)
        .write(outputPath);

      await automizer.process();

      // Limite à 5 références max
      const MAX_REFERENCES = 5;
      const refsToShow = references.slice(0, MAX_REFERENCES);

      // Pour chaque placeholder, injecte la référence correspondante
      for (let i = 0; i < MAX_REFERENCES; i++) {
        const ref = refsToShow[i];
        const placeholderName = `reference_${i + 1}`;
        // Utilise le template adapté à tes nouveaux placeholders
        const template = 
`{{REF_RESIDENCE}}
Maître d’ouvrage: {{REF_MOA}}
Montant: {{REF_MONTANT}}
Type de travaux effectués: {{REF_TRAVAUX}}  Réalisation:  {{REF_REALISATION}}`;
        const text = ref ? fillReferenceTemplate(template, ref) : "";
        await automizer.setText(placeholderName, text, 0); // 0 = première slide
      }

      await automizer.process();
    } catch (e) {
      if (fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.error("Erreur Automizer :", e);
      return res.status(500).json({ error: "Erreur lors de la génération du PowerPoint.", details: e.message });
    }

    res.download(outputPath, "cv_enrichi.pptx", (err) => {
      try {
        if (fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupErr) {
        console.error("Erreur lors du nettoyage des fichiers temporaires :", cleanupErr);
      }
      if (err) {
        console.error("Erreur lors de l'envoi du fichier :", err);
      }
    });
  } catch (err) {
    if (pptxPath && fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    console.error("Erreur inattendue :", err);
    res.status(500).json({ error: "Erreur inattendue lors de l'enrichissement du CV.", details: err.message });
  }
});

app.listen(4000, () => {
  console.log("Backend listening on http://localhost:4000");
});