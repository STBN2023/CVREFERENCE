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

  return (
    <Card
      className={cn(
        "relative flex flex-col items-center p-5 cursor-pointer border-2 rounded-2xl shadow transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-400",
        selected
          ? "border-blue-600 bg-blue-50 scale-105 shadow-lg"
          : "border-gray-200 hover:border-blue-300 bg-white"
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
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
            <User className="text-gray-400" size={36} />
          </div>
        )}
        {selected && (
          <CheckCircle2
            className="absolute -top-2 -right-2 text-blue-600 bg-white rounded-full animate-bounce shadow"
            size={26}
            aria-label="Sélectionné"
          />
        )}
      </div>
      <div className="font-semibold text-lg mb-1 text-gray-900">{employee.name}</div>
      <div className="flex flex-wrap gap-1 justify-center">
        <Badge variant="secondary" className="rounded-full px-3 py-0.5">{employee.agency}</Badge>
        <Badge variant="outline" className="rounded-full px-3 py-0.5">{employee.function}</Badge>
        <Badge variant="default" className="rounded-full px-3 py-0.5">{employee.level}</Badge>
      </div>
    </Card>
  );
};

export type { Employee };