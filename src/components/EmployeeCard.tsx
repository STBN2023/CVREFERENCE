import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, User } from "lucide-react";

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
  return (
    <Card
      className={`relative flex flex-col items-center p-4 cursor-pointer border-2 transition
        ${selected ? "border-blue-600 bg-blue-50" : "border-transparent hover:border-blue-300"}
      `}
      onClick={() => onSelect(employee.id)}
      tabIndex={0}
      aria-pressed={selected}
    >
      <div className="relative mb-2">
        {employee.avatarUrl ? (
          <img
            src={employee.avatarUrl}
            alt={employee.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="text-gray-400" size={32} />
          </div>
        )}
        {selected && (
          <CheckCircle2 className="absolute -top-2 -right-2 text-blue-600 bg-white rounded-full" size={22} />
        )}
      </div>
      <div className="font-semibold text-base mb-1">{employee.name}</div>
      <div className="flex flex-wrap gap-1 justify-center">
        <Badge variant="secondary">{employee.agency}</Badge>
        <Badge variant="outline">{employee.function}</Badge>
        <Badge variant="default">{employee.level}</Badge>
      </div>
    </Card>
  );
};

export type { Employee };