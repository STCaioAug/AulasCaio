import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  BookOpen,
  FileText,
  Calendar, 
  BookMarked,
  MoreHorizontal,
  X,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export function StudentMobileNav() {
  const [location] = useLocation();
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [mainMenuVisible, setMainMenuVisible] = useState(false);
  const { user } = useAuth();

  const toggleMoreMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMoreMenuVisible(!moreMenuVisible);
  };

  const toggleMainMenu = () => {
    setMainMenuVisible(!mainMenuVisible);
  };

  const closeMenus = () => {
    setMoreMenuVisible(false);
    setMainMenuVisible(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { href: "/aluno/aulas", icon: <BookOpen size={18} />, label: "Minhas Aulas" },
    { href: "/aluno/relatorios", icon: <FileText size={18} />, label: "Relatórios" },
    { href: "/aluno/horarios", icon: <Calendar size={18} />, label: "Horários" },
    { href: "/aluno/roteiro", icon: <BookMarked size={18} />, label: "Roteiro de Estudos" },
  ];

  return (
    <>
      {/* Header para mobile */}
      <header className="md:hidden bg-white shadow-md p-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            className="mr-2 text-gray-600" 
            onClick={toggleMainMenu}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-heading font-semibold text-primary-600">Portal do Aluno</h1>
        </div>
        <Avatar className="h-8 w-8 bg-primary-600 text-white">
          <AvatarFallback>{user?.nome ? getInitials(user.nome) : 'A'}</AvatarFallback>
        </Avatar>
      </header>

      {/* Menu lateral para mobile */}
      <div 
        className={cn(
          "md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-20 transition-opacity",
          mainMenuVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMenus}
      >
        <div 
          className={cn(
            "bg-white w-64 h-full shadow-lg transform transition-transform",
            mainMenuVisible ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-heading font-semibold text-primary-600">Menu</h2>
            <button className="text-gray-600" onClick={closeMenus} aria-label="Fechar menu">
              <X size={20} />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-md",
                    location.startsWith(item.href)
                      ? "bg-primary-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={closeMenus}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 bg-primary-600 text-white">
                <AvatarFallback>{user?.nome ? getInitials(user.nome) : 'A'}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.nome || 'Aluno'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
            </div>
            <Link href="/auth">
              <a
                className="mt-4 flex items-center px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                onClick={() => {
                  closeMenus();
                  localStorage.removeItem('token');
                }}
              >
                <span className="mr-3">Sair</span>
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de navegação inferior para mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10 grid grid-cols-4 items-center">
        {navItems.map((item, index) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex flex-col items-center justify-center py-2 text-xs",
                location.startsWith(item.href)
                  ? "text-primary-600"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
    </>
  );
}
