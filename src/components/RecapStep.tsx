import { useWorkflow } from "./WorkflowContext";
import { EMPLOYEES } from "./TeamSelectionStep";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { showSuccess } from "@/utils/toast";

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

export const RecapStep = () => {
  const {
    selectedTeam,
    setSelectedTeam,
    selectedReferences,
    setSelectedReferences,
  } = useWorkflow();
  const navigate = useNavigate();

  // Redirige si aucune sélection
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
      navigate("/");
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-brand-dark tracking-tight drop-shadow-sm">
        Récapitulatif de la sélection
      </h2>
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-brand-blue">Équipe sélectionnée</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.id} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="font-semibold text-lg text-brand-dark mb-1">{member.name}</div>
              <div className="text-sm text-brand-dark/80">{member.function} • {member.level}</div>
              <div className="text-xs text-brand-dark/60">{member.agency}</div>
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
        <h3 className="text-2xl font-bold mb-4 text-brand-blue">Références sélectionnées</h3>
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