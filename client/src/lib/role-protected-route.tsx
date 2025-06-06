import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type RoleType = "admin" | "student";

export function RoleProtectedRoute({
  path,
  component: Component,
  role,
}: {
  path: string;
  component: () => React.JSX.Element;
  role: RoleType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Verificar se o usuário tem a função correta
  const isAdmin = user.username === "STCaio";
  const userRole: RoleType = isAdmin ? "admin" : "student";

  if (userRole !== role) {
    return (
      <Route path={path}>
        <Redirect to={userRole === "admin" ? "/" : "/aluno/aulas"} />
      </Route>
    );
  }

  return <Component />;
}
