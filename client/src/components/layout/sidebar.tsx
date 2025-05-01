import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  Calendar, 
  BarChart2, 
  FileText, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start items-center mb-1 hover:bg-gray-100",
          active ? "bg-primary-600 text-white hover:bg-primary-700 hover:text-white" : "text-gray-600 bg-white"
        )}
      >
        <span className="mr-3">{icon}</span> {label}
      </Button>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white shadow-md z-10 h-screen">
      <div className="p-4 border-b flex flex-col items-center">
        <h1 className="text-xl font-heading font-semibold text-primary-600">Eleve Estudos</h1>
        <p className="text-sm text-gray-500">Aulas com Caio A</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <NavItem 
          href="/" 
          icon={<LayoutDashboard size={18} />} 
          label="Dashboard" 
          active={location === '/'} 
        />
        <NavItem 
          href="/alunos" 
          icon={<GraduationCap size={18} />} 
          label="Alunos" 
          active={location.startsWith('/alunos')} 
        />
        <NavItem 
          href="/responsaveis" 
          icon={<Users size={18} />} 
          label="Responsáveis" 
          active={location.startsWith('/responsaveis')} 
        />
        <NavItem 
          href="/calendario" 
          icon={<Calendar size={18} />} 
          label="Calendário" 
          active={location.startsWith('/calendario')} 
        />
        <NavItem 
          href="/graficos" 
          icon={<BarChart2 size={18} />} 
          label="Gráficos" 
          active={location.startsWith('/graficos')} 
        />
        <NavItem 
          href="/relatorios" 
          icon={<FileText size={18} />} 
          label="Relatórios" 
          active={location.startsWith('/relatorios')} 
        />
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 bg-primary-600 text-white">
              <AvatarFallback>{user?.nome ? getInitials(user.nome) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.nome || 'Usuário'}</p>
              <p className="text-xs text-gray-500">{user?.email || ''}</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout} disabled={logoutMutation.isPending}>
                  <LogOut className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}
