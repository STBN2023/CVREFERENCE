import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Settings, Shield, FileSpreadsheet, Database } from "lucide-react";

function AdminHome() {
  const navigate = useNavigate();

  const adminSections = [
    {
      title: "Gestion des Salariés",
      description: "Ajouter, modifier, supprimer et importer des salariés. Export Excel disponible.",
      icon: Users,
      path: "/admin/salaries",
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      iconColor: "text-blue-600",
      features: ["CRUD complet", "Import/Export Excel", "Gestion des associations"]
    },
    {
      title: "Gestion des Références",
      description: "Administrer les projets de référence et leurs associations avec les salariés.",
      icon: Building2,
      path: "/admin/references",
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      iconColor: "text-green-600",
      features: ["Projets de référence", "Import/Export Excel", "Associations salariés"]
    },
    {
      title: "Référentiels",
      description: "Gérer les agences, fonctions, niveaux d'expertise et autres données de référence.",
      icon: Database,
      path: "/referentials",
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      iconColor: "text-purple-600",
      features: ["Agences", "Fonctions", "Niveaux d'expertise"]
    },
    {
      title: "Outils Admin",
      description: "Outils avancés d'administration : RAZ sécurisée, exports globaux, maintenance.",
      icon: Shield,
      path: "/admin/tools",
      color: "bg-red-50 border-red-200 hover:bg-red-100",
      iconColor: "text-red-600",
      features: ["RAZ sécurisée", "Exports globaux", "Maintenance DB"]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-brand-dark mb-4">
          Administration
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tableau de bord administrateur pour la gestion des salariés, références et référentiels. 
          Accédez aux différents modules d'administration ci-dessous.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {adminSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card 
              key={section.path}
              className={`${section.color} transition-all duration-200 cursor-pointer transform hover:scale-105 hover:shadow-lg`}
              onClick={() => navigate(section.path)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                    <IconComponent className={`h-6 w-6 ${section.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    {section.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {section.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  {section.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full ${section.iconColor.replace('text-', 'bg-')}`}></div>
                      {feature}
                    </div>
                  ))}
                </div>
                
                <Button 
                  className={`w-full ${section.iconColor.replace('text-', 'bg-')} hover:opacity-90 text-white font-medium`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(section.path);
                  }}
                >
                  Accéder au module
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FileSpreadsheet className="h-5 w-5 text-brand-blue" />
            <h3 className="text-lg font-semibold text-gray-800">Import/Export Excel</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Tous les modules supportent l'import et l'export Excel pour faciliter la gestion des données.
            Les exports incluent toutes les associations et données liées.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
