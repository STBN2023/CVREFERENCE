import React, { useEffect, useState } from 'react';
import { useWorkflow } from '@/components/WorkflowContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface Employee {
  id: string;
  name: string;
  [key: string]: any;
}

interface Reference {
  id: string;
  nom_projet: string;
  description_courte?: string;
  description_longue?: string;
  [key: string]: any;
}

export const RecapStep = () => {
  console.log('🚀 [RECAP] Composant Recap monté');
  
  const {
    selectedTeam,
    selectedReferences,
    referenceAssociation
  } = useWorkflow();
  
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  console.log('📋 [RECAP] Context data:', {
    selectedTeam: selectedTeam?.length || 0,
    selectedReferences: selectedReferences?.length || 0,
    referenceAssociation: Object.keys(referenceAssociation || {}).length
  });

  // Chargement des données depuis le backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 [RECAP] Chargement des données...');
        setLoading(true);
        
        // Chargement des employés
        const employeesResponse = await fetch(`${BACKEND_URL}/api/salaries`);
        if (!employeesResponse.ok) throw new Error('Erreur chargement employés');
        const employeesData = await employeesResponse.json();
        
        const employeesFormatted = employeesData.salaries.map((emp: any) => ({
          id: emp.id_salarie.toString(),
          name: `${emp.prenom} ${emp.nom}`,
          ...emp
        }));
        setEmployees(employeesFormatted);
        console.log('👥 [RECAP] Employés chargés:', employeesFormatted.length);
        
        // Chargement des références
        const referencesResponse = await fetch(`${BACKEND_URL}/api/references`);
        if (!referencesResponse.ok) throw new Error('Erreur chargement références');
        const referencesData = await referencesResponse.json();
        
        const referencesFormatted = referencesData.references.map((ref: any) => ({
          id: ref.id_reference.toString(),
          nom_projet: ref.nom_projet,
          description_courte: ref.description_courte,
          description_longue: ref.description_longue,
          ...ref
        }));
        setReferences(referencesFormatted);
        console.log('📋 [RECAP] Références chargées:', referencesFormatted.length);
        
      } catch (err) {
        console.error('❌ [RECAP] Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fonction de génération des CV
  const handleGenerateCV = async () => {
    console.log('🚀 [RECAP] Début génération des CV...');
    setGenerating(true);
    
    try {
      // Préparer les données de l'équipe
      const teamData = selectedTeam.map(memberId => {
        const employee = employees.find(emp => emp.id === memberId);
        return {
          id: memberId,
          name: employee?.name || `Employé ${memberId}`,
          prenom: employee?.prenom || employee?.name?.split(' ')[0] || '',
          nom: employee?.nom || employee?.name?.split(' ').slice(1).join(' ') || '',
          fonction: employee?.fonction || 'Non spécifié',
          agence: employee?.agence || 'Non spécifié',
          niveau_expertise: employee?.niveau_expertise || 'Non spécifié'
        };
      });
      
      // Préparer les données des références
      const referencesData = selectedReferences.map(refId => {
        const reference = references.find(ref => ref.id === refId);
        return {
          id: refId,
          nom_projet: reference?.nom_projet || `Projet ${refId}`,
          client: reference?.client || 'Client non spécifié',
          ville: reference?.ville || 'Non spécifié',
          annee: reference?.annee || new Date().getFullYear(),
          type_mission: reference?.type_mission || 'Non spécifié',
          montant: reference?.montant || 0,
          description_projet: reference?.description_projet || 'Aucune description'
        };
      });
      
      console.log('📊 [RECAP] Données préparées:', {
        teamData: teamData.length,
        referencesData: referencesData.length,
        associations: Object.keys(referenceAssociation).length
      });
      
      // Appel API pour générer les CV
      const response = await fetch(`${BACKEND_URL}/api/generate-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamData,
          referencesData,
          associations: referenceAssociation
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }
      
      const result = await response.json();
      console.log('✅ [RECAP] CV générés avec succès:', result);
      
      // Afficher un message de succès et rediriger vers les téléchargements
      alert(`✅ ${result.totalFiles} CV générés avec succès !\n\nVous allez être redirigé vers la page de téléchargement.`);
      
      // Redirection vers la page downloads
      setTimeout(() => {
        navigate('/downloads');
      }, 1000);
      
    } catch (error) {
      console.error('❌ [RECAP] Erreur génération CV:', error);
      alert(`❌ Erreur lors de la génération des CV:\n${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setGenerating(false);
    }
  };

  // Validation du workflow
  const isWorkflowValid = selectedTeam.length > 0 && selectedReferences.length > 0;
  
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Chargement du récapitulatif...</h1>
        <p>Récupération des données depuis la base de données...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Erreur</h1>
        <p>Erreur lors du chargement : {error}</p>
        <Button onClick={() => navigate('/team')}>Retour à la sélection d'équipe</Button>
      </div>
    );
  }
  
  if (!isWorkflowValid) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Workflow incomplet</h1>
        <p>Veuillez d'abord sélectionner une équipe et des références.</p>
        <div style={{ marginTop: '20px' }}>
          <Button onClick={() => navigate('/team')} style={{ marginRight: '10px' }}>
            Sélectionner une équipe
          </Button>
          <Button onClick={() => navigate('/references')}>
            Sélectionner des références
          </Button>
        </div>
      </div>
    );
  }
  
  // Récupération des données sélectionnées
  const selectedEmployees = employees.filter(emp => selectedTeam.includes(emp.id));
  const selectedReferencesData = references.filter(ref => selectedReferences.includes(ref.id));
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '30px' }}>📋 Récapitulatif de la génération CV</h1>
      
      {/* Équipe sélectionnée */}
      <div style={{ marginBottom: '30px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ color: '#1e40af', marginBottom: '15px' }}>👥 Équipe sélectionnée ({selectedEmployees.length} membres)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
          {selectedEmployees.map(emp => (
            <div key={emp.id} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>{emp.name}</strong>
            </div>
          ))}
        </div>
      </div>
      
      {/* Références sélectionnées */}
      <div style={{ marginBottom: '30px', backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ color: '#166534', marginBottom: '15px' }}>📚 Références sélectionnées ({selectedReferencesData.length} projets)</h2>
        <div style={{ display: 'grid', gap: '15px' }}>
          {selectedReferencesData.map(ref => (
            <div key={ref.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#15803d' }}>{ref.nom_projet}</h3>
              <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>
                {ref.description_courte || ref.description_longue || 'Aucune description disponible'}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Associations */}
      <div style={{ marginBottom: '30px', backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ color: '#92400e', marginBottom: '15px' }}>🔗 Associations membres-références</h2>
        {Object.keys(referenceAssociation).length > 0 ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {Object.entries(referenceAssociation).map(([empId, refIds]) => {
              const employee = employees.find(e => e.id === empId);
              const empReferences = refIds.map(refId => references.find(r => r.id === refId)).filter(Boolean);
              
              return (
                <div key={empId} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                  <strong style={{ color: '#92400e' }}>{employee?.name || `Employé ${empId}`}</strong>
                  <span style={{ color: '#6b7280', margin: '0 10px' }}>→</span>
                  <span style={{ color: '#374151' }}>
                    {empReferences.length > 0 
                      ? empReferences.map(ref => ref?.nom_projet).join(', ')
                      : 'Aucune référence associée'
                    }
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Aucune association définie</p>
        )}
      </div>
      
      {/* Actions */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '40px' }}>
        <Button 
          onClick={() => navigate('/association')}
          variant="outline"
          style={{ padding: '12px 24px' }}
        >
          ← Modifier les associations
        </Button>
        <Button 
          onClick={handleGenerateCV}
          disabled={generating}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: generating ? '#9ca3af' : '#2563eb', 
            color: 'white',
            cursor: generating ? 'not-allowed' : 'pointer'
          }}
        >
          {generating ? '⏳ Génération en cours...' : '🚀 Générer les CV'}
        </Button>
      </div>
      
      {/* Informations de débogage */}
      <div style={{ marginTop: '40px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '12px', color: '#64748b' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🔧 Informations de débogage</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Backend URL: {BACKEND_URL}</li>
          <li>Employés chargés: {employees.length}</li>
          <li>Références chargées: {references.length}</li>
          <li>Équipe sélectionnée: {selectedTeam.length} membres</li>
          <li>Références sélectionnées: {selectedReferences.length} projets</li>
          <li>Associations: {Object.keys(referenceAssociation).length} membres associés</li>
        </ul>
      </div>
    </div>
  );
};

export default RecapStep;
