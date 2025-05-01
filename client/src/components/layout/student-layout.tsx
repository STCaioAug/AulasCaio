import { Metadata } from "@/components/layout/metadata";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { StudentMobileNav } from "@/components/layout/student-mobile-nav";

interface StudentLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function StudentLayout({ children, title = "Portal do Aluno" }: StudentLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Metadata pageTitle={title} />
      <div className="flex flex-1">
        <StudentSidebar />
        <div className="flex-1 flex flex-col">
          <StudentMobileNav />
          <main className="flex-1 container mx-auto py-6 px-4 md:px-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
