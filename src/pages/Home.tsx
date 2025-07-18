import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-lightblue to-brand-pale">
      <div className="bg-white/80 rounded-2xl shadow-xl p-10 flex flex-col items-center gap-8">
        <h1 className="text-5xl font-extrabold text-brand-dark mb-2 drop-shadow">Bienvenue</h1>
        <p className="text-lg text-brand-dark/80 mb-4 text-center max-w-md">
          Lancez la constitution d’équipe et la sélection de références, ou accédez aux paramètres administrateur.
        </p>
        <div className="flex gap-6">
          <Button
            size="lg"
            className="rounded-full px-8 py-3 text-xl font-bold bg-brand-blue text-white shadow-lg hover:bg-brand-blue/90 transition"
            onClick={() => navigate("/team")}
          >
            Go 🚀
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 py-3 text-xl font-bold border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale transition"
            onClick={() => navigate("/admin")}
          >
            Admin
          </Button>
        </div>
      </div>
      <div className="mt-12">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Home;