import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ResponsavelTable } from "@/components/responsaveis/responsavel-table";
import { ResponsavelForm } from "@/components/responsaveis/responsavel-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Plus } from "lucide-react";

export default function ResponsaveisPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedResponsavel, setSelectedResponsavel] = useState<any>(null);

  // Buscar responsáveis
  const { data: responsaveis, isLoading } = useQuery({
    queryKey: ["/api/responsaveis"],
  });

  // Filtrar responsáveis com base no termo de busca
  const filteredResponsaveis = React.useMemo(() => {
    if (!responsaveis) return [];
    
    return responsaveis.filter((responsavel: any) => {
      if (!searchTerm) return true;
      
      // Buscar por nome do responsável
      if (responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      
      // Buscar por telefone do responsável
      if (responsavel.telefone.includes(searchTerm)) {
        return true;
      }
      
      // Buscar por nome de aluno associado
      if (responsavel.alunos && responsavel.alunos.some((rel: any) => 
        rel.aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )) {
        return true;
      }
      
      return false;
    });
  }, [responsaveis, searchTerm]);

  // Abrir formulário para edição
  const handleEditResponsavel = (responsavel: any) => {
    setSelectedResponsavel(responsavel);
    setShowForm(true);
  };

  // Abrir formulário para novo responsável
  const handleAddResponsavel = () => {
    setSelectedResponsavel(null);
    setShowForm(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-heading font-semibold text-gray-800">Responsáveis</h2>
          <Button onClick={handleAddResponsavel}>
            <Plus className="h-4 w-4 mr-1" /> Novo Responsável
          </Button>
        </div>

        {/* Busca */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <Input 
              placeholder="Buscar responsáveis..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Responsáveis */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <ResponsavelTable
            responsaveis={filteredResponsaveis}
            onEdit={handleEditResponsavel}
          />
        )}

        {/* Formulário de responsável */}
        <ResponsavelForm
          open={showForm}
          onOpenChange={setShowForm}
          responsavel={selectedResponsavel}
        />
      </div>
    </MainLayout>
  );
}
