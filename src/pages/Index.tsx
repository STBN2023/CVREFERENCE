import { TeamSelectionStep } from "@/components/TeamSelectionStep";
import { MadeWithDyad } from "@/components/made-with-dyad";

const TeamPage = () => {
  return (
    <div className="min-h-screen bg-[#D9ECFB] flex flex-col">
      <TeamSelectionStep />
      <MadeWithDyad />
    </div>
  );
};

export default TeamPage;