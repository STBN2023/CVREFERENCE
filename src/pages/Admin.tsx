import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
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

  // Loading pour le bouton de test
  const [loadingTest, setLoadingTest] = useState(false);

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

  // Bouton test enrichissement PowerPoint
  const handleTestEnrich = async () => {
    setLoadingTest(true);
    try {
      await testEnrichPptx();
      showSuccess("Téléchargement du PowerPoint enrichi lancé !");
    } catch (e) {
      showError("Erreur lors du test d'enrichissement PowerPoint.");
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-2">
      <div className="mb-6 flex justify-end">
        <Button
          variant="outline"
          className="border-brand-blue text-brand-blue font-semibold"
          onClick={handleTestEnrich}
          disabled={loadingTest}
        >
          {loadingTest ? "Génération..." : "Tester enrichissement PowerPoint (mock)"}
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-brand-dark">Administration</h1>
      {/* Section Salariés */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <Users className="mr-2" /> Salariés
          </h2>
          <Button
            variant="default"
            className="rounded-full px-6 py-2 font-bold"
            onClick={() => {
              setOpenSalarie(true);
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
            }}
          >
            <UserPlus className="mr-2" /> Ajouter
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {salaries.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-brand-dark">{s.prenom} {s.nom}</div>
                  <div className="text-sm text-brand-dark/80">{s.fonction} • {s.niveau}</div>
                  <div className="text-xs text-brand-dark/60">{s.agence}</div>
                  <div className="text-xs text-brand-dark/60">Template : {CV_TEMPLATES.find(t => t.id === s.template)?.label || s.template}</div>
                  <div className="text-xs text-brand-dark/60">Actif : {s.actif ? "Oui" : "Non"}</div>
                  {s.cvFile && (
                    <a href={s.cvFile.url} download={s.cvFile.name} className="text-xs text-brand-blue underline flex items-center gap-1 mt-1">
                      <Download size={14} /> Télécharger CV
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditSalarie(s)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteSalarieId(s.id)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {salaries.length === 0 && (
            <div className="col-span-full text-center text-brand-dark/60 py-8 text-lg font-medium">
              Aucun salarié.
            </div>
          )}
        </div>
      </div>
      {/* Section Références */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <FilePlus2 className="mr-2" /> Références
          </h2>
          <Button
            variant="default"
            className="rounded-full px-6 py-2 font-bold"
            onClick={() => {
              setOpenReference(true);
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
            }}
          >
            <FilePlus2 className="mr-2" /> Ajouter
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {references.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-brand-dark">{r.nom_projet}</div>
                  <div className="text-sm text-brand-dark/80">{r.type_mission} • {r.annee}</div>
                  <div className="text-xs text-brand-dark/60">{r.ville}</div>
                  <div className="text-xs text-brand-dark/60">Client : {r.client}</div>
                  <div className="text-xs text-brand-dark/60">Montant : {r.montant.toLocaleString()} €</div>
                  <div className="text-xs text-brand-dark/60">Description : {r.description_projet}</div>
                  <div className="text-xs text-brand-dark/60">Salariés associés : {r.salaries.map(id => {
                    const s = salaries.find(sal => sal.id === id);
                    return s ? `${s.prenom} ${s.nom}` : id;
                  }).join(", ") || "Aucun"}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditReference(r)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteReferenceId(r.id)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {references.length === 0 && (
            <div className="col-span-full text-center text-brand-dark/60 py-8 text-lg font-medium">
              Aucune référence.
            </div>
          )}
        </div>
      </div>
      {/* Dialogs pour ajout/édition/suppression */}
      <Dialog open={openSalarie} onOpenChange={setOpenSalarie}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editSalarieId ? "Éditer un salarié" : "Ajouter un salarié"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Prénom</Label>
                <Input value={salarieForm.prenom} onChange={e => setSalarieForm(f => ({ ...f, prenom: e.target.value }))} />
              </div>
              <div>
                <Label>Nom</Label>
                <Input value={salarieForm.nom} onChange={e => setSalarieForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Agence</Label>
                <select className="w-full border rounded px-2 py-1" value={salarieForm.agence} onChange={e => setSalarieForm(f => ({ ...f, agence: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {AGENCES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <Label>Fonction</Label>
                <select className="w-full border rounded px-2 py-1" value={salarieForm.fonction} onChange={e => setSalarieForm(f => ({ ...f, fonction: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {FONCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Niveau</Label>
                <select className="w-full border rounded px-2 py-1" value={salarieForm.niveau} onChange={e => setSalarieForm(f => ({ ...f, niveau: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <Label>Template</Label>
                <select className="w-full border rounded px-2 py-1" value={salarieForm.template} onChange={e => setSalarieForm(f => ({ ...f, template: e.target.value }))}>
                  {CV_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Actif</Label>
              <input type="checkbox" checked={salarieForm.actif} onChange={e => setSalarieForm(f => ({ ...f, actif: e.target.checked }))} className="ml-2" />
            </div>
            <div>
              <Label>CV PowerPoint (.pptx)</Label>
              <Input type="file" accept=".pptx" onChange={handleCvFileChange} />
              {cvFile && <div className="text-xs mt-1">{cvFile.name}</div>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editSalarieId ? handleEditSalarie : handleAddSalarie}>
              {editSalarieId ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openReference} onOpenChange={setOpenReference}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editReferenceId ? "Éditer une référence" : "Ajouter une référence"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nom du projet</Label>
              <Input value={referenceForm.nom_projet} onChange={e => setReferenceForm(f => ({ ...f, nom_projet: e.target.value }))} />
            </div>
            <div>
              <Label>Client</Label>
              <Input value={referenceForm.client} onChange={e => setReferenceForm(f => ({ ...f, client: e.target.value }))} />
            </div>
            <div>
              <Label>Ville</Label>
              <select className="w-full border rounded px-2 py-1" value={referenceForm.ville} onChange={e => setReferenceForm(f => ({ ...f, ville: e.target.value }))}>
                <option value="">Sélectionner</option>
                {AGENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <Label>Année</Label>
              <Input type="number" value={referenceForm.annee} onChange={e => setReferenceForm(f => ({ ...f, annee: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Type de mission</Label>
              <select className="w-full border rounded px-2 py-1" value={referenceForm.type_mission} onChange={e => setReferenceForm(f => ({ ...f, type_mission: e.target.value }))}>
                <option value="">Sélectionner</option>
                {TYPES_MISSION.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Montant (€)</Label>
              <Input type="number" value={referenceForm.montant} onChange={e => setReferenceForm(f => ({ ...f, montant: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={referenceForm.description_projet} onChange={e => setReferenceForm(f => ({ ...f, description_projet: e.target.value }))} />
            </div>
            <div>
              <Label>Salariés associés</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {salaries.map(s => (
                  <label key={s.id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={referenceForm.salaries.includes(s.id)}
                      onChange={() => handleToggleSalarieForReference(s.id)}
                    />
                    {s.prenom} {s.nom}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editReferenceId ? handleEditReference : handleAddReference}>
              {editReferenceId ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* AlertDialog pour suppression salarié */}
      <AlertDialog open={!!deleteSalarieId} onOpenChange={open => !open && setDeleteSalarieId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce salarié ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteSalarie}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* AlertDialog pour suppression référence */}
      <AlertDialog open={!!deleteReferenceId} onOpenChange={open => !open && setDeleteReferenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette référence ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteReference}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Admin;