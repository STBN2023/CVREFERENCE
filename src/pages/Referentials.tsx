import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Trash2, Plus, Pencil, Building2, Briefcase, Award } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface Agence {
  id_agence: number;
  nom: string;
  actif: boolean;
}

interface Fonction {
  id_fonction: number;
  nom: string;
  description: string;
  actif: boolean;
}

interface Niveau {
  id_niveau: number;
  nom: string;
  ordre: number;
  description: string;
  actif: boolean;
}

export default function Referentials() {
  // États pour les données
  const [agences, setAgences] = useState<Agence[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les dialogs
  const [openAgence, setOpenAgence] = useState(false);
  const [openFonction, setOpenFonction] = useState(false);
  const [openNiveau, setOpenNiveau] = useState(false);

  // États pour l'édition
  const [editAgenceId, setEditAgenceId] = useState<number | null>(null);
  const [editFonctionId, setEditFonctionId] = useState<number | null>(null);
  const [editNiveauId, setEditNiveauId] = useState<number | null>(null);

  // États pour les formulaires
  const [agenceForm, setAgenceForm] = useState({
    nom: ''
  });

  const [fonctionForm, setFonctionForm] = useState({
    nom: '',
    description: ''
  });

  const [niveauForm, setNiveauForm] = useState({
    nom: '',
    ordre: 1,
    description: ''
  });

  // États pour la suppression
  const [deleteAgenceId, setDeleteAgenceId] = useState<number | null>(null);
  const [deleteFonctionId, setDeleteFonctionId] = useState<number | null>(null);
  const [deleteNiveauId, setDeleteNiveauId] = useState<number | null>(null);

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agencesRes, fonctionsRes, niveauxRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/agences`),
          fetch(`${BACKEND_URL}/api/fonctions`),
          fetch(`${BACKEND_URL}/api/niveaux`)
        ]);

        if (agencesRes.ok) {
          const agencesData = await agencesRes.json();
          setAgences(agencesData.agences);
        }

        if (fonctionsRes.ok) {
          const fonctionsData = await fonctionsRes.json();
          setFonctions(fonctionsData.fonctions);
        }

        if (niveauxRes.ok) {
          const niveauxData = await niveauxRes.json();
          setNiveaux(niveauxData.niveaux);
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des référentiels:', err);
        showError('Impossible de charger les référentiels');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handlers pour les agences
  const handleAddAgence = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/agences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agenceForm)
      });

      if (response.ok) {
        showSuccess('Agence ajoutée avec succès');
        setOpenAgence(false);
        resetAgenceForm();
        // Recharger les données
        const agencesRes = await fetch(`${BACKEND_URL}/api/agences`);
        const agencesData = await agencesRes.json();
        setAgences(agencesData.agences);
      } else {
        showError('Erreur lors de l\'ajout de l\'agence');
      }
    } catch (err) {
      showError('Erreur lors de l\'ajout de l\'agence');
    }
  };

  const handleEditAgence = async () => {
    if (!editAgenceId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/agences/${editAgenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agenceForm)
      });

      if (response.ok) {
        showSuccess('Agence modifiée avec succès');
        setOpenAgence(false);
        resetAgenceForm();
        setEditAgenceId(null);
        // Recharger les données
        const agencesRes = await fetch(`${BACKEND_URL}/api/agences`);
        const agencesData = await agencesRes.json();
        setAgences(agencesData.agences);
      } else {
        showError('Erreur lors de la modification de l\'agence');
      }
    } catch (err) {
      showError('Erreur lors de la modification de l\'agence');
    }
  };

  const handleDeleteAgence = async () => {
    if (!deleteAgenceId) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/agences/${deleteAgenceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Agence supprimée avec succès');
        setDeleteAgenceId(null);
        // Recharger les données
        const agencesRes = await fetch(`${BACKEND_URL}/api/agences`);
        const agencesData = await agencesRes.json();
        setAgences(agencesData.agences);
      } else {
        showError('Erreur lors de la suppression de l\'agence');
      }
    } catch (err) {
      showError('Erreur lors de la suppression de l\'agence');
    }
  };

  // Handlers similaires pour fonctions et niveaux
  const handleAddFonction = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fonctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fonctionForm)
      });

      if (response.ok) {
        showSuccess('Fonction ajoutée avec succès');
        setOpenFonction(false);
        resetFonctionForm();
        const fonctionsRes = await fetch(`${BACKEND_URL}/api/fonctions`);
        const fonctionsData = await fonctionsRes.json();
        setFonctions(fonctionsData.fonctions);
      } else {
        showError('Erreur lors de l\'ajout de la fonction');
      }
    } catch (err) {
      showError('Erreur lors de l\'ajout de la fonction');
    }
  };

  const handleAddNiveau = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/niveaux`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(niveauForm)
      });

      if (response.ok) {
        showSuccess('Niveau ajouté avec succès');
        setOpenNiveau(false);
        resetNiveauForm();
        const niveauxRes = await fetch(`${BACKEND_URL}/api/niveaux`);
        const niveauxData = await niveauxRes.json();
        setNiveaux(niveauxData.niveaux);
      } else {
        showError('Erreur lors de l\'ajout du niveau');
      }
    } catch (err) {
      showError('Erreur lors de l\'ajout du niveau');
    }
  };

  // Fonctions utilitaires
  const resetAgenceForm = () => {
    setAgenceForm({
      nom: ''
    });
  };

  const resetFonctionForm = () => {
    setFonctionForm({
      nom: '',
      description: ''
    });
  };

  const resetNiveauForm = () => {
    setNiveauForm({
      nom: '',
      ordre: 1,
      description: ''
    });
  };

  const openEditAgence = (agence: Agence) => {
    setAgenceForm({
      nom: agence.nom
    });
    setEditAgenceId(agence.id_agence);
    setOpenAgence(true);
  };

  const openEditFonction = (fonction: Fonction) => {
    setFonctionForm({
      nom: fonction.nom,
      description: fonction.description
    });
    setEditFonctionId(fonction.id_fonction);
    setOpenFonction(true);
  };

  const openEditNiveau = (niveau: Niveau) => {
    setNiveauForm({
      nom: niveau.nom,
      ordre: niveau.ordre,
      description: niveau.description
    });
    setEditNiveauId(niveau.id_niveau);
    setOpenNiveau(true);
  };

  const handleEditFonction = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fonctions/${editFonctionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fonctionForm)
      });

      if (response.ok) {
        showSuccess('Fonction modifiée avec succès');
        setOpenFonction(false);
        resetFonctionForm();
        setEditFonctionId(null);
        // Recharger les données
        const fonctionsRes = await fetch(`${BACKEND_URL}/api/fonctions`);
        const fonctionsData = await fonctionsRes.json();
        setFonctions(fonctionsData.fonctions);
      } else {
        showError('Erreur lors de la modification de la fonction');
      }
    } catch (err) {
      showError('Erreur lors de la modification de la fonction');
    }
  };

  const handleEditNiveau = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/niveaux/${editNiveauId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(niveauForm)
      });

      if (response.ok) {
        showSuccess('Niveau modifié avec succès');
        setOpenNiveau(false);
        resetNiveauForm();
        setEditNiveauId(null);
        // Recharger les données
        const niveauxRes = await fetch(`${BACKEND_URL}/api/niveaux`);
        const niveauxData = await niveauxRes.json();
        setNiveaux(niveauxData.niveaux);
      } else {
        showError('Erreur lors de la modification du niveau');
      }
    } catch (err) {
      showError('Erreur lors de la modification du niveau');
    }
  };

  const handleDeleteFonction = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fonctions/${deleteFonctionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Fonction supprimée avec succès');
        setDeleteFonctionId(null);
        // Recharger les données
        const fonctionsRes = await fetch(`${BACKEND_URL}/api/fonctions`);
        const fonctionsData = await fonctionsRes.json();
        setFonctions(fonctionsData.fonctions);
      } else {
        showError('Erreur lors de la suppression de la fonction');
      }
    } catch (err) {
      showError('Erreur lors de la suppression de la fonction');
    }
  };

  const handleDeleteNiveau = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/niveaux/${deleteNiveauId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Niveau supprimé avec succès');
        setDeleteNiveauId(null);
        // Recharger les données
        const niveauxRes = await fetch(`${BACKEND_URL}/api/niveaux`);
        const niveauxData = await niveauxRes.json();
        setNiveaux(niveauxData.niveaux);
      } else {
        showError('Erreur lors de la suppression du niveau');
      }
    } catch (err) {
      showError('Erreur lors de la suppression du niveau');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-2">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-2">
      <h1 className="text-3xl font-bold mb-8 text-brand-dark">Gestion des Référentiels</h1>
      
      {/* Section Agences */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <Building2 className="mr-2" /> Agences (Villes)
          </h2>
          <Button
            variant="default"
            className="rounded-full px-6 py-2 font-bold"
            onClick={() => {
              resetAgenceForm();
              setEditAgenceId(null);
              setOpenAgence(true);
            }}
          >
            <Plus className="mr-2" /> Ajouter
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agences.map((agence) => (
            <div key={agence.id_agence} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg text-brand-dark">{agence.nom}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditAgence(agence)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteAgenceId(agence.id_agence)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Fonctions */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <Briefcase className="mr-2" /> Fonctions
          </h2>
          <Button
            variant="default"
            className="rounded-full px-6 py-2 font-bold"
            onClick={() => {
              resetFonctionForm();
              setEditFonctionId(null);
              setOpenFonction(true);
            }}
          >
            <Plus className="mr-2" /> Ajouter
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fonctions.map((fonction) => (
            <div key={fonction.id_fonction} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg text-brand-dark">{fonction.nom}</div>
                  <div className="text-sm text-brand-dark/80">{fonction.description}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditFonction(fonction)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteFonctionId(fonction.id_fonction)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Niveaux */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <Award className="mr-2" /> Niveaux d'Expertise
          </h2>
          <Button
            variant="default"
            className="rounded-full px-6 py-2 font-bold"
            onClick={() => {
              resetNiveauForm();
              setEditNiveauId(null);
              setOpenNiveau(true);
            }}
          >
            <Plus className="mr-2" /> Ajouter
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {niveaux.map((niveau) => (
            <div key={niveau.id_niveau} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg text-brand-dark">{niveau.nom}</div>
                  <div className="text-sm text-brand-dark/80">Ordre: {niveau.ordre}</div>
                  <div className="text-xs text-brand-dark/60">{niveau.description}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditNiveau(niveau)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteNiveauId(niveau.id_niveau)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog Agence */}
      <Dialog open={openAgence} onOpenChange={setOpenAgence}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAgenceId ? 'Modifier une ville' : 'Ajouter une ville'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nom de la ville</Label>
              <Input 
                value={agenceForm.nom} 
                onChange={e => setAgenceForm(f => ({ ...f, nom: e.target.value }))} 
                placeholder="Ex: Paris, Lyon, Marseille..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editAgenceId ? handleEditAgence : handleAddAgence}>
              {editAgenceId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Fonction */}
      <Dialog open={openFonction} onOpenChange={setOpenFonction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editFonctionId ? 'Modifier une fonction' : 'Ajouter une fonction'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nom</Label>
              <Input value={fonctionForm.nom} onChange={e => setFonctionForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={fonctionForm.description} onChange={e => setFonctionForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editFonctionId ? handleEditFonction : handleAddFonction}>
              {editFonctionId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Niveau */}
      <Dialog open={openNiveau} onOpenChange={setOpenNiveau}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editNiveauId ? 'Modifier un niveau' : 'Ajouter un niveau'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Nom</Label>
                <Input value={niveauForm.nom} onChange={e => setNiveauForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div>
                <Label>Ordre</Label>
                <Input type="number" value={niveauForm.ordre} onChange={e => setNiveauForm(f => ({ ...f, ordre: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={niveauForm.description} onChange={e => setNiveauForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editNiveauId ? handleEditNiveau : handleAddNiveau}>
              {editNiveauId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialogs pour suppression */}
      <AlertDialog open={!!deleteAgenceId} onOpenChange={open => !open && setDeleteAgenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette agence ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteAgence}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog pour suppression des fonctions */}
      <AlertDialog open={!!deleteFonctionId} onOpenChange={open => !open && setDeleteFonctionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette fonction ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteFonction}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog pour suppression des niveaux */}
      <AlertDialog open={!!deleteNiveauId} onOpenChange={open => !open && setDeleteNiveauId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce niveau ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteNiveau}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
