import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { Trash2, FilePlus2, Building2, Pencil, Download, Upload, FileSpreadsheet, CheckCircle, XCircle, Clock, ArrowLeft, BarChart3, FileText, Users, Link } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const TYPES_MISSION = ["Construction", "Rénovation", "Extension", "Audit", "Conseil"];

type Salarie = {
  id: string;
  nom: string;
  prenom: string;
  agence: string;
  fonction: string;
  niveau: string;
  actif: boolean;
  template: string;
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
  duree_mois?: number;
  surface?: number;
  salaries: string[];
};

type ImportProgress = {
  show: boolean;
  type: 'references';
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

function AdminReferences() {
  const navigate = useNavigate();
  const [references, setReferences] = useState<Reference[]>([]);
  const [salaries, setSalaries] = useState<Salarie[]>([]);
  
  // États pour les modals
  const [showAddReference, setShowAddReference] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [deleteReferenceId, setDeleteReferenceId] = useState<string | null>(null);
  
  // États pour l'import
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    show: false,
    type: 'references',
    step: '',
    current: 0,
    total: 0,
    status: 'loading',
    details: []
  });
  const [loadingImportReferences, setLoadingImportReferences] = useState(false);
  const [loadingExportReferences, setLoadingExportReferences] = useState(false);
  
  // État pour le récapitulatif au chargement
  const [recapStats, setRecapStats] = useState<{
    show?: boolean;
    totalReferences?: number;
    totalSalaries?: number;
    totalAssociations?: number;
    importDetails: {
      // Nouveau format détaillé
      statistiques?: {
        fichier: string;
        lignes_traitees: number;
        references_ajoutees: number;
        references_existantes: number;
        erreurs: number;
        total_base: number;
      };
      erreurs_detaillees?: Array<{
        ligne: number;
        erreur: string;
        donnees: any;
      }>;
      doublons_detectes?: Array<{
        ligne: number;
        nom_projet: string;
        client: string;
        annee: number;
      }>;
      references_ajoutees?: Array<{
        id: number;
        nom_projet: string;
        client: string;
        ville: string;
        annee: number;
        type_mission: string;
      }>;
      recommandations?: string[];
      // Ancien format (compatibilité)
      total?: number;
      added?: number;
      existing?: number;
      errors?: number;
      associations?: number;
      errorDetails?: string[];
      missingSalaries?: string[];
      recommendations?: string[];
    };
  }>({
    show: false,
    totalReferences: 0,
    totalSalaries: 0,
    totalAssociations: 0,
    importDetails: {
      total: 0,
      added: 0,
      existing: 0,
      errors: 0,
      associations: 0,
      errorDetails: [],
      missingSalaries: [],
      recommendations: [],
      erreurs_detaillees: [],
      doublons_detectes: [],
      references_ajoutees: [],
      recommandations: []
    }
  });
  
  // États pour les formulaires
  const [newReference, setNewReference] = useState({
    nom_projet: "",
    client: "",
    ville: "",
    annee: new Date().getFullYear(),
    type_mission: "",
    montant: 0,
    description_projet: "",
    duree_mois: 0,
    surface: 0,
    salaries: [] as string[]
  });

  const fileInputReferencesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [referencesRes, salariesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/references`),
        fetch(`${BACKEND_URL}/api/salaries`)
      ]);

      let referencesData = [];
      let salariesData = [];

      if (referencesRes.ok) {
        const rawReferencesData = await referencesRes.json();
        // Vérifier si les données sont dans un objet avec propriété 'references' ou directement un tableau
        referencesData = Array.isArray(rawReferencesData) ? rawReferencesData : rawReferencesData.references || [];
        setReferences(referencesData);
      }

      if (salariesRes.ok) {
        const rawSalariesData = await salariesRes.json();
        // Vérifier si les données sont dans un objet avec propriété 'salaries' ou directement un tableau
        salariesData = Array.isArray(rawSalariesData) ? rawSalariesData : rawSalariesData.salaries || [];
        setSalaries(salariesData);
      }

      // Calculer les statistiques pour le récapitulatif (sans l'afficher)
      const totalAssociations = referencesData.reduce((total, ref) => {
        return total + (ref.salaries ? ref.salaries.length : 0);
      }, 0);

      // Ne pas écraser l'état d'ouverture du récapitulatif ni ses détails
      setRecapStats(prev => ({
        ...prev,
        totalReferences: referencesData.length,
        totalSalaries: salariesData.length,
        totalAssociations: totalAssociations
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showError('Erreur lors du chargement des données');
      
      // Initialiser avec des tableaux vides pour éviter les erreurs
      setReferences([]);
      setSalaries([]);
    }
  };

  const reloadData = () => {
    loadData();
  };

  const handleAddReference = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReference)
      });

      if (response.ok) {
        showSuccess('Référence ajoutée avec succès');
        setShowAddReference(false);
        setNewReference({
          nom_projet: "",
          client: "",
          ville: "",
          annee: new Date().getFullYear(),
          type_mission: "",
          montant: 0,
          description_projet: "",
          duree_mois: 0,
          surface: 0,
          salaries: []
        });
        reloadData();
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Erreur lors de l\'ajout de la référence');
      }
    } catch (error) {
      showError('Erreur lors de l\'ajout de la référence');
    }
  };

  const handleEditReference = async () => {
    if (!editingReference) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/references/${editingReference.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReference)
      });

      if (response.ok) {
        showSuccess('Référence modifiée avec succès');
        setEditingReference(null);
        reloadData();
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Erreur lors de la modification de la référence');
      }
    } catch (error) {
      showError('Erreur lors de la modification de la référence');
    }
  };

  const handleDeleteReference = async () => {
    if (!deleteReferenceId) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/references/${deleteReferenceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Référence supprimée avec succès');
        setDeleteReferenceId(null);
        reloadData();
      } else {
        showError('Erreur lors de la suppression de la référence');
      }
    } catch (error) {
      showError('Erreur lors de la suppression de la référence');
    }
  };

  const handleImportReferencesExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingImportReferences(true);
    setImportProgress({
      show: true,
      type: 'references',
      step: 'Préparation du fichier...',
      current: 0,
      total: 0,
      status: 'loading',
      details: []
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/import-references`, {
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

      // Gérer les deux formats de réponse (avec ou sans stats)
      const stats = result.stats || {
        total: result.total || 0,
        added: result.added || 0,
        existing: result.existing || 0,
        errors: result.errors || 0
      };



      if (response.ok && result && (result.stats || result.total !== undefined)) {
        setImportProgress(prev => ({
          ...prev,
          step: 'Import terminé avec succès !',
          status: 'success',
          stats: stats,
          details: [
            `✅ ${stats.total || 0} références traitées`,
            `➕ ${stats.added || 0} nouvelles références ajoutées`,
            `🔄 ${stats.existing || 0} références existantes ignorées`,
            `❌ ${stats.errors || 0} erreurs rencontrées`
          ]
        }));

        showSuccess(`Import terminé : ${stats.added || 0} références ajoutées sur ${stats.total || 0} traitées`);
        
        // Fermer le dialog de progression
        setImportProgress(prev => ({ ...prev, show: false }));
        
        // Afficher le récapitulatif détaillé
        const recommendations = [];
        
        if (stats.errors > 0) {
          recommendations.push("Vérifiez que toutes les lignes ont un nom de projet et un client renseignés");
        }
        
        if (stats.added > 0) {
          recommendations.push(`✅ ${stats.added} nouvelles références ajoutées avec succès`);
        }
        
        if (stats.existing > 0) {
          recommendations.push(`ℹ️ ${stats.existing} références existantes ont été ignorées`);
        }

        // Utiliser les importDetails du serveur ou créer une structure basique
        const importDetailsToShow = result.importDetails || {
          statistiques: {
            fichier: file.name,
            lignes_traitees: stats.total || 0,
            references_ajoutees: stats.added || 0,
            references_existantes: stats.existing || 0,
            erreurs: stats.errors || 0,
            total_base: (stats.total || 0) + (stats.existing || 0)
          },
          erreurs_detaillees: [],
          doublons_detectes: [],
          references_ajoutees: [],
          recommandations: recommendations
        };

        // Toujours afficher le récapitulatif
        console.log('🔍 Setting recapStats with:', importDetailsToShow);
        setRecapStats({
          show: true,
          importDetails: importDetailsToShow
        });

        // Recharger les données après l'affichage du récapitulatif
        setTimeout(() => {
          reloadData();
        }, 100);
      } else {
        setImportProgress(prev => ({
          ...prev,
          step: 'Erreur lors de l\'import',
          status: 'error',
          details: [result?.message || 'Erreur inconnue']
        }));
        showError(result?.message || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Erreur import références:', error);
      setImportProgress(prev => ({
        ...prev,
        step: 'Erreur lors de l\'import',
        status: 'error',
        details: ['Erreur de connexion au serveur']
      }));
      showError('Erreur lors de l\'import des références');
    } finally {
      setLoadingImportReferences(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleExportReferencesExcel = async () => {
    setLoadingExportReferences(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/export-references`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `references_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess(`Export Excel réussi : ${references.length} références exportées`);
      } else {
        const errorText = await response.text();
        console.error('Erreur export références:', errorText);
        showError('Erreur lors de l\'export des références');
      }
    } catch (error) {
      console.error('Erreur export références:', error);
      showError('Erreur lors de l\'export des références');
    } finally {
      setLoadingExportReferences(false);
    }
  };

  const handleExportImportErrorsCsv = () => {
    const details = recapStats.importDetails || {} as any;
    const detailed = details.erreurs_detaillees || [];
    const simple = details.errorDetails || [];
    const esc = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    let csv = '';
    if (detailed.length > 0) {
      const header = ['ligne','erreur','nom_projet','client','annee','ville','type_mission'];
      const rows = detailed.map((e: any) => {
        const d = e.donnees || {};
        const nom_projet = d.nom_projet || d.nom || '';
        const client = d.client || '';
        const annee = d.annee || d.année || '';
        const ville = d.ville || '';
        const type_mission = d.type_mission || '';
        return [e.ligne, e.erreur, nom_projet, client, annee, ville, type_mission].map(esc).join(',');
      });
      csv = header.join(',') + '\n' + rows.join('\n');
    } else if (simple.length > 0) {
      const header = ['message'];
      const rows = simple.map((m: any) => esc(m));
      csv = header.join(',') + '\n' + rows.join('\n');
    } else {
      showError('Aucune erreur à exporter');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_references_erreurs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showSuccess('Export des erreurs réalisé');
  };

  const getSalarieNames = (salarieIds: string[]) => {
    return salarieIds
      .map(id => {
        const salarie = salaries.find(s => s.id === id);
        return salarie ? `${salarie.prenom} ${salarie.nom}` : null;
      })
      .filter(Boolean)
      .join(', ');
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
          <h1 className="text-3xl font-bold text-brand-dark">Gestion des Références</h1>
        </div>
      </div>

      {/* Section Références */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-brand-blue" />
            <h2 className="text-2xl font-semibold text-brand-dark">
              Références Projets ({references.length})
            </h2>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputReferencesRef}
              onChange={handleImportReferencesExcel}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    onClick={() => fileInputReferencesRef.current?.click()}
                    disabled={loadingImportReferences}
                  >
                    {loadingImportReferences ? (
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
                  <p>Importer des références depuis un fichier Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    onClick={handleExportReferencesExcel}
                    disabled={loadingExportReferences}
                  >
                    {loadingExportReferences ? (
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
                  <p>Exporter toutes les références vers Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={() => setShowAddReference(true)}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white"
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Ajouter Référence
            </Button>
          </div>
        </div>

        {/* Liste des références */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Projet</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ville</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Année</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Salariés</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {references.map((reference) => (
                <tr key={reference.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{reference.nom_projet || '-'}</td>
                  <td className="py-3 px-4">{reference.client || '-'}</td>
                  <td className="py-3 px-4">{reference.ville || '-'}</td>
                  <td className="py-3 px-4">{reference.annee || '-'}</td>
                  <td className="py-3 px-4">{reference.type_mission || '-'}</td>
                  <td className="py-3 px-4">
                    {reference.montant ? `${reference.montant.toLocaleString()} €` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-32 truncate" title={getSalarieNames(reference.salaries || [])}>
                      {reference.salaries && reference.salaries.length > 0 
                        ? getSalarieNames(reference.salaries)
                        : '-'
                      }
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingReference(reference)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteReferenceId(reference.id)}
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

        {references.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucune référence trouvée. Commencez par en ajouter une.
          </div>
        )}
      </div>

      {/* Dialog Ajout Référence */}
      <Dialog open={showAddReference} onOpenChange={setShowAddReference}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une référence</DialogTitle>
            <DialogDescription>
              Remplissez les informations de la nouvelle référence projet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom_projet">Nom du projet *</Label>
                <Input
                  id="nom_projet"
                  value={newReference.nom_projet}
                  onChange={(e) => setNewReference({ ...newReference, nom_projet: e.target.value })}
                  placeholder="Nom du projet"
                />
              </div>
              
              <div>
                <Label htmlFor="client">Client *</Label>
                <Input
                  id="client"
                  value={newReference.client}
                  onChange={(e) => setNewReference({ ...newReference, client: e.target.value })}
                  placeholder="Nom du client"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={newReference.ville}
                  onChange={(e) => setNewReference({ ...newReference, ville: e.target.value })}
                  placeholder="Ville du projet"
                />
              </div>
              
              <div>
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  value={newReference.annee}
                  onChange={(e) => setNewReference({ ...newReference, annee: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="Année"
                />
              </div>
              
              <div>
                <Label htmlFor="type_mission">Type de mission</Label>
                <select
                  id="type_mission"
                  value={newReference.type_mission}
                  onChange={(e) => setNewReference({ ...newReference, type_mission: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner un type</option>
                  {TYPES_MISSION.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="montant">Montant (€)</Label>
                <Input
                  id="montant"
                  type="number"
                  value={newReference.montant}
                  onChange={(e) => setNewReference({ ...newReference, montant: parseFloat(e.target.value) || 0 })}
                  placeholder="Montant du projet"
                />
              </div>
              
              <div>
                <Label htmlFor="duree_mois">Durée (mois)</Label>
                <Input
                  id="duree_mois"
                  type="number"
                  value={newReference.duree_mois}
                  onChange={(e) => setNewReference({ ...newReference, duree_mois: parseInt(e.target.value) || 0 })}
                  placeholder="Durée en mois"
                />
              </div>
              
              <div>
                <Label htmlFor="surface">Surface (m²)</Label>
                <Input
                  id="surface"
                  type="number"
                  value={newReference.surface}
                  onChange={(e) => setNewReference({ ...newReference, surface: parseFloat(e.target.value) || 0 })}
                  placeholder="Surface en m²"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description_projet">Description</Label>
              <textarea
                id="description_projet"
                value={newReference.description_projet}
                onChange={(e) => setNewReference({ ...newReference, description_projet: e.target.value })}
                placeholder="Description du projet"
                className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
              />
            </div>
            
            <div>
              <Label>Salariés associés</Label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {salaries.map((salarie) => (
                  <div key={salarie.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`salarie-${salarie.id}`}
                      checked={newReference.salaries.includes(salarie.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewReference({
                            ...newReference,
                            salaries: [...newReference.salaries, salarie.id]
                          });
                        } else {
                          setNewReference({
                            ...newReference,
                            salaries: newReference.salaries.filter(id => id !== salarie.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`salarie-${salarie.id}`} className="text-sm">
                      {salarie.prenom} {salarie.nom} ({salarie.fonction || 'Sans fonction'})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddReference(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddReference}
              disabled={!newReference.nom_projet.trim() || !newReference.client.trim()}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modification Référence */}
      <Dialog open={!!editingReference} onOpenChange={() => setEditingReference(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la référence</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la référence projet
            </DialogDescription>
          </DialogHeader>
          
          {editingReference && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nom_projet">Nom du projet *</Label>
                  <Input
                    id="edit-nom_projet"
                    value={editingReference.nom_projet}
                    onChange={(e) => setEditingReference({ ...editingReference, nom_projet: e.target.value })}
                    placeholder="Nom du projet"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-client">Client *</Label>
                  <Input
                    id="edit-client"
                    value={editingReference.client}
                    onChange={(e) => setEditingReference({ ...editingReference, client: e.target.value })}
                    placeholder="Nom du client"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-ville">Ville</Label>
                  <Input
                    id="edit-ville"
                    value={editingReference.ville}
                    onChange={(e) => setEditingReference({ ...editingReference, ville: e.target.value })}
                    placeholder="Ville du projet"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-annee">Année</Label>
                  <Input
                    id="edit-annee"
                    type="number"
                    value={editingReference.annee}
                    onChange={(e) => setEditingReference({ ...editingReference, annee: parseInt(e.target.value) || new Date().getFullYear() })}
                    placeholder="Année"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-type_mission">Type de mission</Label>
                  <select
                    id="edit-type_mission"
                    value={editingReference.type_mission}
                    onChange={(e) => setEditingReference({ ...editingReference, type_mission: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Sélectionner un type</option>
                    {TYPES_MISSION.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-montant">Montant (€)</Label>
                  <Input
                    id="edit-montant"
                    type="number"
                    value={editingReference.montant}
                    onChange={(e) => setEditingReference({ ...editingReference, montant: parseFloat(e.target.value) || 0 })}
                    placeholder="Montant du projet"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-duree_mois">Durée (mois)</Label>
                  <Input
                    id="edit-duree_mois"
                    type="number"
                    value={editingReference.duree_mois || 0}
                    onChange={(e) => setEditingReference({ ...editingReference, duree_mois: parseInt(e.target.value) || 0 })}
                    placeholder="Durée en mois"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-surface">Surface (m²)</Label>
                  <Input
                    id="edit-surface"
                    type="number"
                    value={editingReference.surface || 0}
                    onChange={(e) => setEditingReference({ ...editingReference, surface: parseFloat(e.target.value) || 0 })}
                    placeholder="Surface en m²"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description_projet">Description</Label>
                <textarea
                  id="edit-description_projet"
                  value={editingReference.description_projet}
                  onChange={(e) => setEditingReference({ ...editingReference, description_projet: e.target.value })}
                  placeholder="Description du projet"
                  className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
                />
              </div>
              
              <div>
                <Label>Salariés associés</Label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {salaries.map((salarie) => (
                    <div key={salarie.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`edit-salarie-${salarie.id}`}
                        checked={editingReference.salaries?.includes(salarie.id) || false}
                        onChange={(e) => {
                          const currentSalaries = editingReference.salaries || [];
                          if (e.target.checked) {
                            setEditingReference({
                              ...editingReference,
                              salaries: [...currentSalaries, salarie.id]
                            });
                          } else {
                            setEditingReference({
                              ...editingReference,
                              salaries: currentSalaries.filter(id => id !== salarie.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`edit-salarie-${salarie.id}`} className="text-sm">
                        {salarie.prenom} {salarie.nom} ({salarie.fonction || 'Sans fonction'})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReference(null)}>
              Annuler
            </Button>
            <Button 
              onClick={handleEditReference}
              disabled={!editingReference?.nom_projet.trim() || !editingReference?.client.trim()}
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
              Import Excel - Références
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

      {/* AlertDialog pour suppression référence */}
      <AlertDialog open={!!deleteReferenceId} onOpenChange={open => !open && setDeleteReferenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette référence ?</AlertDialogTitle>
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

      {/* Dialog de récapitulatif détaillé après import */}
      <Dialog open={recapStats.show || false} onOpenChange={(open) => setRecapStats(prev => ({ ...prev, show: open }))}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Récapitulatif d'Import - Références
            </DialogTitle>
            <DialogDescription>
              Analyse détaillée de l'import Excel avec recommandations d'actions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Statistiques d'import */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-600">{recapStats.importDetails.statistiques?.lignes_traitees || 0}</div>
                <div className="text-xs text-blue-700">Lignes traitées</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-600">{recapStats.importDetails.statistiques?.references_ajoutees || 0}</div>
                <div className="text-xs text-green-700">Références ajoutées</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-center">
                <div className="text-2xl font-bold text-orange-600">{recapStats.importDetails.statistiques?.references_existantes || 0}</div>
                <div className="text-xs text-orange-700">Déjà existants</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                <div className="text-2xl font-bold text-red-600">{recapStats.importDetails.statistiques?.erreurs || 0}</div>
                <div className="text-xs text-red-700">Erreurs</div>
              </div>
            </div>

            {/* État Actuel de la Base */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                État Actuel de la Base
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📊</span>
                  <span className="font-medium">Total références :</span>
                  <span className="font-bold">{recapStats.importDetails.statistiques?.total_base || references.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">📁</span>
                  <span className="font-medium">Fichier traité :</span>
                  <span className="font-bold">{recapStats.importDetails.statistiques?.fichier || 'Import Excel'}</span>
                </div>
              </div>
            </div>

            {/* Détails des erreurs */}
            {(recapStats.importDetails.errorDetails?.length > 0 || recapStats.importDetails.erreurs_detaillees?.length > 0) && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Erreurs détectées
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-red-700">
                    {(recapStats.importDetails.erreurs_detaillees?.length || recapStats.importDetails.errorDetails?.length || 0)} erreur(s) détectée(s)
                  </div>
                  <Button size="sm" variant="outline" onClick={handleExportImportErrorsCsv} className="h-8 gap-2">
                    <Download className="h-4 w-4" />
                    Exporter CSV
                  </Button>
                </div>
                {((recapStats.importDetails.erreurs_detaillees?.length || 0) > 0) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-red-800">
                          <th className="py-1 px-2">Ligne</th>
                          <th className="py-1 px-2">Erreur</th>
                          <th className="py-1 px-2">Nom projet</th>
                          <th className="py-1 px-2">Client</th>
                          <th className="py-1 px-2">Année</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(recapStats.importDetails.erreurs_detaillees || []).map((err: any, idx: number) => {
                          const d = err.donnees || {};
                          return (
                            <tr key={idx} className="border-t border-red-100">
                              <td className="py-1 px-2">{err.ligne}</td>
                              <td className="py-1 px-2 text-red-700">{err.erreur}</td>
                              <td className="py-1 px-2">{d.nom_projet || d.nom || '-'}</td>
                              <td className="py-1 px-2">{d.client || '-'}</td>
                              <td className="py-1 px-2">{d.annee || d.année || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <ul className="space-y-1 text-sm text-red-700">
                    {(recapStats.importDetails.errorDetails || []).map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Alerte si erreurs mais aucun détail fourni */}
            {(recapStats.importDetails.statistiques?.erreurs > 0
              && (recapStats.importDetails.errorDetails?.length || 0) === 0
              && (recapStats.importDetails.erreurs_detaillees?.length || 0) === 0) && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Erreurs détectées sans détail</h4>
                <div className="text-sm text-yellow-700">
                  Le serveur n'a pas renvoyé de détails d'erreurs. Relancez l'import après avoir mis à jour/redémarré le backend ou consultez les logs du serveur.
                </div>
              </div>
            )}

            {/* Doublons détectés */}
            {(recapStats.importDetails.doublons_detectes?.length || 0) > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Doublons détectés
                </h4>
                <div className="text-sm text-orange-700 mb-2">{recapStats.importDetails.doublons_detectes?.length} doublon(s)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-orange-800">
                        <th className="py-1 px-2">Ligne</th>
                        <th className="py-1 px-2">Nom projet</th>
                        <th className="py-1 px-2">Client</th>
                        <th className="py-1 px-2">Année</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(recapStats.importDetails.doublons_detectes || []).map((d: any, idx: number) => (
                        <tr key={idx} className="border-t border-orange-100">
                          <td className="py-1 px-2">{d.ligne}</td>
                          <td className="py-1 px-2">{d.nom_projet}</td>
                          <td className="py-1 px-2">{d.client}</td>
                          <td className="py-1 px-2">{d.annee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Références ajoutées */}
            {(recapStats.importDetails.references_ajoutees?.length || 0) > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Références ajoutées ({recapStats.importDetails.references_ajoutees?.length})
                </h4>
                <ul className="text-sm text-green-700 space-y-1 max-h-40 overflow-y-auto">
                  {(recapStats.importDetails.references_ajoutees || []).map((r: any, idx: number) => (
                    <li key={idx}>
                      {r.nom_projet} — {r.client} ({r.annee})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Salariés manquants */}
            {(recapStats.importDetails.missingSalaries?.length > 0) && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Salariés à ajouter
                </h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  {recapStats.importDetails.missingSalaries.map((salary, index) => (
                    <div key={index}>{salary}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations d'action */}
            {(recapStats.importDetails.recommendations?.length > 0 || recapStats.importDetails.recommandations?.length > 0) && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Actions recommandées
                </h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  {(recapStats.importDetails.recommendations || recapStats.importDetails.recommandations || []).map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setRecapStats(prev => ({ ...prev, show: false }));
                navigate('/admin/salaries');
              }}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Gérer Salariés
            </Button>
            <Button onClick={() => setRecapStats(prev => ({ ...prev, show: false }))}>
              Terminé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminReferences;
