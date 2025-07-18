import { Button } from "@/components/ui/button";

type FilterChipsProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
};

export const FilterChips = ({ options, selected, onChange, label }: FilterChipsProps) => {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div>
      {label && <div className="mb-2 text-sm font-semibold text-gray-700">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={selected.includes(option) ? "default" : "outline"}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition
              ${selected.includes(option) ? "bg-blue-600 text-white border-blue-600" : ""}
            `}
            onClick={() => toggle(option)}
            type="button"
            aria-pressed={selected.includes(option)}
            tabIndex={0}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};