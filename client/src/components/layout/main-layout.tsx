import React from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <MobileNav />
      
      <main className="flex-1 p-4 pb-20 md:pb-4 md:pt-4">
        {children}
      </main>
    </div>
  );
}
