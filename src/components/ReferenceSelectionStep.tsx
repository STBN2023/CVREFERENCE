import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { useWorkflow } from "./WorkflowContext";

type Reference = {
  id: string;
  nom_projet: string;
  ville: string;
  annee: number;
  type_mission: string;
  montant: number;
  client: string;
  description_projet: string;
};

const MOCK_REFERENCES: Reference[] = [
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

const VILLES = ["Paris", "Lyon", "Toulouse", "Lille"];
const TYPES = ["Construction", "Rénovation", "Extension"];
const ANNEES = [2022, 2021, 2020, 2019];

export const ReferenceSelectionStep = () => {
  const [selectedVilles, setSelectedVilles] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAnnees, setSelectedAnnees] = useState<number[]>([]);
  const [montantMin, setMontantMin] = useState<number | "">("");
  const [montantMax, setMontantMax] = useState<number | "">("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { setSelectedReferences } = useWorkflow();

  const filteredReferences = useMemo(() => {
    return MOCK_REFERENCES.filter((ref) =>
      (selectedVilles.length === 0 || selectedVilles.includes(ref.ville)) &&
      (selectedTypes.length === 0 || selectedTypes.includes(ref.type_mission)) &&
      (selectedAnnees.length === 0 || selectedAnnees.includes(ref.annee)) &&
      (montantMin === "" || ref.montant >= montantMin) &&
      (montantMax === "" || ref.montant <= montantMax)
    );
  }, [selectedVilles, selectedTypes, selectedAnnees, montantMin, montantMax]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    setSelectedVilles([]);
    setSelectedTypes([]);
    setSelectedAnnees([]);
    setMontantMin("");
    setMontantMax("");
    setSelectedIds([]);
  };

  const handleValidate = () => {
    setSelectedReferences(selectedIds);
    showSuccess("Références validées !");
    // TODO: Passer à l'étape suivante (génération)
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-brand-dark tracking-tight drop-shadow-sm">
        Sélectionner les références projets
      </h2>
      <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div className="mb-2 text-sm font-semibold text-brand-dark">Ville</div>
          <div className="flex flex-wrap gap-2">
            {VILLES.map((ville) => (
              <Button
                key={ville}
                variant={selectedVilles.includes(ville) ? "default" : "outline"}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border-2 ${
                  selectedVilles.includes(ville)
                    ? "bg-brand-yellow text-brand-dark border-brand-yellow"
                    : "border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
                }`}
                onClick={() =>
                  setSelectedVilles((prev) =>
                    prev.includes(ville)
                      ? prev.filter((v) => v !== ville)
                      : [...prev, ville]
                  )
                }
                type="button"
                aria-pressed={selectedVilles.includes(ville)}
              >
                {ville}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-brand-dark">Type de mission</div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((type) => (
              <Button
                key={type}
                variant={selectedTypes.includes(type) ? "default" : "outline"}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border-2 ${
                  selectedTypes.includes(type)
                    ? "bg-brand-yellow text-brand-dark border-brand-yellow"
                    : "border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
                }`}
                onClick={() =>
                  setSelectedTypes((prev) =>
                    prev.includes(type)
                      ? prev.filter((t) => t !== type)
                      : [...prev, type]
                  )
                }
                type="button"
                aria-pressed={selectedTypes.includes(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-brand-dark">Année</div>
          <div className="flex flex-wrap gap-2">
            {ANNEES.map((annee) => (
              <Button
                key={annee}
                variant={selectedAnnees.includes(annee) ? "default" : "outline"}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border-2 ${
                  selectedAnnees.includes(annee)
                    ? "bg-brand-yellow text-brand-dark border-brand-yellow"
                    : "border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
                }`}
                onClick={() =>
                  setSelectedAnnees((prev) =>
                    prev.includes(annee)
                      ? prev.filter((a) => a !== annee)
                      : [...prev, annee]
                  )
                }
                type="button"
                aria-pressed={selectedAnnees.includes(annee)}
              >
                {annee}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-brand-dark">Montant (€)</div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              className="w-20 rounded px-2 py-1 border border-brand-dark text-brand-dark"
              value={montantMin}
              onChange={(e) => setMontantMin(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
            />
            <span className="text-brand-dark">-</span>
            <input
              type="number"
              placeholder="Max"
              className="w-20 rounded px-2 py-1 border border-brand-dark text-brand-dark"
              value={montantMax}
              onChange={(e) => setMontantMax(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-8 mb-12">
        {filteredReferences.map((ref) => (
          <div
            key={ref.id}
            className={`relative border-2 rounded-2xl p-5 bg-white shadow transition-all cursor-pointer ${
              selectedIds.includes(ref.id)
                ? "border-brand-blue bg-brand-pale scale-105"
                : "border-brand-dark hover:border-brand-yellow"
            }`}
            onClick={() => handleSelect(ref.id)}
            tabIndex={0}
            aria-pressed={selectedIds.includes(ref.id)}
            role="button"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-brand-dark">{ref.nom_projet}</div>
              <span className="text-xs bg-brand-yellow text-brand-dark rounded-full px-3 py-0.5 font-semibold">
                {ref.annee}
              </span>
            </div>
            <div className="mb-1 text-sm text-brand-dark/80">
              <span className="font-semibold">{ref.ville}</span> • {ref.type_mission}
            </div>
            <div className="mb-1 text-sm text-brand-dark/80">
              Client : <span className="font-semibold">{ref.client}</span>
            </div>
            <div className="mb-2 text-sm text-brand-dark/70">
              Montant : <span className="font-semibold">{ref.montant.toLocaleString()} €</span>
            </div>
            <div className="text-xs text-brand-dark/60 line-clamp-2">{ref.description_projet}</div>
            {selectedIds.includes(ref.id) && (
              <div className="absolute top-2 right-2 bg-brand-blue text-white rounded-full px-2 py-1 text-xs font-bold shadow">
                Sélectionné
              </div>
            )}
          </div>
        ))}
        {filteredReferences.length === 0 && (
          <div className="col-span-full text-center text-brand-dark/60 py-8 text-lg font-medium">
            Aucune référence ne correspond aux filtres.
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <Button
          variant="outline"
          onClick={handleReset}
          className="rounded-full px-8 py-2 text-base font-semibold border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale transition"
        >
          Réinitialiser
        </Button>
        <Button
          onClick={handleValidate}
          disabled={selectedIds.length === 0}
          className="rounded-full px-8 py-2 text-base font-bold bg-brand-yellow text-brand-dark shadow-lg hover:bg-brand-yellow/90 disabled:opacity-60 transition"
        >
          Valider les références et continuer
        </Button>
      </div>
      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-brand-blue text-white rounded-full px-7 py-4 shadow-2xl font-bold text-xl flex items-center gap-3 border-4 border-white">
          <span>Références :</span>
          <span className="text-3xl">{selectedIds.length}</span>
        </div>
      </div>
    </div>
  );
};