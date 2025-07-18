import React, { createContext, useContext, useState, ReactNode } from "react";

type ReferenceAssociation = Record<string, string[]>; // { [employeeId]: [referenceId, ...] }
type TemplateAssociation = Record<string, string>; // { [employeeId]: templateId }

type WorkflowContextType = {
  selectedTeam: string[];
  setSelectedTeam: (ids: string[]) => void;
  selectedReferences: string[];
  setSelectedReferences: (ids: string[]) => void;
  referenceAssociation: ReferenceAssociation;
  setReferenceAssociation: (assoc: ReferenceAssociation) => void;
  templateAssociation: TemplateAssociation;
  setTemplateAssociation: (assoc: TemplateAssociation) => void;
};

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [referenceAssociation, setReferenceAssociation] = useState<ReferenceAssociation>({});
  const [templateAssociation, setTemplateAssociation] = useState<TemplateAssociation>({});

  return (
    <WorkflowContext.Provider
      value={{
        selectedTeam,
        setSelectedTeam,
        selectedReferences,
        setSelectedReferences,
        referenceAssociation,
        setReferenceAssociation,
        templateAssociation,
        setTemplateAssociation,
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