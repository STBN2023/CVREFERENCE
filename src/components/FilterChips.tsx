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
    <div className="mb-2">
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={selected.includes(option) ? "default" : "outline"}
            className="rounded-full px-4 py-1 text-sm"
            onClick={() => toggle(option)}
            type="button"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};