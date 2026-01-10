import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { BackgroundSearchProvider } from "@/contexts/BackgroundSearchContext";
import { CNPJPullProvider } from "@/contexts/CNPJPullContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Contratos from "./pages/Contratos";
import Financeiro from "./pages/Financeiro";
import Producao from "./pages/Producao";
import Equipe from "./pages/Equipe";

import Configuracoes from "./pages/Configuracoes";
import Planejamentos from "./pages/Planejamentos";
import PlanejamentoPublico from "./pages/PlanejamentoPublico";
import Metas from "./pages/Metas";
import Supervisao from "./pages/Supervisao";
import Login from "./pages/Login";
import AssinarContrato from "./pages/AssinarContrato";
import NotFound from "./pages/NotFound";
import CRM from "./pages/CRM";
import Leads from "./pages/Leads";
import MetricasComerciais from "./pages/MetricasComerciais";
import Prospeccao from "./pages/Prospeccao";
import Perfil from "./pages/Perfil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppearanceProvider>
      <NotificationProvider>
      <BackgroundSearchProvider>
      <CNPJPullProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/planejamento/:token" element={<PlanejamentoPublico />} />
            <Route path="/assinar-contrato/:token" element={<AssinarContrato />} />
            
            {/* Protected routes with layout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/contratos" element={<Contratos />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/producao" element={<Producao />} />
                    <Route path="/equipe" element={<Equipe />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/supervisao" element={<Supervisao />} />
                    <Route path="/planejamentos" element={<Planejamentos />} />
                    <Route path="/metas" element={<Metas />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/prospeccao" element={<Prospeccao />} />
                    <Route path="/metricas-comerciais" element={<MetricasComerciais />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CNPJPullProvider>
      </BackgroundSearchProvider>
      </NotificationProvider>
      </AppearanceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
