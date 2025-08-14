import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { Shield, RotateCcw, AlertTriangle, ArrowLeft, Database, FileSpreadsheet, Settings } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function AdminTools() {
  const navigate = useNavigate();
  
  // États pour RAZ Admin
  const [showAdminReset, setShowAdminReset] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [resetTarget, setResetTarget] = useState<'salaries' | 'references' | 'all'>('salaries');
  const [adminResetLoading, setAdminResetLoading] = useState(false);

  const handleAdminReset = async () => {
    if (!adminPassword.trim()) {
      showError('Veuillez saisir le mot de passe administrateur');
      return;
    }

    setAdminResetLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPassword,
          target: resetTarget
        })
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(result.message || 'RAZ effectuée avec succès');
        setShowAdminReset(false);
        setAdminPassword('');
      } else {
        showError(result.message || 'Erreur lors de la RAZ');
      }
    } catch (error) {
      console.error('Erreur RAZ admin:', error);
      showError('Erreur lors de la RAZ administrateur');
    } finally {
      setAdminResetLoading(false);
    }
  };

  const adminTools = [
    {
      title: "RAZ Sécurisée",
      description: "Suppression sécurisée des données avec authentification administrateur",
      icon: Shield,
      color: "bg-red-50 border-red-200 hover:bg-red-100",
      iconColor: "text-red-600",
      action: () => setShowAdminReset(true),
      features: ["Suppression salariés", "Suppression références", "Suppression complète", "Protection par mot de passe"]
    },
    {
      title: "Maintenance Base",
      description: "Outils de maintenance et optimisation de la base de données",
      icon: Database,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      iconColor: "text-blue-600",
      action: () => showError('Fonctionnalité en développement'),
      features: ["Optimisation DB", "Vérification intégrité", "Nettoyage orphelins", "Statistiques"]
    },
    {
      title: "Exports Globaux",
      description: "Export complet de toutes les données en différents formats",
      icon: FileSpreadsheet,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      iconColor: "text-green-600",
      action: () => showError('Fonctionnalité en développement'),
      features: ["Export Excel complet", "Export JSON", "Export CSV", "Sauvegarde complète"]
    },
    {
      title: "Configuration",
      description: "Paramètres avancés et configuration du système",
      icon: Settings,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      iconColor: "text-purple-600",
      action: () => showError('Fonctionnalité en développement'),
      features: ["Paramètres système", "Variables d'environnement", "Logs système", "Monitoring"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Header avec navigation */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">Outils Administrateur</h1>
            <p className="text-gray-600 mt-1">Outils avancés pour la maintenance et la gestion du système</p>
          </div>
        </div>
      </div>

      {/* Avertissement de sécurité */}
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
          <AlertTriangle className="h-5 w-5" />
          Zone Administrateur Avancée
        </div>
        <p className="text-sm text-yellow-700">
          Ces outils sont destinés aux administrateurs expérimentés. Certaines actions sont irréversibles 
          et peuvent affecter l'intégrité des données. Utilisez avec précaution.
        </p>
      </div>

      {/* Grille des outils */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminTools.map((tool, index) => {
          const IconComponent = tool.icon;
          return (
            <div 
              key={index}
              className={`${tool.color} transition-all duration-200 cursor-pointer transform hover:scale-105 hover:shadow-lg rounded-lg border p-6`}
              onClick={tool.action}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                  <IconComponent className={`h-6 w-6 ${tool.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{tool.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{tool.description}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {tool.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className={`w-1.5 h-1.5 rounded-full ${tool.iconColor.replace('text-', 'bg-')}`}></div>
                    {feature}
                  </div>
                ))}
              </div>
              
              <Button 
                className={`w-full ${tool.iconColor.replace('text-', 'bg-')} hover:opacity-90 text-white font-medium`}
                onClick={(e) => {
                  e.stopPropagation();
                  tool.action();
                }}
              >
                Utiliser l'outil
              </Button>
            </div>
          );
        })}
      </div>

      {/* Statistiques rapides */}
      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-brand-blue" />
          Statistiques Système
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-brand-blue">-</div>
            <div className="text-sm text-gray-600">Salariés Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">-</div>
            <div className="text-sm text-gray-600">Références Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">-</div>
            <div className="text-sm text-gray-600">Associations</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">-</div>
            <div className="text-sm text-gray-600">Référentiels</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          * Les statistiques détaillées seront disponibles dans une prochaine version
        </p>
      </div>

      {/* Dialog RAZ Admin */}
      <Dialog open={showAdminReset} onOpenChange={setShowAdminReset}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              RAZ Administrateur
            </DialogTitle>
            <DialogDescription>
              Suppression sécurisée des données avec authentification administrateur
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                Attention !
              </div>
              <p className="text-sm text-red-700">
                Cette action supprimera définitivement toutes les données sélectionnées. 
                Cette opération est irréversible.
              </p>
            </div>
            
            <div>
              <Label htmlFor="resetTarget" className="text-sm font-medium">
                Données à supprimer
              </Label>
              <select
                id="resetTarget"
                value={resetTarget}
                onChange={(e) => setResetTarget(e.target.value as 'salaries' | 'references' | 'all')}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="salaries">Salariés uniquement</option>
                <option value="references">Références uniquement</option>
                <option value="all">Tout (Salariés + Références)</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="adminPassword" className="text-sm font-medium">
                Mot de passe administrateur
              </Label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Saisissez le mot de passe admin"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !adminResetLoading) {
                    handleAdminReset();
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAdminReset(false);
                setAdminPassword('');
              }}
              disabled={adminResetLoading}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleAdminReset}
              disabled={adminResetLoading || !adminPassword.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {adminResetLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Confirmer RAZ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminTools;
