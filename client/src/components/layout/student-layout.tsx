import React from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { MobileNav } from "./mobile-nav";
import { useMobile } from "@/hooks/use-mobile";
import { Metadata } from "./metadata";
import { StudentSidebar } from "./student-sidebar";
import { StudentMobileNav } from "./student-mobile-nav";

interface StudentLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function StudentLayout({ children, title = "Portal do Aluno" }: StudentLayoutProps) {
  const { user } = useAuth();
  const isMobile = useMobile();

  return (
    <div className="flex min-h-screen bg-background">
      <Metadata pageTitle={title} />

      {/* Sidebar para desktop */}
      {!isMobile && <StudentSidebar />}

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-x-hidden">
        {/* Navbar para mobile */}
        {isMobile && <StudentMobileNav />}

        <div className="container px-4 md:px-6 py-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
