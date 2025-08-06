import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { useWorkflow } from "./WorkflowContext";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

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

// Les données sont maintenant chargées depuis l'API

export const ReferenceSelectionStep = () => {
  const [selectedVilles, setSelectedVilles] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAnnees, setSelectedAnnees] = useState<number[]>([]);
  const [montantMin, setMontantMin] = useState<number | "">("");
  const [montantMax, setMontantMax] = useState<number | "">("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openReset, setOpenReset] = useState(false);
  const { setSelectedReferences } = useWorkflow();
  const navigate = useNavigate();

  // États pour les données chargées depuis l'API
  const [references, setReferences] = useState<Reference[]>([]);
  const [villes, setVilles] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [annees, setAnnees] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Chargement des données depuis l'API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les références
        const referencesResponse = await fetch(`${BACKEND_URL}/api/references`);
        if (referencesResponse.ok) {
          const referencesData = await referencesResponse.json();
          const formattedReferences = referencesData.references.map((ref: any) => ({
            id: ref.id_reference.toString(),
            nom_projet: ref.nom_projet,
            ville: ref.ville,
            annee: ref.annee,
            type_mission: ref.type_mission,
            montant: ref.montant,
            client: ref.client,
            description_projet: ref.description_projet
          }));
          setReferences(formattedReferences);
          
          // Extraire les valeurs uniques pour les filtres
          const uniqueVilles = [...new Set(formattedReferences.map((ref: Reference) => ref.ville))].sort() as string[];
          const uniqueTypes = [...new Set(formattedReferences.map((ref: Reference) => ref.type_mission))].sort() as string[];
          const uniqueAnnees = [...new Set(formattedReferences.map((ref: Reference) => ref.annee))].sort((a: number, b: number) => b - a) as number[];
          
          setVilles(uniqueVilles);
          setTypes(uniqueTypes);
          setAnnees(uniqueAnnees);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des références:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredReferences = useMemo(() => {
    return references.filter((ref) =>
      (selectedVilles.length === 0 || selectedVilles.includes(ref.ville)) &&
      (selectedTypes.length === 0 || selectedTypes.includes(ref.type_mission)) &&
      (selectedAnnees.length === 0 || selectedAnnees.includes(ref.annee)) &&
      (montantMin === "" || ref.montant >= (montantMin as number)) &&
      (montantMax === "" || ref.montant <= (montantMax as number))
    );
  }, [references, selectedVilles, selectedTypes, selectedAnnees, montantMin, montantMax]);

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
    setOpenReset(false);
  };

  const handleValidate = () => {
    setSelectedReferences(selectedIds);
    showSuccess("Références validées !");
    setTimeout(() => {
      navigate("/recap");
    }, 600);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-2">
        <div className="text-center py-20">
          <div className="text-2xl font-bold text-brand-dark mb-4">Chargement des références...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-brand-dark tracking-tight drop-shadow-sm">
        Sélectionner les références projets
      </h2>
      <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div className="mb-2 text-sm font-semibold text-brand-dark">Ville</div>
          <div className="flex flex-wrap gap-2">
            {villes.map((ville) => (
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
            {types.map((type) => (
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
            {annees.map((annee) => (
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
          onClick={() => setOpenReset(true)}
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
      <AlertDialog open={openReset} onOpenChange={setOpenReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser la sélection ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action va effacer tous les filtres et la sélection en cours.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleReset}>Réinitialiser</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};