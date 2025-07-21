import { useWorkflow } from "@/components/WorkflowContext";
import { EMPLOYEES } from "@/components/TeamSelectionStep";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { Pencil, Eye } from "lucide-react";

const MOCK_REFERENCES = [
  {
    id: "1",
    nom_projet: "Tour Majunga",
    ville: "Paris",
    annee: 2021,
    type_mission: "Construction",
    montant: 12000000,
    client: "Société Générale",
    description_projet: "Construction d'une tour de bureaux de 45 étages.",
  },
  {
    id: "2",
    nom_projet: "Hôpital Sud",
    ville: "Lyon",
    annee: 2019,
    type_mission: "Rénovation",
    montant: 8000000,
    client: "CHU Lyon",
    description_projet: "Rénovation complète du pôle maternité.",
  },
  {
    id: "3",
    nom_projet: "Campus Innovation",
    ville: "Toulouse",
    annee: 2022,
    type_mission: "Extension",
    montant: 5000000,
    client: "Université Toulouse",
    description_projet: "Extension du campus universitaire avec laboratoires.",
  },
  {
    id: "4",
    nom_projet: "EcoQuartier Nord",
    ville: "Lille",
    annee: 2020,
    type_mission: "Construction",
    montant: 9500000,
    client: "Ville de Lille",
    description_projet: "Création d'un écoquartier de 200 logements.",
  },
];

// Liste des templates de CV disponibles
const CV_TEMPLATES = [
  { id: "classic", label: "Classique" },
  { id: "modern", label: "Moderne" },
  { id: "minimal", label: "Minimal" },
];

export const RecapStep = () => {
  const {
    selectedTeam,
    setSelectedTeam,
    selectedReferences,
    setSelectedReferences,
    referenceAssociation,
    setReferenceAssociation,
    templateAssociation,
    setTemplateAssociation,
  } = useWorkflow();
  const navigate = useNavigate();

  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTeam.length === 0 || selectedReferences.length === 0) {
      navigate("/");
    }
  }, [selectedTeam, selectedReferences, navigate]);

  const team = EMPLOYEES.filter((e) => selectedTeam.includes(e.id));
  const references = MOCK_REFERENCES.filter((r) => selectedReferences.includes(r.id));

  const handleFinish = () => {
    showSuccess("CV généré avec succès ! Merci pour votre sélection.");
    setTimeout(() => {
      setSelectedTeam([]);
      setSelectedReferences([]);
      setReferenceAssociation({});
      setTemplateAssociation({});
      navigate("/");
    }, 1000);
  };

  const handleEditAssociation = () => {
    navigate("/association");
  };

  const getTemplateLabel = (templateId: string) => {
    const tpl = CV_TEMPLATES.find(t => t.id === templateId);
    return tpl ? tpl.label : "Classique";
  };

  // Télécharge test.pptx depuis le backend et retourne un File/Blob
  const getCvFileForMember = async (): Promise<File | Blob | null> => {
    try {
      const response = await fetch("http://localhost:4000/api/test-pptx");
      if (!response.ok) {
        showError("Impossible de récupérer test.pptx depuis le backend.");
        return null;
      }
      const blob = await response.blob();
      return new File([blob], "test.pptx", { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    } catch (e) {
      showError("Erreur réseau lors de la récupération du fichier test.pptx.");
      return null;
    }
  };

  // Envoie le fichier pptx + les références au backend et télécharge le fichier enrichi
  const handleDownloadEnrichedCv = async (memberId: string) => {
    setDownloading(memberId);
    try {
      const cvFile = await getCvFileForMember();
      if (!cvFile) {
        setDownloading(null);
        return;
      }
      const formData = new FormData();
      formData.append("pptx", cvFile);
      formData.append(
        "references",
        JSON.stringify(referenceAssociation[memberId]?.map(refId =>
          references.find(r => r.id === refId)
        ).filter(Boolean) || [])
      );
      const response = await fetch("http://localhost:4000/api/enrich-cv", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        showError("Erreur lors de la génération du CV enrichi.");
        setDownloading(null);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cv_enrichi.pptx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess("CV enrichi téléchargé !");
    } catch (e) {
      showError("Impossible de générer le CV enrichi.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-brand-dark tracking-tight drop-shadow-sm">
        Récapitulatif de la sélection
      </h2>
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-brand-blue flex items-center gap-2">
          Équipe sélectionnée & Références associées
          <Button
            variant="outline"
            size="sm"
            className="ml-2 px-3 py-1 rounded-full border-brand-blue text-brand-blue font-semibold flex items-center gap-1"
            onClick={handleEditAssociation}
          >
            <Pencil size={16} className="mr-1" />
            Modifier associations
          </Button>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.id} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark flex flex-col gap-2">
              <div className="font-semibold text-lg text-brand-dark mb-1">{member.name}</div>
              <div className="text-sm text-brand-dark/80">{member.function} • {member.level}</div>
              <div className="text-xs text-brand-dark/60 mb-2">{member.agency}</div>
              <div className="text-xs text-brand-dark/60 font-semibold mb-1">Template de CV : <span className="font-bold text-brand-blue">{getTemplateLabel(templateAssociation[member.id])}</span></div>
              <div className="text-xs text-brand-dark/60 font-semibold mb-1">Références associées :</div>
              <ul className="list-disc ml-4">
                {(referenceAssociation[member.id] || []).map((refId) => {
                  const ref = references.find((r) => r.id === refId);
                  return ref ? (
                    <li key={ref.id} className="text-xs text-brand-dark/80">
                      {ref.nom_projet} ({ref.annee}, {ref.ville})
                    </li>
                  ) : null;
                })}
                {(referenceAssociation[member.id] || []).length === 0 && (
                  <li className="text-xs text-gray-400">Aucune</li>
                )}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 flex items-center gap-2 border-brand-blue text-brand-blue font-semibold"
                onClick={() => handleDownloadEnrichedCv(member.id)}
                disabled={downloading === member.id}
                title="Télécharger un aperçu du CV enrichi"
              >
                <Eye size={16} className="mr-1" />
                {downloading === member.id ? "Génération..." : "Aperçu du CV enrichi"}
              </Button>
            </div>
          ))}
          {team.length === 0 && (
            <div className="col-span-full text-center text-brand-dark/60 py-8 text-lg font-medium">
              Aucune personne sélectionnée.
            </div>
          )}
        </div>
      </div>
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-brand-blue">Références sélectionnées (toutes)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {references.map((ref) => (
            <div key={ref.id} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="font-bold text-lg text-brand-dark mb-1">{ref.nom_projet}</div>
              <div className="text-sm text-brand-dark/80">{ref.ville} • {ref.type_mission} • {ref.annee}</div>
              <div className="text-xs text-brand-dark/60 mb-1">Client : {ref.client}</div>
              <div className="text-xs text-brand-dark/60 mb-1">Montant : {ref.montant.toLocaleString()} €</div>
              <div className="text-xs text-brand-dark/60">{ref.description_projet}</div>
            </div>
          ))}
          {references.length === 0 && (
            <div className="col-span-full text-center text-brand-dark/60 py-8 text-lg font-medium">
              Aucune référence sélectionnée.
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <Button
          className="rounded-full px-8 py-2 text-base font-bold bg-brand-yellow text-brand-dark shadow-lg hover:bg-brand-yellow/90 transition"
          onClick={handleFinish}
        >
          Générer le CV / Terminer
        </Button>
      </div>
    </div>
  );
};

export default RecapStep;