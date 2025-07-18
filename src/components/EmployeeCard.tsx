import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { KeyboardEvent } from "react";

type Employee = {
  id: string;
  name: string;
  agency: string;
  function: string;
  level: string;
  avatarUrl?: string;
};

type EmployeeCardProps = {
  employee: Employee;
  selected: boolean;
  onSelect: (id: string) => void;
};

export const EmployeeCard = ({ employee, selected, onSelect }: EmployeeCardProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onSelect(employee.id);
    }
  };

  // Définition des couleurs de badge selon la charte
  const agencyBadgeClass = "bg-brand-lightblue text-brand-dark border-none";
  const functionBadgeClass = "border-brand-blue text-brand-blue bg-white";
  const levelBadgeClass = "bg-brand-yellow text-brand-dark border-none";

  return (
    <Card
      className={cn(
        "relative flex flex-col items-center p-5 cursor-pointer border-2 rounded-2xl shadow transition-all duration-200 outline-none focus:ring-4 focus:ring-brand-yellow/60",
        selected
          ? "border-brand-yellow bg-brand-pale scale-105 shadow-lg"
          : "border-brand-dark hover:border-brand-yellow bg-white"
      )}
      onClick={() => onSelect(employee.id)}
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Sélectionner ${employee.name}`}
      onKeyDown={handleKeyDown}
      role="button"
    >
      <div className="relative mb-3">
        {employee.avatarUrl ? (
          <img
            src={employee.avatarUrl}
            alt={employee.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-brand-dark bg-brand-lightblue"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-brand-lightblue flex items-center justify-center border-2 border-brand-dark">
            <User className="text-brand-dark" size={36} />
          </div>
        )}
        {selected && (
          <CheckCircle2
            className="absolute -top-2 -right-2 text-brand-yellow bg-white rounded-full animate-bounce shadow"
            size={26}
            aria-label="Sélectionné"
          />
        )}
      </div>
      <div className="font-semibold text-lg mb-1 text-brand-dark">{employee.name}</div>
      <div className="flex flex-wrap gap-1 justify-center">
        <Badge variant="secondary" className={`rounded-full px-3 py-0.5 ${agencyBadgeClass}`}>{employee.agency}</Badge>
        <Badge variant="outline" className={`rounded-full px-3 py-0.5 ${functionBadgeClass}`}>{employee.function}</Badge>
        <Badge variant="default" className={`rounded-full px-3 py-0.5 ${levelBadgeClass}`}>{employee.level}</Badge>
      </div>
    </Card>
  );
};

export type { Employee };