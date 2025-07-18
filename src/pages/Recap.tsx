import { RecapStep } from "@/components/RecapStep";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Recap = () => {
  return (
    <div className="min-h-screen bg-[#FCE7B3] flex flex-col">
      <RecapStep />
      <MadeWithDyad />
    </div>
  );
};

export default Recap;