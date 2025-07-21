import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess } from "@/utils/toast";
import { Trash2, UserPlus, FilePlus2, Users, Pencil, Download } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { testEnrichPptx } from "@/utils/testEnrichPptx";

const CV_TEMPLATES = [
  { id: "classic", label: "Classique" },
  { id: "modern", label: "Moderne" },
  { id: "minimal", label: "Minimal" },
];

type Salarie = {
  id: string;
  nom: string;
  prenom: string;
  agence: string;
  fonction: string;
  niveau: string;
  actif: boolean;
  template: string;
  cvFile?: {
    name: string;
    url: string;
  };
};

type Reference = {
  id: string;
  nom_projet: string;
  client: string;
  ville: string;
  annee: number;
  type_mission: string;
  montant: number;
  description_projet: string;
  salaries: string[];
};

const AGENCES = ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Toulouse"];
const FONCTIONS = ["Architecte", "Ingénieur", "Chargé d'affaires", "Chef de projet", "Consultant", "Économiste"];
const NIVEAUX = ["Junior", "Confirmé", "Senior", "Expert"];
const TYPES_MISSION = ["Construction", "Rénovation", "Extension", "Audit", "Conseil"];

const MOCK_SALARIES: Salarie[] = [
  { id: "1", nom: "Martin", prenom: "Alice", agence: "Paris", fonction: "Ingénieur", niveau: "Senior", actif: true, template: "classic" },
  { id: "2", nom: "Dubois", prenom: "Benoit", agence: "Lyon", fonction: "Architecte", niveau: "Confirmé", actif: true, template: "modern" },
  { id: "3", nom: "Leroy", prenom: "Claire", agence: "Marseille", fonction: "Chef de projet", niveau: "Senior", actif: false, template: "minimal" },
];

const MOCK_REFERENCES: Reference[] = [
  {
    id: "1",
    nom_projet: "Tour Majunga",
    ville: "Paris",
    annee: 2021,
    type_mission: "Construction",
    montant: 12000000,
    client: "Société Générale",
    description_projet: "Construction d'une tour de bureaux de 45 étages.",
    salaries: ["1", "2"],
  },
  {
    id: "2",
    nom_projet: "Hôpital Sud",
    ville: "Lyon",
    annee: 2019,
    type_mission: "Rénovation",
    montant: 8000000,
    client: "CHU Lyon",
    description_projet: "Rénovation complète du pôle maternité.",
    salaries: ["2"],
  },
  {
    id: "3",
    nom_projet: "Campus Innovation",
    ville: "Toulouse",
    annee: 2022,
    type_mission: "Extension",
    montant: 5000000,
    client: "Université Toulouse",
    description_projet: "Extension du campus universitaire avec laboratoires.",
    salaries: [],
  },
];

