import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard,
  GraduationCap,
  Calendar,
  BarChart2,
  MoreHorizontal,
  Users,
  FileText,
  X,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
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
    { href: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/alunos", icon: <GraduationCap size={18} />, label: "Alunos" },
    { href: "/calendario", icon: <Calendar size={18} />, label: "Calendário" },
    { href: "/graficos", icon: <BarChart2 size={18} />, label: "Gráficos" },
  ];

  const moreItems = [
    { href: "/responsaveis", icon: <Users size={18} />, label: "Responsáveis" },
    { href: "/relatorios", icon: <FileText size={18} />, label: "Relatórios" },
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
          <h1 className="text-lg font-heading font-semibold text-primary-600">Edu Manager</h1>
        </div>
        <Avatar className="h-8 w-8 bg-primary-600 text-white">
          <AvatarFallback>{user?.nome ? getInitials(user.nome) : 'U'}</AvatarFallback>
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
                    "w-full text-left px-3 py-2 rounded font-medium flex items-center mb-1",
                    location === item.href || location.startsWith(item.href + '/')
                      ? "bg-primary-600 text-white" 
                      : "text-gray-600 bg-white hover:bg-gray-100"
                  )}
                  onClick={closeMenus}
                >
                  <span className="mr-3">{item.icon}</span> {item.label}
                </a>
              </Link>
            ))}
            {moreItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a 
                  className={cn(
                    "w-full text-left px-3 py-2 rounded font-medium flex items-center mb-1",
                    location === item.href || location.startsWith(item.href + '/')
                      ? "bg-primary-600 text-white" 
                      : "text-gray-600 bg-white hover:bg-gray-100"
                  )}
                  onClick={closeMenus}
                >
                  <span className="mr-3">{item.icon}</span> {item.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Barra de navegação inferior para mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-10">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a 
              className={cn(
                "flex flex-col items-center px-2 py-1",
                location === item.href || location.startsWith(item.href + '/')
                  ? "text-primary-600" 
                  : "text-gray-500"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
        <button 
          className={cn(
            "flex flex-col items-center px-2 py-1 text-gray-500",
            moreMenuVisible ? "text-primary-600" : ""
          )}
          onClick={toggleMoreMenu}
        >
          <MoreHorizontal size={18} />
          <span className="text-xs mt-1">Mais</span>
        </button>
      </nav>

      {/* Menu "Mais" para mobile */}
      <div 
        className={cn(
          "md:hidden fixed bottom-16 right-0 bg-white shadow-lg rounded-tl-lg rounded-bl-lg overflow-hidden z-20 transition-transform",
          moreMenuVisible ? "transform translate-x-0" : "transform translate-x-full"
        )}
      >
        <div className="p-2 space-y-1">
          {moreItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={cn(
                  "flex items-center space-x-2 p-2 rounded w-full text-left",
                  location === item.href || location.startsWith(item.href + '/')
                    ? "bg-primary-100 text-primary-600" 
                    : "hover:bg-gray-100 text-gray-600"
                )}
                onClick={() => setMoreMenuVisible(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
