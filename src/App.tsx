import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/layout/AppLayout";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipos" element={<Equipos />} />
            <Route path="/equipos/nuevo" element={<EquipoForm />} />
            <Route path="/equipos/:id" element={<EquipoDetalle />} />
            <Route path="/equipos/:id/editar" element={<EquipoForm />} />
            <Route path="/filiales" element={<Filiales />} />
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="/mantenimientos" element={<Mantenimientos />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/auditorias" element={<Auditorias />} />
            <Route path="/auditorias/:id" element={<AuditoriaDetalle />} />
            <Route path="/alertas" element={<Alertas />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
