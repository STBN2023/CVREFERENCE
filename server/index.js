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
    // 1. Vérification du fichier uploadé
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier PowerPoint reçu (champ 'pptx' manquant)." });
    }
    pptxPath = req.file.path;

    // 2. Vérification du template
    const templatePath = path.join(__dirname, "template.pptx");
    if (!fs.existsSync(templatePath)) {
      fs.unlinkSync(pptxPath);
      return res.status(500).json({ error: "Le template PowerPoint 'template.pptx' est manquant dans le dossier server." });
    }

    // 3. Vérification du format JSON des références
    let references = [];
    try {
      references = JSON.parse(req.body.references || "[]");
      if (!Array.isArray(references)) throw new Error("Le champ 'references' doit être un tableau JSON.");
    } catch (e) {
      fs.unlinkSync(pptxPath);
      return res.status(400).json({ error: "Le champ 'references' n'est pas un JSON valide.", details: e.message });
    }

    // 4. Préparation du chemin de sortie
    outputPath = path.join("uploads", `enriched_${Date.now()}.pptx`);

    // 5. Utilisation d'Automizer v0.5.0
    let automizer;
    try {
      automizer = new Automizer({ templateDir: __dirname })
        .load(templatePath)
        .load(pptxPath)
        .write(outputPath);

      await automizer.process();

      // Ajoute une slide après le process
      await automizer.createSlide("TITLE_AND_CONTENT", {
        title: "Références sélectionnées",
        content: references.map(
          (ref, i) =>
            `${i + 1}. ${ref.nom_projet} (${ref.annee}, ${ref.ville}) - ${ref.type_mission} - ${ref.client}`
        ).join("\n"),
      });

      // Re-process pour inclure la nouvelle slide
      await automizer.process();
    } catch (e) {
      if (fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.error("Erreur Automizer :", e);
      return res.status(500).json({ error: "Erreur lors de la génération du PowerPoint.", details: e.message });
    }

    // 6. Envoi du fichier généré
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