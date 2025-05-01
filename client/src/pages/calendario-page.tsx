import React from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { CalendarioView } from "@/components/calendario/calendario-view";

export default function CalendarioPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-heading font-semibold text-gray-800">Calendário</h2>
        </div>
        
        <CalendarioView />
      </div>
    </MainLayout>
  );
}
