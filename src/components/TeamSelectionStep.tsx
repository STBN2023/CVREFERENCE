import { useState, useMemo } from "react";
import { FilterChips } from "./FilterChips";
import { EmployeeCard, Employee } from "./EmployeeCard";
import { TeamCounter } from "./TeamCounter";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useWorkflow } from "./WorkflowContext";

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
];

export { EMPLOYEES };

export const TeamSelectionStep = () => {
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const { setSelectedTeam } = useWorkflow();

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
    setSelectedTeam(selectedIds);
    showSuccess("Équipe validée !");
    setTimeout(() => {
      navigate("/references");
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-brand-dark tracking-tight drop-shadow-sm">
        Constituer l’équipe
      </h2>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-center md:gap-8">
        <div className="flex-1">
          <FilterChips
            options={AGENCIES}
            selected={selectedAgencies}
            onChange={setSelectedAgencies}
            label="Agence"
          />
        </div>
        <div className="flex-1">
          <FilterChips
            options={FUNCTIONS}
            selected={selectedFunctions}
            onChange={setSelectedFunctions}
            label="Fonction"
          />
        </div>
        <div className="flex-1">
          <FilterChips
            options={LEVELS}
            selected={selectedLevels}
            onChange={setSelectedLevels}
            label="Niveau"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            selected={selectedIds.includes(employee.id)}
            onSelect={handleSelect}
          />
        ))}
        {filteredEmployees.length === 0 && (
          <div className="col-span-full text-center text-brand-dark/60 py-8 text-lg font-medium">
            Aucun salarié ne correspond aux filtres.
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
          Valider l’équipe et continuer
        </Button>
      </div>
      <TeamCounter count={selectedIds.length} />
    </div>
  );
};