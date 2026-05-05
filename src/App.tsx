import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Equipos from "./pages/Equipos";
import EquipoForm from "./pages/EquipoForm";
import EquipoDetalle from "./pages/EquipoDetalle";
import Filiales from "./pages/Filiales";
import Movimientos from "./pages/Movimientos";
import Mantenimientos from "./pages/Mantenimientos";
import Reportes from "./pages/Reportes";
import Auditorias from "./pages/Auditorias";
import AuditoriaDetalle from "./pages/AuditoriaDetalle";
import Alertas from "./pages/Alertas";
import Configuracion from "./pages/Configuracion";
import ImportarExcel from "./pages/ImportarExcel";
import ModoAuditoria from "./pages/ModoAuditoria";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/equipos" element={<ProtectedRoute requireModulo="equipos"><Equipos /></ProtectedRoute>} />
              <Route path="/equipos/nuevo" element={<ProtectedRoute requireModulo="equipos"><EquipoForm /></ProtectedRoute>} />
              <Route path="/equipos/:id" element={<ProtectedRoute requireModulo="equipos"><EquipoDetalle /></ProtectedRoute>} />
              <Route path="/equipos/:id/editar" element={<ProtectedRoute requireModulo="equipos"><EquipoForm /></ProtectedRoute>} />
              <Route path="/filiales" element={<ProtectedRoute requireModulo="filiales"><Filiales /></ProtectedRoute>} />
              <Route path="/movimientos" element={<ProtectedRoute requireModulo="movimientos"><Movimientos /></ProtectedRoute>} />
              <Route path="/mantenimientos" element={<ProtectedRoute requireModulo="mantenimientos"><Mantenimientos /></ProtectedRoute>} />
              <Route path="/reportes" element={<ProtectedRoute requireModulo="reportes"><Reportes /></ProtectedRoute>} />
              <Route path="/auditorias" element={<ProtectedRoute requireModulo="auditorias"><Auditorias /></ProtectedRoute>} />
              <Route path="/auditorias/:id" element={<ProtectedRoute requireModulo="auditorias"><AuditoriaDetalle /></ProtectedRoute>} />
              <Route path="/alertas" element={<ProtectedRoute requireModulo="alertas"><Alertas /></ProtectedRoute>} />
              <Route path="/importar" element={<ProtectedRoute requireModulo="equipos"><ImportarExcel /></ProtectedRoute>} />
              <Route path="/modo-auditoria" element={<ProtectedRoute requireModulo="auditorias"><ModoAuditoria /></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute requireAdmin><Configuracion /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
