import React, { useEffect, useState } from 'react';
import { useWorkflow } from '@/components/WorkflowContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface Salarie {
  id_salarie: number;
  nom: string;
  prenom: string;
  agence: string;
  fonction: string;
  niveau_expertise: string;
  references?: Reference[];
}

interface Reference {
  id_reference: number;
  nom_projet: string;
  ville: string;
  annee: number;
  type_mission: string;
  montant: number;
  client: string;
  role_projet?: string;
  principal?: boolean;
}

const ReferenceAssociation: React.FC = () => {
  const { 
    selectedTeam, 
    selectedReferences, 
    referenceAssociation, 
    setReferenceAssociation,
    useDefaultReferences,
    setUseDefaultReferences
  } = useWorkflow();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Charger toutes les références disponibles
  const { data: referencesData, isLoading: referencesLoading } = useQuery({
    queryKey: ['references'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/references`);
      if (!response.ok) throw new Error('Erreur chargement références');
      return response.json();
    }
  });

  const references = referencesData?.references || [];

  // Charger les références par défaut pour chaque membre de l'équipe
  useEffect(() => {
    const loadDefaultReferences = async () => {
      if (!useDefaultReferences || selectedTeam.length === 0) return;
      
      setLoading(true);
      const newAssociations: { [key: number]: number[] } = {};
      
      try {
        for (const member of selectedTeam) {
          const response = await fetch(`${BACKEND_URL}/api/salaries/${member.id_salarie}/references`);
          if (response.ok) {
            const data = await response.json();
            newAssociations[member.id_salarie] = data.references.map((ref: Reference) => ref.id_reference);
          } else {
            newAssociations[member.id_salarie] = [];
          }
        }
        
        setReferenceAssociation(newAssociations);
        console.log('🔧 [ASSOCIATION] Références par défaut chargées:', newAssociations);
      } catch (error) {
        console.error('❌ [ASSOCIATION] Erreur chargement références par défaut:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultReferences();
  }, [selectedTeam, useDefaultReferences, setReferenceAssociation]);

  // Vérifier si l'équipe est sélectionnée
  if (selectedTeam.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Aucune équipe sélectionnée</h2>
          <p className="text-gray-600 mb-6">Veuillez d'abord sélectionner une équipe.</p>
          <Button onClick={() => navigate('/team')} className="bg-blue-600 hover:bg-blue-700">
            🔙 Retour à la sélection d'équipe
          </Button>
        </div>
      </div>
    );
  }

  // Toggle d'une référence pour un membre
  const toggleReference = (memberId: number, referenceId: number) => {
    const currentRefs = referenceAssociation[memberId] || [];
    const newRefs = currentRefs.includes(referenceId)
      ? currentRefs.filter(id => id !== referenceId)
      : [...currentRefs, referenceId];
    
    setReferenceAssociation({
      ...referenceAssociation,
      [memberId]: newRefs
    });
  };

  // Continuer vers le récapitulatif
  const handleContinue = () => {
    console.log('🔗 [ASSOCIATION] Associations finales:', referenceAssociation);
    navigate('/recap');
  };

  // Calculer les statistiques
  const totalAssociations = Object.values(referenceAssociation).reduce((sum, refs) => sum + refs.length, 0);
  const membersWithRefs = Object.values(referenceAssociation).filter(refs => refs.length > 0).length;

  if (loading || referencesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {useDefaultReferences ? 'Chargement des références par défaut...' : 'Chargement des références...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🔗 Association Membres ↔ Références
        </h1>
        <p className="text-gray-600">
          {useDefaultReferences 
            ? 'Les références par défaut ont été pré-chargées. Vous pouvez les modifier selon vos besoins.'
            : 'Associez manuellement les références à chaque membre de l\'équipe.'
          }
        </p>
      </div>

      {/* Options de chargement */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useDefaultReferences}
              onChange={(e) => setUseDefaultReferences(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-blue-800 font-medium">
              🔧 Utiliser les références par défaut des salariés
            </span>
          </label>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          Les références par défaut sont définies dans la page "🔧 Références par défaut" du menu.
        </p>
      </div>

      {/* Statistiques */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl font-bold text-blue-600">{selectedTeam.length}</div>
          <div className="text-gray-600">Membres sélectionnés</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl font-bold text-green-600">{totalAssociations}</div>
          <div className="text-gray-600">Associations totales</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl font-bold text-purple-600">{membersWithRefs}</div>
          <div className="text-gray-600">Membres avec références</div>
        </div>
      </div>

      {/* Associations par membre */}
      <div className="space-y-6">
        {selectedTeam.map((member: Salarie) => {
          const memberRefs = referenceAssociation[member.id_salarie] || [];
          
          return (
            <div key={member.id_salarie} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  👤 {member.prenom} {member.nom}
                </h3>
                <p className="text-gray-600">
                  {member.fonction} • {member.agence} • {member.niveau_expertise}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {memberRefs.length} référence(s) associée(s)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {references.map((reference: Reference) => {
                  const isSelected = memberRefs.includes(reference.id_reference);
                  
                  return (
                    <div
                      key={reference.id_reference}
                      onClick={() => toggleReference(member.id_salarie, reference.id_reference)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">
                            {reference.nom_projet}
                          </div>
                          <div className="text-xs text-gray-600">
                            {reference.ville} • {reference.annee}
                          </div>
                          <div className="text-xs text-gray-500">
                            {reference.type_mission}
                          </div>
                        </div>
                        <div className="ml-2">
                          {isSelected ? (
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <Button
          onClick={() => navigate('/references')}
          variant="outline"
          className="flex-1"
        >
          🔙 Retour aux références
        </Button>
        <Button
          onClick={handleContinue}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={totalAssociations === 0}
        >
          📋 Continuer vers le récapitulatif
        </Button>
      </div>
    </div>
  );
};

export default ReferenceAssociation;