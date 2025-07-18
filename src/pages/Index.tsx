import { TeamSelectionStep } from "@/components/TeamSelectionStep";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <TeamSelectionStep />
      <MadeWithDyad />
    </div>
  );
};

export default Index;