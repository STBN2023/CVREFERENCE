import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess } from "@/utils/toast";
import { Trash2, UserPlus, FilePlus2, Users, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

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
  template: string; // Ajout du template
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
  const [salarieForm, setSalarieForm] = useState<Omit<Salarie, "id">>({
    nom: "",
    prenom: "",
    agence: "",
    fonction: "",
    niveau: "",
    actif: true,
    template: "classic",
  });
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
      { ...salarieForm, id: Date.now().toString() },
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
    setEditSalarieId(null);
    showSuccess("Salarié ajouté !");
  };

  const handleEditSalarie = () => {
    if (!editSalarieId) return;
    setSalaries((prev) =>
      prev.map((s) =>
        s.id === editSalarieId ? { ...s, ...salarieForm } : s
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

  return (
    <div className="max-w-6xl mx-auto py-10 px-2">
      <h1 className="text-3xl font-bold mb-8 text-brand-dark">Administration</h1>
      {/* Section Salariés */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-brand-blue">Salariés</h2>
          <Button
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
            }}
            className="bg-brand-yellow text-brand-dark font-bold flex items-center gap-2"
          >
            <UserPlus size={18} /> Ajouter un salarié
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-brand-pale text-brand-dark">
                <th className="px-4 py-2 text-left">Nom</th>
                <th className="px-4 py-2 text-left">Prénom</th>
                <th className="px-4 py-2 text-left">Agence</th>
                <th className="px-4 py-2 text-left">Fonction</th>
                <th className="px-4 py-2 text-left">Niveau</th>
                <th className="px-4 py-2 text-left">Actif</th>
                <th className="px-4 py-2 text-left">Template CV</th>
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {salaries.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-400">Aucun salarié</td>
                </tr>
              )}
              {salaries.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">{s.nom}</td>
                  <td className="px-4 py-2">{s.prenom}</td>
                  <td className="px-4 py-2">{s.agence}</td>
                  <td className="px-4 py-2">{s.fonction}</td>
                  <td className="px-4 py-2">{s.niveau}</td>
                  <td className="px-4 py-2">{s.actif ? "Oui" : "Non"}</td>
                  <td className="px-4 py-2">
                    {CV_TEMPLATES.find(t => t.id === s.template)?.label || "Classique"}
                  </td>
                  <td className="px-4 py-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Éditer"
                      onClick={() => openEditSalarie(s)}
                    >
                      <Pencil className="text-brand-blue" size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer"
                      onClick={() => setDeleteSalarieId(s.id)}
                    >
                      <Trash2 className="text-red-500" size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {/* Section Références */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-brand-blue">Références</h2>
          <Button
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
            className="bg-brand-yellow text-brand-dark font-bold flex items-center gap-2"
          >
            <FilePlus2 size={18} /> Ajouter une référence
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-brand-pale text-brand-dark">
                <th className="px-4 py-2 text-left">Projet</th>
                <th className="px-4 py-2 text-left">Client</th>
                <th className="px-4 py-2 text-left">Ville</th>
                <th className="px-4 py-2 text-left">Année</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Montant</th>
                <th className="px-4 py-2 text-left">Salariés associés</th>
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {references.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-400">Aucune référence</td>
                </tr>
              )}
              {references.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.nom_projet}</td>
                  <td className="px-4 py-2">{r.client}</td>
                  <td className="px-4 py-2">{r.ville}</td>
                  <td className="px-4 py-2">{r.annee}</td>
                  <td className="px-4 py-2">{r.type_mission}</td>
                  <td className="px-4 py-2">{r.montant.toLocaleString()} €</td>
                  <td className="px-4 py-2">
                    {r.salaries.length === 0 ? (
                      <span className="text-gray-400">Aucun</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {r.salaries.map((sid) => {
                          const sal = salaries.find((s) => s.id === sid);
                          return sal ? (
                            <span key={sid} className="inline-flex items-center bg-brand-lightblue text-brand-dark rounded-full px-3 py-0.5 text-xs font-semibold border border-brand-blue">
                              {sal.prenom} {sal.nom}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Éditer"
                      onClick={() => openEditReference(r)}
                    >
                      <Pencil className="text-brand-blue" size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer"
                      onClick={() => setDeleteReferenceId(r.id)}
                    >
                      <Trash2 className="text-red-500" size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {/* Dialogs salariés */}
      <Dialog open={openSalarie} onOpenChange={(open) => {
        setOpenSalarie(open);
        if (!open) {
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
        }
      }}>
        <DialogContent className="max-w-lg bg-brand-pale border-2 border-brand-yellow rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="text-brand-blue" size={28} />
              <DialogTitle className="text-2xl text-brand-blue">
                {editSalarieId ? "Modifier le salarié" : "Nouveau salarié"}
              </DialogTitle>
            </div>
            <p className="text-sm text-brand-dark/70 mb-2">
              {editSalarieId
                ? "Modifiez les informations du salarié."
                : "Remplissez les informations du salarié à ajouter."}
            </p>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              editSalarieId ? handleEditSalarie() : handleAddSalarie();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nom <span className="text-red-500">*</span></Label>
                <Input required value={salarieForm.nom} onChange={e => setSalarieForm(f => ({ ...f, nom: e.target.value }))} autoFocus />
              </div>
              <div>
                <Label>Prénom <span className="text-red-500">*</span></Label>
                <Input required value={salarieForm.prenom} onChange={e => setSalarieForm(f => ({ ...f, prenom: e.target.value }))} />
              </div>
              <div>
                <Label>Agence <span className="text-red-500">*</span></Label>
                <select required className="w-full border rounded px-2 py-2 bg-white" value={salarieForm.agence} onChange={e => setSalarieForm(f => ({ ...f, agence: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {AGENCES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <Label>Fonction <span className="text-red-500">*</span></Label>
                <select required className="w-full border rounded px-2 py-2 bg-white" value={salarieForm.fonction} onChange={e => setSalarieForm(f => ({ ...f, fonction: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {FONCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label>Niveau <span className="text-red-500">*</span></Label>
                <select required className="w-full border rounded px-2 py-2 bg-white" value={salarieForm.niveau} onChange={e => setSalarieForm(f => ({ ...f, niveau: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" checked={salarieForm.actif} onChange={e => setSalarieForm(f => ({ ...f, actif: e.target.checked }))} id="actif" />
                <Label htmlFor="actif" className="mb-0">Actif</Label>
              </div>
              <div>
                <Label>Template de CV <span className="text-red-500">*</span></Label>
                <select required className="w-full border rounded px-2 py-2 bg-white" value={salarieForm.template} onChange={e => setSalarieForm(f => ({ ...f, template: e.target.value }))}>
                  {CV_TEMPLATES.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="mt-2 flex gap-2">
              <Button type="submit" className="bg-brand-blue text-white font-bold rounded-full px-6 py-2">
                {editSalarieId ? "Enregistrer les modifications" : "Enregistrer"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-full px-6 py-2">Annuler</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialogs références */}
      <Dialog open={openReference} onOpenChange={(open) => {
        setOpenReference(open);
        if (!open) {
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
        }
      }}>
        <DialogContent className="max-w-lg bg-brand-pale border-2 border-brand-yellow rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <FilePlus2 className="text-brand-blue" size={28} />
              <DialogTitle className="text-2xl text-brand-blue">
                {editReferenceId ? "Modifier la référence" : "Nouvelle référence"}
              </DialogTitle>
            </div>
            <p className="text-sm text-brand-dark/70 mb-2">
              {editReferenceId
                ? "Modifiez les détails du projet de référence et les salariés associés."
                : "Renseignez les détails du projet de référence et associez les salariés concernés."}
            </p>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              editReferenceId ? handleEditReference() : handleAddReference();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nom du projet <span className="text-red-500">*</span></Label>
                <Input required value={referenceForm.nom_projet} onChange={e => setReferenceForm(f => ({ ...f, nom_projet: e.target.value }))} autoFocus />
              </div>
              <div>
                <Label>Client <span className="text-red-500">*</span></Label>
                <Input required value={referenceForm.client} onChange={e => setReferenceForm(f => ({ ...f, client: e.target.value }))} />
              </div>
              <div>
                <Label>Ville <span className="text-red-500">*</span></Label>
                <Input required value={referenceForm.ville} onChange={e => setReferenceForm(f => ({ ...f, ville: e.target.value }))} />
              </div>
              <div>
                <Label>Année <span className="text-red-500">*</span></Label>
                <Input required type="number" min={1900} max={2100} value={referenceForm.annee} onChange={e => setReferenceForm(f => ({ ...f, annee: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Type de mission <span className="text-red-500">*</span></Label>
                <select required className="w-full border rounded px-2 py-2 bg-white" value={referenceForm.type_mission} onChange={e => setReferenceForm(f => ({ ...f, type_mission: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {TYPES_MISSION.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Montant (€) <span className="text-red-500">*</span></Label>
                <Input required type="number" min={0} value={referenceForm.montant} onChange={e => setReferenceForm(f => ({ ...f, montant: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Salariés associés</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {salaries.length === 0 && (
                  <span className="text-gray-400 text-sm">Aucun salarié disponible</span>
                )}
                {salaries.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`flex items-center gap-1 px-3 py-1 rounded-full border-2 text-sm font-medium transition
                      ${referenceForm.salaries.includes(s.id)
                        ? "bg-brand-blue text-white border-brand-blue shadow"
                        : "bg-white text-brand-dark border-brand-dark hover:bg-brand-pale"}
                    `}
                    onClick={() => handleToggleSalarieForReference(s.id)}
                    aria-pressed={referenceForm.salaries.includes(s.id)}
                  >
                    <Users size={14} className="mr-1" />
                    {s.prenom} {s.nom}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Description <span className="text-red-500">*</span></Label>
              <textarea required className="w-full border rounded px-2 py-2 min-h-[60px] bg-white" value={referenceForm.description_projet} onChange={e => setReferenceForm(f => ({ ...f, description_projet: e.target.value }))} />
            </div>
            <DialogFooter className="mt-2 flex gap-2">
              <Button type="submit" className="bg-brand-blue text-white font-bold rounded-full px-6 py-2">
                {editReferenceId ? "Enregistrer les modifications" : "Enregistrer"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-full px-6 py-2">Annuler</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Suppression dialogs */}
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