function Admin() {
  const [salaries, setSalaries] = useState<Salarie[]>(MOCK_SALARIES);
  const [references, setReferences] = useState<Reference[]>(MOCK_REFERENCES);

  // Dialogs
  const [openSalarie, setOpenSalarie] = useState(false);
  const [openReference, setOpenReference] = useState(false);

  // Form state
  const [salarieForm, setSalarieForm] = useState<Omit<Salarie, "id" | "cvFile">>({
    nom: "",
    prenom: "",
    agence: "",
    fonction: "",
    niveau: "",
    actif: true,
    template: "classic",
  });
  const [cvFile, setCvFile] = useState<{ name: string; url: string } | undefined>(undefined);

  const [referenceForm, setReferenceForm] = useState<Omit<Reference, "id">>({
    nom_projet: "",
    client: "",
    ville: "",
    annee: new Date().getFullYear(),
    type_mission: "",
    montant: 0,
    description_projet: "",
    salaries: [],
  });

  // Edition
  const [editSalarieId, setEditSalarieId] = useState<string | null>(null);
  const [editReferenceId, setEditReferenceId] = useState<string | null>(null);

  // Suppression dialogs
  const [deleteSalarieId, setDeleteSalarieId] = useState<string | null>(null);
  const [deleteReferenceId, setDeleteReferenceId] = useState<string | null>(null);

  // Handlers
  const handleAddSalarie = () => {
    setSalaries((prev) => [
      ...prev,
      { ...salarieForm, id: Date.now().toString(), cvFile },
    ]);
    setOpenSalarie(false);
    setSalarieForm({
      nom: "",
      prenom: "",
      agence: "",
      fonction: "",
      niveau: "",
      actif: true,
      template: "classic",
    });
    setCvFile(undefined);
    setEditSalarieId(null);
    showSuccess("Salarié ajouté !");
  };

  const handleEditSalarie = () => {
    if (!editSalarieId) return;
    setSalaries((prev) =>
      prev.map((s) =>
        s.id === editSalarieId ? { ...s, ...salarieForm, cvFile } : s
      )
    );
    setOpenSalarie(false);
    setEditSalarieId(null);
    setSalarieForm({
      nom: "",
      prenom: "",
      agence: "",
      fonction: "",
      niveau: "",
      actif: true,
      template: "classic",
    });
    setCvFile(undefined);
    showSuccess("Salarié modifié !");
  };

  const handleAddReference = () => {
    setReferences((prev) => [
      ...prev,
      { ...referenceForm, id: Date.now().toString() },
    ]);
    setOpenReference(false);
    setReferenceForm({
      nom_projet: "",
      client: "",
      ville: "",
      annee: new Date().getFullYear(),
      type_mission: "",
      montant: 0,
      description_projet: "",
      salaries: [],
    });
    setEditReferenceId(null);
    showSuccess("Référence ajoutée !");
  };

  const handleEditReference = () => {
    if (!editReferenceId) return;
    setReferences((prev) =>
      prev.map((r) =>
        r.id === editReferenceId ? { ...r, ...referenceForm } : r
      )
    );
    setOpenReference(false);
    setEditReferenceId(null);
    setReferenceForm({
      nom_projet: "",
      client: "",
      ville: "",
      annee: new Date().getFullYear(),
      type_mission: "",
      montant: 0,
      description_projet: "",
      salaries: [],
    });
    showSuccess("Référence modifiée !");
  };

  const handleDeleteSalarie = () => {
    if (deleteSalarieId) {
      setSalaries((prev) => prev.filter((s) => s.id !== deleteSalarieId));
      setDeleteSalarieId(null);
      showSuccess("Salarié supprimé !");
    }
  };

  const handleDeleteReference = () => {
    if (deleteReferenceId) {
      setReferences((prev) => prev.filter((r) => r.id !== deleteReferenceId));
      setDeleteReferenceId(null);
      showSuccess("Référence supprimée !");
    }
  };

  // Multi-select pour salariés associés à une référence
  const handleToggleSalarieForReference = (id: string) => {
    setReferenceForm((prev) => ({
      ...prev,
      salaries: prev.salaries.includes(id)
        ? prev.salaries.filter((sid) => sid !== id)
        : [...prev.salaries, id],
    }));
  };

  // Pré-remplissage pour édition
  const openEditSalarie = (s: Salarie) => {
    setSalarieForm({
      nom: s.nom,
      prenom: s.prenom,
      agence: s.agence,
      fonction: s.fonction,
      niveau: s.niveau,
      actif: s.actif,
      template: s.template,
    });
    setCvFile(s.cvFile);
    setEditSalarieId(s.id);
    setOpenSalarie(true);
  };

  const openEditReference = (r: Reference) => {
    setReferenceForm({
      nom_projet: r.nom_projet,
      client: r.client,
      ville: r.ville,
      annee: r.annee,
      type_mission: r.type_mission,
      montant: r.montant,
      description_projet: r.description_projet,
      salaries: r.salaries,
    });
    setEditReferenceId(r.id);
    setOpenReference(true);
  };

  // Gestion de l'upload du fichier PowerPoint
  const handleCvFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".pptx")) {
      const url = URL.createObjectURL(file);
      setCvFile({ name: file.name, url });
    } else {
      setCvFile(undefined);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-2">
      <div className="mb-6 flex justify-end">
        <Button
          variant="outline"
          className="border-brand-blue text-brand-blue font-semibold"
          onClick={testEnrichPptx}
        >
          Tester enrichissement PowerPoint (mock)
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-brand-dark">Administration</h1>
      {/* Section Salariés */}
      {/* ...le reste du composant reste inchangé... */}
      {/* (tout le code existant de la page Admin est conservé) */}
      {/* ... */}
    </div>
  );
}

export default Admin;