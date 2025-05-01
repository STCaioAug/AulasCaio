import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Páginas do administrador
import HomePage from "@/pages/home-page";
import AlunosPage from "@/pages/alunos-page";
import AlunoDetailsPage from "@/pages/aluno-details-page";
import ResponsaveisPage from "@/pages/responsaveis-page";
import CalendarioPage from "@/pages/calendario-page";
import GraficosPage from "@/pages/graficos-page";
import RelatoriosPage from "@/pages/relatorios-page";
import UsuariosPage from "@/pages/usuarios-page";

// Páginas do aluno
import AulasPage from "@/pages/aluno/aulas-page";
import RelatoriosAlunoPage from "@/pages/aluno/relatorios-page";
import HorariosPage from "@/pages/aluno/horarios-page";
import RoteiroPage from "@/pages/aluno/roteiro-page";

import { RoleProtectedRoute } from "./lib/role-protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Rotas do Administrador */}
      <RoleProtectedRoute path="/" component={HomePage} role="admin" />
      <RoleProtectedRoute path="/alunos" component={AlunosPage} role="admin" />
      <RoleProtectedRoute path="/alunos/:id" component={AlunoDetailsPage} role="admin" />
      <RoleProtectedRoute path="/responsaveis" component={ResponsaveisPage} role="admin" />
      <RoleProtectedRoute path="/calendario" component={CalendarioPage} role="admin" />
      <RoleProtectedRoute path="/graficos" component={GraficosPage} role="admin" />
      <RoleProtectedRoute path="/relatorios" component={RelatoriosPage} role="admin" />
      <RoleProtectedRoute path="/usuarios" component={UsuariosPage} role="admin" />
      
      {/* Rotas do Aluno */}
      <RoleProtectedRoute path="/aluno/aulas" component={AulasPage} role="student" />
      <RoleProtectedRoute path="/aluno/relatorios" component={RelatoriosAlunoPage} role="student" />
      <RoleProtectedRoute path="/aluno/horarios" component={HorariosPage} role="student" />
      <RoleProtectedRoute path="/aluno/roteiro" component={RoteiroPage} role="student" />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
