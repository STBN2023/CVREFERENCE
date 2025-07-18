import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TeamPage from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReferenceSelection from "./pages/ReferenceSelection";
import Recap from "./pages/Recap";
import Admin from "./pages/Admin";
import { BurgerMenu } from "@/components/BurgerMenu";
import ReferenceAssociation from "./pages/ReferenceAssociation";
import { RainbowThemeButton } from "@/components/RainbowThemeButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BurgerMenu />
        <RainbowThemeButton />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/references" element={<ReferenceSelection />} />
          <Route path="/association" element={<ReferenceAssociation />} />
          <Route path="/recap" element={<Recap />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;