import { useState, useMemo } from "react";
import { FilterChips } from "./FilterChips";
import { EmployeeCard, Employee } from "./EmployeeCard";
import { TeamCounter } from "./TeamCounter";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";

const AGENCIES = ["Paris", "Lyon", "Marseille"];
const FUNCTIONS = ["Développeur", "Designer", "Chef de projet"];
const LEVELS = ["Junior", "Confirmé", "Senior"];

const EMPLOYEES: Employee[] = [
  { id: "1", name: "Alice Martin", agency: "Paris", function: "Développeur", level: "Senior" },
  { id: "2", name: "Benoit Dubois", agency: "Lyon", function: "Designer", level: "Confirmé" },
  { id: "3", name: "Claire Leroy", agency: "Marseille", function: "Chef de projet", level: "Senior" },
  { id: "4", name: "David Morel", agency: "Paris", function: "Développeur", level: "Junior" },
  { id: "5", name: "Emma Bernard", agency: "Lyon", function: "Développeur", level: "Confirmé" },
  { id: "6", name: "Fabrice Petit", agency: "Marseille", function: "Designer", level: "Junior" },
  // Ajoute d'autres exemples si besoin
];

export const TeamSelectionStep = () => {
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredEmployees = useMemo(() => {
    return EMPLOYEES.filter((e) =>
      (selectedAgencies.length === 0 || selectedAgencies.includes(e.agency)) &&
      (selectedFunctions.length === 0 || selectedFunctions.includes(e.function)) &&
      (selectedLevels.length === 0 || selectedLevels.includes(e.level))
    );
  }, [selectedAgencies, selectedFunctions, selectedLevels]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    setSelectedAgencies([]);
    setSelectedFunctions([]);
    setSelectedLevels([]);
    setSelectedIds([]);
  };

  const handleValidate = () => {
    showSuccess("Équipe validée !");
    // Ici tu pourrais déclencher la suite du workflow
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Constituer l’équipe</h2>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FilterChips
          options={AGENCIES}
          selected={selectedAgencies}
          onChange={setSelectedAgencies}
          label="Agence"
        />
        <FilterChips
          options={FUNCTIONS}
          selected={selectedFunctions}
          onChange={setSelectedFunctions}
          label="Fonction"
        />
        <FilterChips
          options={LEVELS}
          selected={selectedLevels}
          onChange={setSelectedLevels}
          label="Niveau"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            selected={selectedIds.includes(employee.id)}
            onSelect={handleSelect}
          />
        ))}
        {filteredEmployees.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            Aucun salarié ne correspond aux filtres.
          </div>
        )}
      </div>
      <div className="flex justify-between items-center gap-4">
        <Button variant="outline" onClick={handleReset}>
          Réinitialiser
        </Button>
        <Button onClick={handleValidate} disabled={selectedIds.length === 0}>
          Valider l’équipe et continuer
        </Button>
      </div>
      <TeamCounter count={selectedIds.length} />
    </div>
  );
};