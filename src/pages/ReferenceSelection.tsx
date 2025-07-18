import { ReferenceSelectionStep } from "@/components/ReferenceSelectionStep";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useWorkflow } from "@/components/WorkflowContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ReferenceSelection = () => {
  const { selectedReferences } = useWorkflow();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedReferences.length > 0) {
      navigate("/association");
    }
    // eslint-disable-next-line
  }, [selectedReferences]);

  return (
    <div className="min-h-screen bg-[#FCE7B3] flex flex-col">
      <ReferenceSelectionStep />
      <MadeWithDyad />
    </div>
  );
};

export default ReferenceSelection;