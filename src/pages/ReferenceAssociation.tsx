import { useWorkflow } from "@/components/WorkflowContext";
import { EMPLOYEES } from "@/components/TeamSelectionStep";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
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

export default function ReferenceAssociation() {
  const {
    selectedTeam,
    selectedReferences,
    referenceAssociation,
    setReferenceAssociation,
  } = useWorkflow();
  const navigate = useNavigate();

  // Redirige si aucune sélection
  useEffect(() => {
    if (selectedTeam.length === 0 || selectedReferences.length === 0) {
      navigate("/");
    }
  }, [selectedTeam, selectedReferences, navigate]);

  // Initialiser l'association si vide
  useEffect(() => {
    if (Object.keys(referenceAssociation).length === 0) {
      const initial: Record<string, string[]> = {};
      selectedTeam.forEach((empId) => {
        initial[empId] = [...selectedReferences];
      });
      setReferenceAssociation(initial);
    }
    // eslint-disable-next-line
  }, []);

  const [localAssoc, setLocalAssoc] = useState<Record<string, string[]>>(
    referenceAssociation && Object.keys(referenceAssociation).length > 0
      ? referenceAssociation
      : Object.fromEntries(selectedTeam.map((id) => [id, [...selectedReferences]]))
  );

  const handleToggle = (empId: string, refId: string) => {
    setLocalAssoc((prev) => ({
      ...prev,
      [empId]: prev[empId].includes(refId)
        ? prev[empId].filter((id) => id !== refId)
        : [...prev[empId], refId],
    }));
  };

  const handleValidate = () => {
    setReferenceAssociation(localAssoc);
    showSuccess("Associations enregistrées !");
    setTimeout(() => {
      navigate("/recap");
    }, 600);
  };

  const team = EMPLOYEES.filter((e) => selectedTeam.includes(e.id));
  const references = MOCK_REFERENCES.filter((r) => selectedReferences.includes(r.id));

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-brand-dark tracking-tight drop-shadow-sm">
        Associer les références à chaque membre de l’équipe
      </h2>
      <div className="flex flex-col gap-8">
        {team.map((emp) => (
          <div key={emp.id} className="bg-white rounded-xl shadow p-6 border-2 border-brand-dark">
            <div className="font-bold text-lg text-brand-blue mb-2">
              {emp.name} <span className="text-sm text-brand-dark/60">({emp.function} • {emp.level})</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {references.map((ref) => {
                const checked = localAssoc[emp.id]?.includes(ref.id);
                return (
                  <label
                    key={ref.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium cursor-pointer transition
                      ${checked
                        ? "bg-brand-yellow text-brand-dark border-brand-yellow shadow"
                        : "bg-white text-brand-dark border-brand-dark hover:bg-brand-pale"}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggle(emp.id, ref.id)}
                      className="accent-brand-blue"
                    />
                    {ref.nom_projet}
                  </label>
                );
              })}
              {references.length === 0 && (
                <span className="text-gray-400 text-sm">Aucune référence sélectionnée</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-10">
        <Button
          className="rounded-full px-8 py-2 text-base font-bold bg-brand-yellow text-brand-dark shadow-lg hover:bg-brand-yellow/90 transition"
          onClick={handleValidate}
        >
          Valider les associations et continuer
        </Button>
      </div>
    </div>
  );
}