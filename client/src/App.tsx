import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import AlunosPage from "@/pages/alunos-page";
import AlunoDetailsPage from "@/pages/aluno-details-page";
import ResponsaveisPage from "@/pages/responsaveis-page";
import CalendarioPage from "@/pages/calendario-page";
import GraficosPage from "@/pages/graficos-page";
import RelatoriosPage from "@/pages/relatorios-page";
import UsuariosPage from "@/pages/usuarios-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/alunos" component={AlunosPage} />
      <ProtectedRoute path="/alunos/:id" component={AlunoDetailsPage} />
      <ProtectedRoute path="/responsaveis" component={ResponsaveisPage} />
      <ProtectedRoute path="/calendario" component={CalendarioPage} />
      <ProtectedRoute path="/graficos" component={GraficosPage} />
      <ProtectedRoute path="/relatorios" component={RelatoriosPage} />
      <ProtectedRoute path="/usuarios" component={UsuariosPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
