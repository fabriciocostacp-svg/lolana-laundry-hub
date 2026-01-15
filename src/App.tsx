import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { ClientesPage } from "./pages/ClientesPage";
import { ServicosPage } from "./pages/ServicosPage";
import { PedidosPage } from "./pages/PedidosPage";
import { FuncionariosPage } from "./pages/FuncionariosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/clientes" replace />} />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <ClientesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/servicos"
              element={
                <ProtectedRoute>
                  <ServicosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pedidos"
              element={
                <ProtectedRoute>
                  <PedidosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/funcionarios"
              element={
                <ProtectedRoute>
                  <FuncionariosPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
