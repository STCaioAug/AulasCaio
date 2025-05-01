import React from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, GraduationCap, LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { StudentSidebar } from "./student-sidebar";

export function StudentMobileNav() {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex items-center justify-between h-16 px-4 border-b bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <img src="/images/logo.png" alt="Eleve Estudos" className="h-8" />
        <p className="text-xs text-gray-500">Portal do Aluno</p>
      </div>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary-100 text-primary-700 text-sm">
            {user?.nome ? getInitials(user.nome) : user?.username?.substring(0, 2).toUpperCase() || "AL"}
          </AvatarFallback>
        </Avatar>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <StudentSidebar />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
