import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess } from "@/utils/toast";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

type Salarie = {
  id: string;
  nom: string;
  prenom: string;
  agence: string;
  fonction: string;
  niveau: string;
  actif: boolean;
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
};

const AGENCES = ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Toulouse"];
const FONCTIONS = ["Architecte", "Ingénieur", "Chargé d'affaires", "Chef de projet", "Consultant", "Économiste"];
const NIVEAUX = ["Junior", "Confirmé", "Senior", "Expert"];
const TYPES_MISSION = ["Construction", "Rénovation", "Extension", "Audit", "Conseil"];

function Admin() {
  // Mock data (in-memory)
  const [salaries, setSalaries] = useState<Salarie[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
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
  });
  const [referenceForm, setReferenceForm] = useState<Omit<Reference, "id">>({
    nom_projet: "",
    client: "",
    ville: "",
    annee: new Date().getFullYear(),
    type_mission: "",
    montant: 0,
    description_projet: "",
  });

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
    });
    showSuccess("Salarié ajouté !");
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
    });
    showSuccess("Référence ajoutée !");
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

  return (
    <div className="max-w-6xl mx-auto py-10 px-2">
      <h1 className="text-3xl font-bold mb-8 text-brand-dark">Administration</h1>
      {/* Section Salariés */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-brand-blue">Salariés</h2>
          <Button onClick={() => setOpenSalarie(true)} className="bg-brand-yellow text-brand-dark font-bold">
            Ajouter un salarié
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
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {salaries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">Aucun salarié</td>
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
          <Button onClick={() => setOpenReference(true)} className="bg-brand-yellow text-brand-dark font-bold">
            Ajouter une référence
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
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {references.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">Aucune référence</td>
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
      {/* Dialogs */}
      <Dialog open={openSalarie} onOpenChange={setOpenSalarie}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un salarié</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAddSalarie();
            }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Nom*</Label>
                <Input required value={salarieForm.nom} onChange={e => setSalarieForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="flex-1">
                <Label>Prénom*</Label>
                <Input required value={salarieForm.prenom} onChange={e => setSalarieForm(f => ({ ...f, prenom: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Agence*</Label>
                <select required className="w-full border rounded px-2 py-1" value={salarieForm.agence} onChange={e => setSalarieForm(f => ({ ...f, agence: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {AGENCES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <Label>Fonction*</Label>
                <select required className="w-full border rounded px-2 py-1" value={salarieForm.fonction} onChange={e => setSalarieForm(f => ({ ...f, fonction: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {FONCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Niveau*</Label>
                <select required className="w-full border rounded px-2 py-1" value={salarieForm.niveau} onChange={e => setSalarieForm(f => ({ ...f, niveau: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex-1 flex items-center gap-2 mt-6">
                <input type="checkbox" checked={salarieForm.actif} onChange={e => setSalarieForm(f => ({ ...f, actif: e.target.checked }))} id="actif" />
                <Label htmlFor="actif">Actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-brand-yellow text-brand-dark font-bold">Enregistrer</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Annuler</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={openReference} onOpenChange={setOpenReference}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une référence</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAddReference();
            }}
            className="space-y-3"
          >
            <Label>Nom du projet*</Label>
            <Input required value={referenceForm.nom_projet} onChange={e => setReferenceForm(f => ({ ...f, nom_projet: e.target.value }))} />
            <Label>Client*</Label>
            <Input required value={referenceForm.client} onChange={e => setReferenceForm(f => ({ ...f, client: e.target.value }))} />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Ville*</Label>
                <Input required value={referenceForm.ville} onChange={e => setReferenceForm(f => ({ ...f, ville: e.target.value }))} />
              </div>
              <div className="flex-1">
                <Label>Année*</Label>
                <Input required type="number" min={1900} max={2100} value={referenceForm.annee} onChange={e => setReferenceForm(f => ({ ...f, annee: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Type de mission*</Label>
                <select required className="w-full border rounded px-2 py-1" value={referenceForm.type_mission} onChange={e => setReferenceForm(f => ({ ...f, type_mission: e.target.value }))}>
                  <option value="">Sélectionner</option>
                  {TYPES_MISSION.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <Label>Montant (€)*</Label>
                <Input required type="number" min={0} value={referenceForm.montant} onChange={e => setReferenceForm(f => ({ ...f, montant: Number(e.target.value) }))} />
              </div>
            </div>
            <Label>Description*</Label>
            <textarea required className="w-full border rounded px-2 py-1" value={referenceForm.description_projet} onChange={e => setReferenceForm(f => ({ ...f, description_projet: e.target.value }))} />
            <DialogFooter>
              <Button type="submit" className="bg-brand-yellow text-brand-dark font-bold">Enregistrer</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Annuler</Button>
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