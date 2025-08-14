import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { Trash2, UserPlus, Users, Pencil, Download, Upload, FileSpreadsheet, Info, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

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

type ImportProgress = {
  show: boolean;
  type: 'salaries';
  step: string;
  current: number;
  total: number;
  status: 'loading' | 'success' | 'error';
  details: string[];
  stats?: {
    total: number;
    added: number;
    existing: number;
    errors: number;
  };
};

function AdminSalaries() {
  const navigate = useNavigate();
  const [salaries, setSalaries] = useState<Salarie[]>([]);
  const [agences, setAgences] = useState<string[]>([]);
  const [fonctions, setFonctions] = useState<string[]>([]);
  const [niveauxExpertise, setNiveauxExpertise] = useState<string[]>([]);
  
  // États pour les modals
  const [showAddSalarie, setShowAddSalarie] = useState(false);
  const [editingSalarie, setEditingSalarie] = useState<Salarie | null>(null);
  const [deleteSalarieId, setDeleteSalarieId] = useState<string | null>(null);
  
  // États pour l'import
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    show: false,
    type: 'salaries',
    step: '',
    current: 0,
    total: 0,
    status: 'loading',
    details: []
  });
  const [loadingImportSalaries, setLoadingImportSalaries] = useState(false);
  const [loadingExportSalaries, setLoadingExportSalaries] = useState(false);
  
  // État pour le récapitulatif détaillé d'import
  const [recapStats, setRecapStats] = useState<{
    show: boolean;
    importDetails?: any;
  }>({
    show: false,
    importDetails: null
  });
  
  // États pour les formulaires
  const [newSalarie, setNewSalarie] = useState({
    nom: "",
    prenom: "",
    agence: "",
    fonction: "",
    niveau: "",
    actif: true,
    template: "classic"
  });

  const fileInputSalariesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les salariés
      const salariesRes = await fetch(`${BACKEND_URL}/api/salaries`);
      if (salariesRes.ok) {
        const salariesData = await salariesRes.json();
        // Vérifier si les données sont dans un objet avec propriété 'salaries' ou directement un tableau
        const rawSalaries = Array.isArray(salariesData) ? salariesData : salariesData.salaries || [];
        
        // Mapper id_salarie vers id pour compatibilité frontend
        const mappedSalaries = rawSalaries.map((salarie: any) => ({
          ...salarie,
          id: salarie.id_salarie || salarie.id,
          niveau: salarie.niveau_expertise || salarie.niveau
        }));
        
        setSalaries(mappedSalaries);
      }

      // Charger les référentiels depuis l'endpoint existant
      try {
        const referentialsRes = await fetch(`${BACKEND_URL}/api/referentials`);
        if (referentialsRes.ok) {
          const referentialsData = await referentialsRes.json();
          
          // Extraire les agences, fonctions et niveaux depuis les référentiels
          if (referentialsData.agences && Array.isArray(referentialsData.agences)) {
            setAgences(referentialsData.agences.map((a: any) => a.nom || a));
          }
          
          if (referentialsData.fonctions && Array.isArray(referentialsData.fonctions)) {
            setFonctions(referentialsData.fonctions.map((f: any) => f.nom || f));
          }
          
          if (referentialsData.niveaux_expertise && Array.isArray(referentialsData.niveaux_expertise)) {
            setNiveauxExpertise(referentialsData.niveaux_expertise.map((n: any) => n.nom || n));
          }
        }
      } catch (refError) {
        console.warn('Référentiels non disponibles, utilisation de valeurs par défaut');
        // Valeurs par défaut si les référentiels ne sont pas disponibles
        setAgences(['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice']);
        setFonctions(['Ingénieur', 'Architecte', 'Chef de projet', 'Technicien', 'Consultant']);
        setNiveauxExpertise(['Junior', 'Confirmé', 'Senior', 'Expert']);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showError('Erreur lors du chargement des données');
      
      // Initialiser avec des tableaux vides pour éviter les erreurs
      setSalaries([]);
      setAgences(['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice']);
      setFonctions(['Ingénieur', 'Architecte', 'Chef de projet', 'Technicien', 'Consultant']);
      setNiveauxExpertise(['Junior', 'Confirmé', 'Senior', 'Expert']);
    }
  };

  const reloadData = () => {
    loadData();
  };

  const handleAddSalarie = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/salaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSalarie)
      });

      if (response.ok) {
        showSuccess('Salarié ajouté avec succès');
        setShowAddSalarie(false);
        setNewSalarie({
          nom: "",
          prenom: "",
          agence: "",
          fonction: "",
          niveau: "",
          actif: true,
          template: "classic"
        });
        reloadData();
      } else {
        showError('Erreur lors de l\'ajout du salarié');
      }
    } catch (error) {
      showError('Erreur lors de l\'ajout du salarié');
    }
  };

  const handleEditSalarie = async () => {
    if (!editingSalarie) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/salaries/${editingSalarie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSalarie)
      });

      if (response.ok) {
        showSuccess('Salarié modifié avec succès');
        setEditingSalarie(null);
        reloadData();
      } else {
        showError('Erreur lors de la modification du salarié');
      }
    } catch (error) {
      showError('Erreur lors de la modification du salarié');
    }
  };

  const handleDeleteSalarie = async () => {
    if (!deleteSalarieId) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/salaries/${deleteSalarieId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Salarié supprimé avec succès');
        setDeleteSalarieId(null);
        reloadData();
      } else {
        showError('Erreur lors de la suppression du salarié');
      }
    } catch (error) {
      showError('Erreur lors de la suppression du salarié');
    }
  };

  const handleImportSalariesExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingImportSalaries(true);
    setImportProgress({
      show: true,
      type: 'salaries',
      step: 'Préparation du fichier...',
      current: 0,
      total: 0,
      status: 'loading',
      details: []
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/import-salaries`, {
        method: 'POST',
        body: formData
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Erreur parsing JSON:', jsonError);
        result = { message: 'Erreur de communication avec le serveur' };
      }

      if (response.ok && result && result.stats) {
        setImportProgress(prev => ({
          ...prev,
          step: 'Import terminé avec succès !',
          status: 'success',
          stats: result.stats,
          details: [
            `✅ ${result.stats.total || 0} salariés traités`,
            `➕ ${result.stats.added || 0} nouveaux salariés ajoutés`,
            `🔄 ${result.stats.existing || 0} salariés existants ignorés`,
            `❌ ${result.stats.errors || 0} erreurs rencontrées`
          ]
        }));

        // Fermer le dialog de progression d'abord
        setImportProgress(prev => ({ ...prev, show: false }));
        
        // Afficher le récapitulatif détaillé après import réussi
        if (result.importDetails) {
          setTimeout(() => {
            setRecapStats({
              show: true,
              importDetails: result.importDetails
            });
          }, 500); // Délai pour laisser le temps au dialog de se fermer
        } else {
          // Si pas de détails, afficher au moins un récapitulatif basique
          console.log('Pas de importDetails dans la réponse:', result);
          showSuccess(`Import terminé : ${result.stats.added || 0} salariés ajoutés sur ${result.stats.total || 0} traités`);
        }

        reloadData();
      } else {
        const errMsg =
          (result && (result.message || result.error || (typeof result.details === 'string' ? result.details : ''))) ||
          'Erreur inconnue';
        setImportProgress(prev => ({
          ...prev,
          step: 'Erreur lors de l\'import',
          status: 'error',
          details: [errMsg]
        }));
        showError(errMsg);
      }
    } catch (error) {
      console.error('Erreur import salariés:', error);
      setImportProgress(prev => ({
        ...prev,
        step: 'Erreur lors de l\'import',
        status: 'error',
        details: ['Erreur de connexion au serveur']
      }));
      showError('Erreur lors de l\'import des salariés');
    } finally {
      setLoadingImportSalaries(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleExportSalariesExcel = async () => {
    setLoadingExportSalaries(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/export-salaries`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `salaries_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess(`Export Excel réussi : ${salaries.length} salariés exportés`);
      } else {
        const errorText = await response.text();
        console.error('Erreur export salariés:', errorText);
        showError('Erreur lors de l\'export des salariés');
      }
    } catch (error) {
      console.error('Erreur export salariés:', error);
      showError('Erreur lors de l\'export des salariés');
    } finally {
      setLoadingExportSalaries(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-2">
      {/* Header avec navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour Admin
          </Button>
          <h1 className="text-3xl font-bold text-brand-dark">Gestion des Salariés</h1>
        </div>
      </div>

      {/* Section Salariés */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-brand-blue" />
            <h2 className="text-2xl font-semibold text-brand-dark">
              Salariés ({salaries.length})
            </h2>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputSalariesRef}
              onChange={handleImportSalariesExcel}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    onClick={() => fileInputSalariesRef.current?.click()}
                    disabled={loadingImportSalaries}
                  >
                    {loadingImportSalaries ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-600 mr-2"></div>
                        Import...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Importer Excel
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Importer des salariés depuis un fichier Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    onClick={handleExportSalariesExcel}
                    disabled={loadingExportSalaries}
                  >
                    {loadingExportSalaries ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600 mr-2"></div>
                        Export...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter Excel
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exporter tous les salariés vers Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={() => setShowAddSalarie(true)}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter Salarié
            </Button>
          </div>
        </div>

        {/* Liste des salariés */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Prénom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Agence</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Fonction</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Niveau</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((salarie) => (
                <tr key={salarie.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{salarie.nom}</td>
                  <td className="py-3 px-4">{salarie.prenom}</td>
                  <td className="py-3 px-4">{salarie.agence || '-'}</td>
                  <td className="py-3 px-4">{salarie.fonction || '-'}</td>
                  <td className="py-3 px-4">{salarie.niveau || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      salarie.actif 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {salarie.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSalarie(salarie)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteSalarieId(salarie.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {salaries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun salarié trouvé. Commencez par en ajouter un.
          </div>
        )}
      </div>

      {/* Dialog Ajout Salarié */}
      <Dialog open={showAddSalarie} onOpenChange={setShowAddSalarie}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un salarié</DialogTitle>
            <DialogDescription>
              Remplissez les informations du nouveau salarié
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={newSalarie.nom}
                onChange={(e) => setNewSalarie({ ...newSalarie, nom: e.target.value })}
                placeholder="Nom du salarié"
              />
            </div>
            
            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={newSalarie.prenom}
                onChange={(e) => setNewSalarie({ ...newSalarie, prenom: e.target.value })}
                placeholder="Prénom du salarié"
              />
            </div>
            
            <div>
              <Label htmlFor="agence">Agence</Label>
              <select
                id="agence"
                value={newSalarie.agence}
                onChange={(e) => setNewSalarie({ ...newSalarie, agence: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner une agence</option>
                {agences.map((agence) => (
                  <option key={agence} value={agence}>{agence}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="fonction">Fonction</Label>
              <select
                id="fonction"
                value={newSalarie.fonction}
                onChange={(e) => setNewSalarie({ ...newSalarie, fonction: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner une fonction</option>
                {fonctions.map((fonction) => (
                  <option key={fonction} value={fonction}>{fonction}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="niveau">Niveau d'expertise</Label>
              <select
                id="niveau"
                value={newSalarie.niveau}
                onChange={(e) => setNewSalarie({ ...newSalarie, niveau: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner un niveau</option>
                {niveauxExpertise.map((niveau) => (
                  <option key={niveau} value={niveau}>{niveau}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="actif"
                checked={newSalarie.actif}
                onChange={(e) => setNewSalarie({ ...newSalarie, actif: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="actif">Salarié actif</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSalarie(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddSalarie}
              disabled={!newSalarie.nom.trim() || !newSalarie.prenom.trim()}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modification Salarié */}
      <Dialog open={!!editingSalarie} onOpenChange={() => setEditingSalarie(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le salarié</DialogTitle>
            <DialogDescription>
              Modifiez les informations du salarié
            </DialogDescription>
          </DialogHeader>
          
          {editingSalarie && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nom">Nom *</Label>
                <Input
                  id="edit-nom"
                  value={editingSalarie.nom}
                  onChange={(e) => setEditingSalarie({ ...editingSalarie, nom: e.target.value })}
                  placeholder="Nom du salarié"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-prenom">Prénom *</Label>
                <Input
                  id="edit-prenom"
                  value={editingSalarie.prenom}
                  onChange={(e) => setEditingSalarie({ ...editingSalarie, prenom: e.target.value })}
                  placeholder="Prénom du salarié"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-agence">Agence</Label>
                <select
                  id="edit-agence"
                  value={editingSalarie.agence}
                  onChange={(e) => setEditingSalarie({ ...editingSalarie, agence: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner une agence</option>
                  {agences.map((agence) => (
                    <option key={agence} value={agence}>{agence}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="edit-fonction">Fonction</Label>
                <select
                  id="edit-fonction"
                  value={editingSalarie.fonction}
                  onChange={(e) => setEditingSalarie({ ...editingSalarie, fonction: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner une fonction</option>
                  {fonctions.map((fonction) => (
                    <option key={fonction} value={fonction}>{fonction}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="edit-niveau">Niveau d'expertise</Label>
                <select
                  id="edit-niveau"
                  value={editingSalarie.niveau}
                  onChange={(e) => setEditingSalarie({ ...editingSalarie, niveau: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveauxExpertise.map((niveau) => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-actif"
                  checked={editingSalarie.actif}
                  onChange={(e) => setEditingSalarie({ ...editingSalarie, actif: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-actif">Salarié actif</Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSalarie(null)}>
              Annuler
            </Button>
            <Button 
              onClick={handleEditSalarie}
              disabled={!editingSalarie?.nom.trim() || !editingSalarie?.prenom.trim()}
            >
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Import Progress */}
      <Dialog open={importProgress.show} onOpenChange={(open) => !open && setImportProgress(prev => ({ ...prev, show: false }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-brand-blue" />
              Import Excel - Salariés
            </DialogTitle>
            <DialogDescription>
              Suivi en temps réel de l'import des données depuis le fichier Excel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {importProgress.status === 'loading' && <Clock className="h-5 w-5 text-blue-500 animate-spin" />}
              {importProgress.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {importProgress.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              <span className="font-medium">{importProgress.step}</span>
            </div>
            
            {importProgress.details.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="space-y-1">
                  {importProgress.details.map((detail, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setImportProgress(prev => ({ ...prev, show: false }))}
              disabled={importProgress.status === 'loading'}
            >
              {importProgress.status === 'loading' ? 'En cours...' : 'Fermer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Récapitulatif Détaillé d'Import */}
      <Dialog open={recapStats.show} onOpenChange={(open) => !open && setRecapStats({ show: false, importDetails: null })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-brand-blue" />
              Récapitulatif d'Import - Salariés
            </DialogTitle>
            <DialogDescription>
              Analyse détaillée de l'import Excel avec recommandations d'actions
            </DialogDescription>
          </DialogHeader>
          
          {recapStats.importDetails && (
            <div className="space-y-6">
              {/* Statistiques Principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {recapStats.importDetails.statistiques?.lignes_traitees || 0}
                  </div>
                  <div className="text-sm text-blue-700">Lignes traitées</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {recapStats.importDetails.statistiques?.salaries_ajoutes || 0}
                  </div>
                  <div className="text-sm text-green-700">Salariés ajoutés</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {recapStats.importDetails.statistiques?.salaries_existants || 0}
                  </div>
                  <div className="text-sm text-yellow-700">Déjà existants</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {recapStats.importDetails.statistiques?.erreurs || 0}
                  </div>
                  <div className="text-sm text-red-700">Erreurs</div>
                </div>
              </div>

              {/* État Actuel de la Base */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  État Actuel de la Base
                </h3>
                <div className="text-sm text-gray-600">
                  <div>📊 <strong>Total salariés :</strong> {recapStats.importDetails.statistiques?.total_base || 0}</div>
                  <div>📁 <strong>Fichier traité :</strong> {recapStats.importDetails.statistiques?.fichier || 'Non spécifié'}</div>
                </div>
              </div>

              {/* Erreurs Détectées */}
              {recapStats.importDetails.erreurs_detaillees && recapStats.importDetails.erreurs_detaillees.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Erreurs Détectées ({recapStats.importDetails.erreurs_detaillees.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recapStats.importDetails.erreurs_detaillees.map((erreur: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border-l-4 border-red-400">
                        <div className="font-medium text-red-700">Ligne {erreur.ligne}</div>
                        <div className="text-sm text-red-600">{erreur.erreur}</div>
                        {erreur.donnees && (
                          <div className="text-xs text-gray-500 mt-1">
                            Données: {JSON.stringify(erreur.donnees)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doublons Détectés */}
              {recapStats.importDetails.doublons_detectes && recapStats.importDetails.doublons_detectes.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Doublons Détectés ({recapStats.importDetails.doublons_detectes.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recapStats.importDetails.doublons_detectes.map((doublon: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border-l-4 border-yellow-400">
                        <div className="font-medium text-yellow-700">{doublon.nom}</div>
                        <div className="text-sm text-yellow-600">Email: {doublon.email}</div>
                        <div className="text-xs text-gray-500">Ligne {doublon.ligne} - Salarié déjà existant</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Salariés Ajoutés */}
              {recapStats.importDetails.salaries_ajoutes && recapStats.importDetails.salaries_ajoutes.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Salariés Ajoutés avec Succès ({recapStats.importDetails.salaries_ajoutes.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recapStats.importDetails.salaries_ajoutes.map((salarie: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border-l-4 border-green-400">
                        <div className="font-medium text-green-700">{salarie.nom}</div>
                        <div className="text-sm text-green-600">
                          {salarie.agence && `${salarie.agence} • `}
                          {salarie.fonction && `${salarie.fonction} • `}
                          {salarie.niveau_expertise}
                        </div>
                        <div className="text-xs text-gray-500">{salarie.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommandations */}
              {recapStats.importDetails.recommandations && recapStats.importDetails.recommandations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Recommandations
                  </h3>
                  <div className="space-y-2">
                    {recapStats.importDetails.recommandations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="text-sm text-blue-700">{rec}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setRecapStats({ show: false, importDetails: null })}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog pour suppression salarié */}
      <AlertDialog open={!!deleteSalarieId} onOpenChange={open => !open && setDeleteSalarieId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce salarié ?</AlertDialogTitle>
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
    </div>
  );
}

export default AdminSalaries;
