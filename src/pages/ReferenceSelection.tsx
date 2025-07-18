import { ReferenceSelectionStep } from "@/components/ReferenceSelectionStep";
import { MadeWithDyad } from "@/components/made-with-dyad";

const ReferenceSelection = () => {
  return (
    <div className="min-h-screen bg-[#FCE7B3] flex flex-col">
      <ReferenceSelectionStep />
      <MadeWithDyad />
    </div>
  );
};

export default ReferenceSelection;