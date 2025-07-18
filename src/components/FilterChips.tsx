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
      {label && <div className="mb-2 text-sm font-semibold text-brand-dark">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <Button
              key={option}
              variant={isSelected ? "default" : "outline"}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition
                border-2
                ${
                  isSelected
                    ? "bg-brand-yellow text-brand-dark border-brand-yellow shadow focus:ring-2 focus:ring-brand-yellow/60"
                    : "border-brand-dark text-brand-dark bg-white hover:bg-brand-pale focus:ring-2 focus:ring-brand-blue/40"
                }
                focus:outline-none
              `}
              onClick={() => toggle(option)}
              type="button"
              aria-pressed={isSelected}
              tabIndex={0}
            >
              {option}
            </Button>
          );
        })}
      </div>
    </div>
  );
};