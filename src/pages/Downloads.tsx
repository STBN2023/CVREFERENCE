import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Download, Trash2, FileText, Calendar, HardDrive, RefreshCw } from "lucide-react";

interface DownloadFile {
  filename: string;
  sizeBytes: number;
  createdAt: number;
}

const Downloads = () => {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Charger la liste des fichiers
  const loadFiles = async () => {
    try {
      setLoading(true);
      
      // URL de l'API configurable
      const apiUrl = import.meta.env.MODE === 'production' 
        ? '/api/downloads'  // En production, utiliser l'URL relative
        : 'http://localhost:4000/api/downloads'; // En dev, utiliser localhost
      
      console.log('🔄 Chargement des fichiers depuis:', apiUrl);
      console.log('🌍 Environnement:', import.meta.env.MODE);
      
      const response = await fetch(apiUrl);
      
      console.log('📊 Réponse API:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📁 Données reçues:', data);
        console.log('📁 Nombre de fichiers:', data.files?.length || 0);
        
        setFiles(data.files || []);
        
        if (data.files && data.files.length > 0) {
          console.log('✅ Fichiers chargés avec succès:', data.files.length);
          showSuccess(`✅ ${data.files.length} fichier(s) chargé(s)`);
        } else {
          console.log('⚠️ Aucun fichier trouvé');
        }
      } else {
        console.error('❌ Erreur API:', response.status, response.statusText);
        showError(`❌ Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      showError(`❌ Erreur de connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Télécharger un fichier spécifique
  const handleDownload = async (filename: string) => {
    setDownloading(filename);
    const loadingToast = showLoading(`🔄 Téléchargement de ${filename}...`);
    
    try {
      // URL de l'API configurable
      const apiUrl = import.meta.env.MODE === 'production' 
        ? `/api/download/${encodeURIComponent(filename)}`
        : `http://localhost:4000/api/download/${encodeURIComponent(filename)}`;
      
      console.log('📎 Téléchargement depuis:', apiUrl);
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        dismissToast(String(loadingToast));
        showSuccess(`✅ ${filename} téléchargé avec succès !`);
        
        // Alerte de confirmation
        setTimeout(() => {
          alert(`✅ Fichier téléchargé avec succès !\n\n📁 ${filename}\n\nLe fichier se trouve dans votre dossier de téléchargements.`);
        }, 500);
        
      } else {
        dismissToast(String(loadingToast));
        showError(`❌ Erreur lors du téléchargement de ${filename}`);
      }
    } catch (error) {
      dismissToast(String(loadingToast));
      console.error("Erreur téléchargement:", error);
      showError("❌ Erreur de connexion lors du téléchargement");
    } finally {
      setDownloading(null);
    }
  };

  // Supprimer un fichier
  const handleDelete = async (filename: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${filename}" ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    setDeleting(filename);
    const loadingToast = showLoading(`🗑️ Suppression de ${filename}...`);
    
    try {
      // URL de l'API configurable
      const apiUrl = import.meta.env.MODE === 'production' 
        ? `/api/download/${encodeURIComponent(filename)}`
        : `http://localhost:4000/api/download/${encodeURIComponent(filename)}`;
      
      console.log('🗑️ Suppression depuis:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        dismissToast(String(loadingToast));
        showSuccess(`✅ ${filename} supprimé avec succès !`);
        // Recharger la liste
        loadFiles();
      } else {
        dismissToast(String(loadingToast));
        showError(`❌ Erreur lors de la suppression de ${filename}`);
      }
    } catch (error) {
      dismissToast(String(loadingToast));
      console.error("Erreur suppression:", error);
      showError("❌ Erreur de connexion lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    console.log('\n=== 📁 CHARGEMENT PAGE DOWNLOADS ===');
    console.log('🔄 useEffect déclenché, appel loadFiles()...');
    loadFiles();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-4 text-center text-brand-dark tracking-tight drop-shadow-sm">
          📁 Gestion des Téléchargements
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Retrouvez et téléchargez tous vos CV enrichis générés précédemment
        </p>
        
        <div className="flex justify-center">
          <Button
            onClick={loadFiles}
            disabled={loading}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des fichiers...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun fichier trouvé</h3>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas encore généré de CV enrichi.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark"
          >
            Commencer maintenant
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                📊 {files.length} fichier{files.length > 1 ? 's' : ''} disponible{files.length > 1 ? 's' : ''}
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {files.map((file, index) => (
                <div key={file.filename} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900 break-all">
                          {file.filename}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4" />
                          <span>{formatFileSize(file.sizeBytes)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(new Date(file.createdAt).toISOString())}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleDownload(file.filename)}
                        disabled={downloading === file.filename}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {downloading === file.filename ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleDelete(file.filename)}
                        disabled={deleting === file.filename}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {deleting === file.filename ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            Suppression...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Downloads;
