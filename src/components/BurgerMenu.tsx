import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/team", label: "Équipe" },
  { to: "/references", label: "Références" },
  { to: "/recap", label: "Récapitulatif" },
  { to: "/downloads", label: "📁 Téléchargements" },
  { to: "/admin", label: "Admin" },
  { to: "/referentials", label: "⚙️ Référentiels" },
];

export const BurgerMenu = () => {
  const location = useLocation();

  return (
    <div className="fixed top-4 left-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-brand-dark bg-white hover:bg-brand-pale"
            aria-label="Ouvrir le menu"
          >
            <Menu className="text-brand-dark" size={28} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <nav className="flex flex-col gap-2 mt-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-6 py-3 text-lg font-semibold rounded-r-full transition
                  ${
                    location.pathname === link.to
                      ? "bg-brand-yellow text-brand-dark"
                      : "hover:bg-brand-pale text-brand-dark"
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};