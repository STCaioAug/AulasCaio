import React from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, Calendar, BookOpen, FileText, BookMarked } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md ${active
          ? "bg-primary-100 text-primary-700"
          : "text-gray-700 hover:bg-gray-100"}
        `}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
}

export function StudentSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Menu items do portal do aluno
  const menuItems = [
    {
      href: "/aluno/aulas",
      icon: <BookOpen className="h-5 w-5" />,
      label: "Minhas Aulas",
      active: location === "/aluno/aulas"
    },
    {
      href: "/aluno/relatorios",
      icon: <FileText className="h-5 w-5" />,
      label: "Relatórios",
      active: location === "/aluno/relatorios"
    },
    {
      href: "/aluno/horarios",
      icon: <Calendar className="h-5 w-5" />,
      label: "Horários",
      active: location === "/aluno/horarios"
    },
    {
      href: "/aluno/roteiro",
      icon: <BookMarked className="h-5 w-5" />,
      label: "Roteiro de Estudos",
      active: location === "/aluno/roteiro"
    }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="w-64 border-r h-screen sticky top-0 flex flex-col bg-white">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <GraduationCap className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="font-bold text-lg font-heading">Eleve Estudos</h1>
            <p className="text-xs text-gray-500">Portal do Aluno</p>
          </div>
        </div>

        {/* Perfil do usuário */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar>
            <AvatarFallback className="bg-primary-100 text-primary-700">
              {user?.nome ? getInitials(user.nome) : user?.username?.substring(0, 2).toUpperCase() || "AL"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.nome || user?.username}</p>
            <p className="text-xs text-gray-500">Aluno</p>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Menu de navegação */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <Separator className="mb-4" />
        <Button 
          variant="outline" 
          className="w-full justify-start text-gray-700" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
