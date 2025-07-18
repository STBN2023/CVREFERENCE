import React, { createContext, useContext, useState, ReactNode } from "react";

type WorkflowContextType = {
  selectedTeam: string[];
  setSelectedTeam: (ids: string[]) => void;
  selectedReferences: string[];
  setSelectedReferences: (ids: string[]) => void;
};

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);

  return (
    <WorkflowContext.Provider
      value={{
        selectedTeam,
        setSelectedTeam,
        selectedReferences,
        setSelectedReferences,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
};