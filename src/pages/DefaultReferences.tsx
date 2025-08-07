import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const DefaultReferences: React.FC = () => {
  const [selectedSalarie, setSelectedSalarie] = useState<Salarie | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<number[]>([]);
  const [referenceCountBySalarie, setReferenceCountBySalarie] = useState<Record<number, number>>({});
  const queryClient = useQueryClient();

  // Charger tous les salariés
  const { data: salariesData, isLoading: salariesLoading } = useQuery({
    queryKey: ['salaries'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/salaries`);
      if (!response.ok) throw new Error('Erreur chargement salariés');
      return response.json();
    }
  });

  // Charger toutes les références disponibles
  const { data: referencesData, isLoading: referencesLoading } = useQuery({
    queryKey: ['references'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/references`);
      if (!response.ok) throw new Error('Erreur chargement références');
      return response.json();
    }
  });

  // Mutation pour mettre à jour les références par défaut
  const updateDefaultReferencesMutation = useMutation({
    mutationFn: async ({ salarieId, referenceIds }: { salarieId: number; referenceIds: number[] }) => {
      const response = await fetch(`${BACKEND_URL}/api/salaries/${salarieId}/references`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceIds })
      });
      if (!response.ok) throw new Error('Erreur mise à jour références');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      // Mettre à jour le compteur pour le salarié actuel
      if (selectedSalarie) {
        setReferenceCountBySalarie(prev => ({
          ...prev,
          [selectedSalarie.id_salarie]: selectedReferences.length
        }));
      }
      alert('✅ Références par défaut sauvegardées avec succès!');
    },
    onError: (error) => {
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  });

  const salaries = salariesData?.salaries || [];
  const references = referencesData?.references || [];

  // Charger les compteurs de références pour tous les salariés au démarrage
  useEffect(() => {
    const loadAllReferenceCounts = async () => {
      if (salaries.length === 0) return;
      
      const counts: Record<number, number> = {};
      
      for (const salarie of salaries) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/salaries/${salarie.id_salarie}/references`);
          if (response.ok) {
            const data = await response.json();
            counts[salarie.id_salarie] = data.references.length;
          } else {
            counts[salarie.id_salarie] = 0;
          }
        } catch (error) {
          console.error(`Erreur chargement compteur pour salarié ${salarie.id_salarie}:`, error);
          counts[salarie.id_salarie] = 0;
        }
      }
      
      setReferenceCountBySalarie(counts);
      console.log('🔢 [DEFAULT-REF] Compteurs de références chargés:', counts);
    };
    
    loadAllReferenceCounts();
  }, [salaries]);

  // Sélectionner un salarié et charger ses références actuelles
  const handleSelectSalarie = async (salarie: Salarie) => {
    setSelectedSalarie(salarie);
    
    // Charger les références par défaut de ce salarié depuis l'API
    try {
      const response = await fetch(`${BACKEND_URL}/api/salaries/${salarie.id_salarie}/references`);
      if (response.ok) {
        const data = await response.json();
        const currentReferenceIds = data.references.map((ref: Reference) => ref.id_reference);
        setSelectedReferences(currentReferenceIds);
        // Mettre à jour le compteur pour ce salarié
        setReferenceCountBySalarie(prev => ({
          ...prev,
          [salarie.id_salarie]: currentReferenceIds.length
        }));
        console.log(`🔧 [DEFAULT-REF] Références chargées pour ${salarie.prenom} ${salarie.nom}:`, currentReferenceIds);
      } else {
        console.error(`❌ [DEFAULT-REF] Erreur chargement références pour salarié ${salarie.id_salarie}`);
        setSelectedReferences([]);
      }
    } catch (error) {
      console.error(`❌ [DEFAULT-REF] Erreur réseau:`, error);
      setSelectedReferences([]);
    }
  };

  // Toggle d'une référence
  const toggleReference = (referenceId: number) => {
    setSelectedReferences(prev => 
      prev.includes(referenceId)
        ? prev.filter(id => id !== referenceId)
        : [...prev, referenceId]
    );
  };

  // Sauvegarder les références par défaut
  const handleSave = () => {
    if (!selectedSalarie) return;
    
    updateDefaultReferencesMutation.mutate({
      salarieId: selectedSalarie.id_salarie,
      referenceIds: selectedReferences
    });
  };

  if (salariesLoading || referencesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🔧 Gestion des Références par Défaut
        </h1>
        <p className="text-gray-600">
          Définissez les références par défaut pour chaque salarié. Ces références seront pré-sélectionnées lors de la génération des CV.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Liste des salariés */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">👥 Salariés</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {salaries.map((salarie: Salarie) => (
              <div
                key={salarie.id_salarie}
                onClick={() => handleSelectSalarie(salarie)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedSalarie?.id_salarie === salarie.id_salarie
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-800">
                  {salarie.prenom} {salarie.nom}
                </div>
                <div className="text-sm text-gray-600">
                  {salarie.fonction} • {salarie.agence}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {referenceCountBySalarie[salarie.id_salarie] || 0} référence(s) assignée(s)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gestion des références */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📚 Références {selectedSalarie ? `pour ${selectedSalarie.prenom} ${selectedSalarie.nom}` : ''}
          </h2>
          
          {!selectedSalarie ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">👆</div>
              <p>Sélectionnez un salarié pour gérer ses références par défaut</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedReferences.length}</strong> référence(s) sélectionnée(s) sur <strong>{references.length}</strong> disponible(s)
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {references.map((reference: Reference) => (
                  <div
                    key={reference.id_reference}
                    onClick={() => toggleReference(reference.id_reference)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReferences.includes(reference.id_reference)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {reference.nom_projet}
                        </div>
                        <div className="text-sm text-gray-600">
                          {reference.ville} • {reference.annee} • {reference.type_mission}
                        </div>
                        <div className="text-xs text-gray-500">
                          {reference.client} • {reference.montant?.toLocaleString()} €
                        </div>
                      </div>
                      <div className="ml-3">
                        {selectedReferences.includes(reference.id_reference) ? (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={updateDefaultReferencesMutation.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateDefaultReferencesMutation.isPending ? (
                    <>⏳ Sauvegarde...</>
                  ) : (
                    <>💾 Sauvegarder les références par défaut</>
                  )}
                </button>
                <button
                  onClick={() => setSelectedReferences([])}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🗑️ Tout désélectionner
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultReferences;
