export async function testEnrichPptx() {
  // Données de test (mock)
  const references = [
    {
      nom_projet: "Tour Majunga",
      client: "Société Générale",
      montant: 12000000,
      type_mission: "Construction",
      annee: 2021,
      ville: "Paris"
    },
    {
      nom_projet: "Hôpital Sud",
      client: "CHU Lyon",
      montant: 8000000,
      type_mission: "Rénovation",
      annee: 2019,
      ville: "Lyon"
    }
  ];

  // Récupère le fichier test.pptx depuis le backend
  const pptxRes = await fetch("http://localhost:4000/api/test-pptx");
  if (!pptxRes.ok) {
    alert("Impossible de récupérer test.pptx depuis le backend.");
    return;
  }
  const pptxBlob = await pptxRes.blob();
  const pptxFile = new File([pptxBlob], "test.pptx", { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });

  // Prépare le formData
  const formData = new FormData();
  formData.append("pptx", pptxFile);
  formData.append("references", JSON.stringify(references));

  // Envoie au backend pour enrichissement
  const enrichRes = await fetch("http://localhost:4000/api/enrich-cv", {
    method: "POST",
    body: formData,
  });

  if (!enrichRes.ok) {
    alert("Erreur lors de la génération du PowerPoint enrichi.");
    return;
  }

  // Télécharge le fichier enrichi
  const enrichedBlob = await enrichRes.blob();
  const url = window.URL.createObjectURL(enrichedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cv_enrichi.pptx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}