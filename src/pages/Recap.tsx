import { useWorkflow } from "@/components/WorkflowContext";
import { EMPLOYEES } from "@/components/TeamSelectionStep";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Pencil, Eye } from "lucide-react";
import { DownloadNotification } from "@/components/DownloadNotification";

const MOCK_REFERENCES = [
  {
    id: "1",
    nom_projet: "Tour Majunga",
    ville: "Paris",
    annee: 2021,
    type_mission: "Construction",
    montant: 12000000,
    client: "Société Générale",
    description_projet: "Construction d'une tour de bureaux de 45 étages.",
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
  },
  {
    id: "4",
    nom_projet: "EcoQuartier Nord",
    ville: "Lille",
    annee: 2020,
    type_mission: "Construction",
    montant: 9500000,
    client: "Ville de Lille",
    description_projet: "Création d'un écoquartier de 200 logements.",
  },
];

// Liste des templates de CV disponibles
const CV_TEMPLATES = [
  { id: "classic", label: "Classique" },
  { id: "modern", label: "Moderne" },
  { id: "minimal", label: "Minimal" },
];

export const RecapStep = () => {
  const {
    selectedTeam,
    setSelectedTeam,
    selectedReferences,
    setSelectedReferences,
    referenceAssociation,
    setReferenceAssociation,
    templateAssociation,
    setTemplateAssociation,
  } = useWorkflow();
  const navigate = useNavigate();

  // Validation du workflow - redirection si données manquantes
  useEffect(() => {
    console.log('🔍 Validation du workflow...');
    console.log('👥 Équipe sélectionnée:', selectedTeam.length, 'membres');
    console.log('📋 Références sélectionnées:', selectedReferences.length, 'références');
    
    if (selectedTeam.length === 0) {
      console.warn('⚠️ Aucune équipe sélectionnée, redirection vers /team');
      navigate('/team');
      return;
    }
    
    if (selectedReferences.length === 0) {
      console.warn('⚠️ Aucune référence sélectionnée, redirection vers /references');
      navigate('/references');
      return;
    }
    
    console.log('✅ Workflow valide, affichage de la page Recap');
  }, [selectedTeam, selectedReferences, navigate]);

  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadNotification, setDownloadNotification] = useState<{
    isVisible: boolean;
    filename: string;
    referenceCount: number;
    lastDownloadData?: { memberId: string; blob: Blob };
  }>({ isVisible: false, filename: "", referenceCount: 0 });

  useEffect(() => {
    if (selectedTeam.length === 0 || selectedReferences.length === 0) {
      navigate("/");
    }
  }, [selectedTeam, selectedReferences, navigate]);

  const team = EMPLOYEES.filter((e) => selectedTeam.includes(e.id));
  const references = MOCK_REFERENCES.filter((r) => selectedReferences.includes(r.id));

  const handleFinish = async () => {
    console.log('\n=== 🚀 GÉNÉRATION DE TOUS LES CV ===');
    console.log('👥 Équipe:', selectedTeam.length, 'membres');
    console.log('📋 Références:', selectedReferences.length);
    
    if (selectedTeam.length === 0) {
      showError('❌ Aucune équipe sélectionnée');
      return;
    }
    
    // Afficher un toast de chargement global
    const loadingToast = showLoading('🚀 Génération de tous les CV en cours...');
    
    try {
      let successCount = 0;
      let totalCount = selectedTeam.length;
      
      // Générer un CV pour chaque membre de l'équipe
      for (const memberId of selectedTeam) {
        console.log(`\n--- Génération CV pour membre ${memberId} ---`);
        
        try {
          // Récupérer le fichier template
          const cvFile = await getCvFileForMember();
          if (!cvFile) {
            console.error('❌ Impossible de récupérer le template pour', memberId);
            continue;
          }
          
          // Préparer les données
          const formData = new FormData();
          formData.append("pptx", cvFile);
          
          const memberReferences = referenceAssociation[memberId]?.map(refId =>
            references.find(r => r.id === refId)
          ).filter(Boolean) || [];
          
          formData.append("references", JSON.stringify(memberReferences));
          
          // Envoyer la requête
          const apiUrl = process.env.NODE_ENV === 'production' 
            ? '/api/enrich-cv'
            : 'http://localhost:4001/api/enrich-cv';
            
          const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ CV généré pour', memberId, ':', result.filename);
            successCount++;
          } else {
            console.error('❌ Échec génération pour', memberId);
          }
          
        } catch (error) {
          console.error('❌ Erreur pour membre', memberId, ':', error);
        }
      }
      
      // Fermer le toast de chargement
      dismissToast(String(loadingToast));
      
      if (successCount > 0) {
        showSuccess(`✅ ${successCount}/${totalCount} CV générés avec succès ! Redirection vers les téléchargements...`);
        
        // Rediriger vers la page de téléchargements
        setTimeout(() => {
          navigate("/downloads");
        }, 2000);
      } else {
        showError('❌ Aucun CV n\'a pu être généré');
      }
      
    } catch (error) {
      dismissToast(String(loadingToast));
      console.error('❌ Erreur générale:', error);
      showError('❌ Erreur lors de la génération des CV');
    }
    
    console.log('=== 🏁 FIN GÉNÉRATION TOUS CV ===\n');
  };

  const handleEditAssociation = () => {
    navigate("/association");
  };

  const getTemplateLabel = (templateId: string) => {
    const tpl = CV_TEMPLATES.find(t => t.id === templateId);
    return tpl ? tpl.label : "Classique";
  };



  // Récupère le template CV depuis le serveur
  const getCvFileForMember = async (): Promise<File | Blob | null> => {
    console.log('📁 Récupération du template CV...');
    
    try {
      // Essayer de récupérer le template depuis le serveur
      const response = await fetch("http://localhost:4001/template.pptx");
      
      if (!response.ok) {
        console.warn('⚠️ Template non trouvé, création d\'un fichier factice');
        
        // Créer un fichier PPTX minimal factice pour les tests
        const pptxContent = new Uint8Array([
          0x50, 0x4B, 0x03, 0x04, // ZIP header
          // ... contenu minimal d'un fichier PPTX
        ]);
        
        const blob = new Blob([pptxContent], { 
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" 
        });
        
        return new File([blob], "template.pptx", { type: blob.type });
      }
      
      const blob = await response.blob();
      console.log('✅ Template récupéré, taille:', blob.size, 'bytes');
      return new File([blob], "template.pptx", { type: blob.type });
      
    } catch (e) {
      console.error('❌ Erreur réseau:', e);
      
      // Fallback: créer un fichier factice
      const blob = new Blob(['PPTX factice'], { 
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" 
      });
      
      return new File([blob], "template.pptx", { type: blob.type });
    }
  };

  // Envoie le fichier pptx + les références au backend et télécharge le fichier enrichi
  const handleDownloadEnrichedCv = async (memberId: string) => {
    console.log('\n=== 🚀 DÉBUT GÉNÉRATION CV ===');
    console.log('👤 Membre ID:', memberId);
    console.log('👥 Équipe sélectionnée:', selectedTeam);
    console.log('📋 Références sélectionnées:', selectedReferences);
    console.log('🔗 Association références:', referenceAssociation);
    
    console.log('✅ Génération autorisée (validations désactivées pour debug)');
    setDownloading(memberId);
    
    // Afficher un message de chargement
    const loadingToast = showLoading("🔄 Génération du CV enrichi en cours...");
    console.log('🔄 Toast de chargement affiché:', loadingToast);
    
    try {
      console.log('📁 Récupération du fichier CV...');
      const cvFile = await getCvFileForMember();
      if (!cvFile) {
        console.error('❌ Aucun fichier CV trouvé');
        dismissToast(String(loadingToast));
        setDownloading(null);
        return;
      }
      console.log('✅ Fichier CV récupéré:', {
        name: cvFile instanceof File ? cvFile.name : 'blob',
        size: cvFile.size,
        type: cvFile.type
      });  
        
      console.log('📦 Préparation des données...');
      const formData = new FormData();
      formData.append("pptx", cvFile);
      
      const memberReferences = referenceAssociation[memberId]?.map(refId =>
        references.find(r => r.id === refId)
      ).filter(Boolean) || [];
      
      console.log('📋 Références pour ce membre:', memberReferences);
      console.log('📋 Nombre de références:', memberReferences.length);
      
      const referencesJson = JSON.stringify(memberReferences);
      console.log('📋 JSON des références:', referencesJson);
      formData.append("references", referencesJson);
      
      console.log('📦 FormData préparée:', {
        pptx: cvFile instanceof File ? cvFile.name : 'blob',
        references: memberReferences.length + ' références'
      });
        
      // URL de l'API configurable
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/enrich-cv'  // En production, utiliser l'URL relative
        : 'http://localhost:4001/api/enrich-cv'; // En dev, utiliser localhost
      
      console.log('🌐 Envoi de la requête...');
      console.log('🚀 URL:', apiUrl);
      console.log('🌍 Environnement:', process.env.NODE_ENV);
      console.log('📤 Méthode: POST');
      
      const startTime = Date.now();
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });
      const endTime = Date.now();
      
      console.log('📥 Réponse reçue en', endTime - startTime, 'ms');
      console.log('📊 Status:', response.status, response.statusText);
      console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
        
      // Fermer le toast de chargement
      dismissToast(String(loadingToast));
      console.log('✅ Requête réussie, traitement de la réponse...');
      
      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Détail erreur:', errorText);
        showError("❌ Erreur lors de la génération du CV enrichi.");
        setDownloading(null);
        return;
      }
      
      console.log('✅ Réponse OK, parsing JSON...');
      const result = await response.json();
      console.log('✅ CV généré avec succès!');
      console.log('📄 Réponse complète:', result);
      console.log('📁 Fichier généré:', result.filename);
      console.log('🔗 URL de téléchargement:', result.downloadUrl);
      console.log('📊 Nombre de références traitées:', result.referencesCount);

      // Notification de succès
      console.log('🎉 Affichage notification de succès...');
      showSuccess(
        `✅ CV enrichi généré avec succès ! Redirection vers les téléchargements...`
      );
      
      // Rediriger vers la page de téléchargements après un court délai
      console.log('🔄 Redirection programmée vers /downloads dans 1.5s...');
      setTimeout(() => {
        console.log('🔄 Redirection vers /downloads maintenant...');
        navigate("/downloads");
      }, 1500); // Laisser le temps à l'utilisateur de voir le message
        
    } catch (e) {
      console.error('💥 ERREUR CRITIQUE:', e);
      console.error('💥 Stack trace:', (e as Error).stack);
      dismissToast(String(loadingToast));
      showError("❌ Impossible de générer le CV enrichi. Vérifiez votre connexion.");
    } finally {
      console.log('🏁 Fin de la génération CV');
      setDownloading(null);
    }
    console.log('=== 🏁 FIN GÉNÉRATION CV ===\n')  
  };

  // Fonction pour re-télécharger le dernier fichier
  const handleDownloadAgain = () => {
    if (downloadNotification.lastDownloadData) {
      const { blob } = downloadNotification.lastDownloadData;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadNotification.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess("✅ Fichier re-téléchargé !");
    }
  };

  // Vérifier l'état du workflow
  const isWorkflowComplete = selectedTeam.length > 0 && selectedReferences.length > 0;
  const hasAssociations = selectedTeam.every(memberId => 
    referenceAssociation[memberId] && referenceAssociation[memberId].length > 0
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-brand-dark tracking-tight drop-shadow-sm">
        Récapitulatif de la sélection
      </h2>
      
      {/* Alerte d'état du workflow */}
      {!isWorkflowComplete && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Workflow incomplet</span>
          </div>
          <div className="mt-2 text-sm text-red-700">
            {selectedTeam.length === 0 && (
              <div>• Veuillez d'abord sélectionner une équipe</div>
            )}
            {selectedReferences.length === 0 && (
              <div>• Veuillez d'abord sélectionner des références</div>
            )}
          </div>
        </div>
      )}
      
      {isWorkflowComplete && !hasAssociations && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Associations manquantes</span>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            Certains membres n'ont pas de références associées. Utilisez le bouton "Modifier associations" pour compléter.
          </div>
        </div>
      )}
      
      {isWorkflowComplete && hasAssociations && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Workflow complet</span>
          </div>
          <div className="mt-2 text-sm text-green-700">
            Vous pouvez maintenant générer les CV enrichis pour tous les membres.
          </div>
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-brand-blue flex items-center gap-2">
          Équipe sélectionnée & Références associées
          <Button
            variant="outline"
            size="sm"
            className="ml-2 px-3 py-1 rounded-full border-brand-blue text-brand-blue font-semibold flex items-center gap-1"
            onClick={handleEditAssociation}
          >
            <Pencil size={16} className="mr-1" />
            Modifier associations
          </Button>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.id} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark flex flex-col gap-2">
              <div className="font-semibold text-lg text-brand-dark mb-1">{member.name}</div>
              <div className="text-sm text-brand-dark/80">{member.function} • {member.level}</div>
              <div className="text-xs text-brand-dark/60 mb-2">{member.agency}</div>
              <div className="text-xs text-brand-dark/60 font-semibold mb-1">Template de CV : <span className="font-bold text-brand-blue">{getTemplateLabel(templateAssociation[member.id])}</span></div>
              <div className="text-xs text-brand-dark/60 font-semibold mb-1">Références associées :</div>
              <ul className="list-disc ml-4">
                {(referenceAssociation[member.id] || []).map((refId) => {
                  const ref = references.find((r) => r.id === refId);
                  return ref ? (
                    <li key={ref.id} className="text-xs text-brand-dark/80">
                      {ref.nom_projet} ({ref.annee}, {ref.ville})
                    </li>
                  ) : null;
                })}
                {(referenceAssociation[member.id] || []).length === 0 && (
                  <li className="text-xs text-gray-400">Aucune</li>
                )}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className={`mt-2 flex items-center gap-2 font-semibold ${
                  selectedTeam.length === 0 || selectedReferences.length === 0 || 
                  !referenceAssociation[member.id] || referenceAssociation[member.id].length === 0
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'border-brand-blue text-brand-blue'
                }`}
                onClick={() => handleDownloadEnrichedCv(member.id)}
                disabled={downloading === member.id}
                title={
                  selectedTeam.length === 0 ? "Veuillez d'abord sélectionner une équipe" :
                  selectedReferences.length === 0 ? "Veuillez d'abord sélectionner des références" :
                  !referenceAssociation[member.id] || referenceAssociation[member.id].length === 0 ? "Veuillez d'abord associer des références à ce membre" :
                  "Télécharger un aperçu du CV enrichi"
                }
              >
                <Eye size={16} className="mr-1" />
                {downloading === member.id ? "Génération..." : "Aperçu du CV enrichi"}
              </Button>
            </div>
          ))}
          {team.length === 0 && (
            <div className="col-span-full text-center text-brand-dark/60 py-8 text-lg font-medium">
              Aucune personne sélectionnée.
            </div>
          )}
        </div>
      </div>
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-brand-blue">Références sélectionnées (toutes)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {references.map((ref) => (
            <div key={ref.id} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="font-bold text-lg text-brand-dark mb-1">{ref.nom_projet}</div>
              <div className="text-sm text-brand-dark/80">{ref.ville} • {ref.type_mission} • {ref.annee}</div>
              <div className="text-xs text-brand-dark/60 mb-1">Client : {ref.client}</div>
              <div className="text-xs text-brand-dark/60 mb-1">Montant : {ref.montant.toLocaleString()} €</div>
              <div className="text-xs text-brand-dark/60">{ref.description_projet}</div>
            </div>
          ))}
          {references.length === 0 && (
            <div className="col-span-full text-center text-brand-dark/60 py-8 text-lg font-medium">
              Aucune référence sélectionnée.
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <Button
          className="rounded-full px-8 py-2 text-base font-bold bg-brand-yellow text-brand-dark shadow-lg hover:bg-brand-yellow/90 transition"
          onClick={handleFinish}
        >
          Générer le CV / Terminer
        </Button>
      </div>
      
      {/* Notification de téléchargement */}
      <DownloadNotification
        isVisible={downloadNotification.isVisible}
        filename={downloadNotification.filename}
        referenceCount={downloadNotification.referenceCount}
        onClose={() => setDownloadNotification(prev => ({ ...prev, isVisible: false }))}
        onDownloadAgain={downloadNotification.lastDownloadData ? handleDownloadAgain : undefined}
      />
    </div>
  );
};

export default RecapStep;