const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Automizer = require("pptx-automizer").default;
const cors = require("cors");

const app = express();
app.use(cors()); // Autorise toutes les origines

const upload = multer({ dest: "uploads/" });

app.use(express.json());

// Route pour servir test.pptx
app.get("/api/test-pptx", (req, res) => {
  const pptxPath = path.join(__dirname, "test.pptx");
  if (fs.existsSync(pptxPath)) {
    res.download(pptxPath, "test.pptx");
  } else {
    res.status(404).send("Fichier test.pptx non trouvé");
  }
});

app.post("/api/enrich-cv", upload.single("pptx"), async (req, res) => {
  try {
    const references = JSON.parse(req.body.references || "[]");
    const pptxPath = req.file.path;
    const outputPath = path.join("uploads", `enriched_${Date.now()}.pptx`);
    const templatePath = path.join(__dirname, "template.pptx");

    // Ajout du log de diagnostic
    console.log("templatePath exists:", fs.existsSync(templatePath), templatePath);

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Le template PowerPoint 'template.pptx' est manquant dans le dossier server." });
    }

    // Correction : passer une config minimale à Automizer
    const automizer = new Automizer({ templateDir: __dirname })
      .load(templatePath)
      .load(pptxPath)
      .write(outputPath);

    // Ajoute une nouvelle slide avec les références (simple exemple)
    automizer.addSlide("TITLE_AND_CONTENT", {
      title: "Références sélectionnées",
      content: references.map(
        (ref, i) =>
          `${i + 1}. ${ref.nom_projet} (${ref.annee}, ${ref.ville}) - ${ref.type_mission} - ${ref.client}`
      ).join("\n"),
    });

    await automizer.process();

    // Envoie le fichier pptx enrichi
    res.download(outputPath, "cv_enrichi.pptx", (err) => {
      fs.unlinkSync(pptxPath);
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error("Erreur lors de l'enrichissement du CV :", err);
    res.status(500).json({ error: "Erreur lors de l'enrichissement du CV.", details: err.message });
  }
});

app.listen(4000, () => {
  console.log("Backend listening on http://localhost:4000");
});