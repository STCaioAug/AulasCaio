import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { AlunoCard, AlunoCardProps } from "@/components/alunos/aluno-card";
import { AlunoForm } from "@/components/alunos/aluno-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Plus } from "lucide-react";
import { formatAnoEscolar } from "@/lib/utils";

export default function AlunosPage() {
  const [showForm, setShowForm] = useState(false);
  const [anoEscolarFilter, setAnoEscolarFilter] = useState<string>("todos");
  const [materiaFilter, setMateriaFilter] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Buscar alunos
  const { data: alunos, isLoading } = useQuery({
    queryKey: ["/api/alunos"],
  });

  // Buscar matérias para filtro
  const { data: materias } = useQuery({
    queryKey: ["/api/materias"],
  });

  // Processar alunos para o formato do card
  const processedAlunos: AlunoCardProps[] = React.useMemo(() => {
    if (!alunos) return [];

    return alunos.map((aluno: any) => {
      // Contar aulas deste mês
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Processar matérias do aluno (com base nas aulas)
      const materiaNames = new Set<string>();
      if (aluno.aulas) {
        aluno.aulas.forEach((aula: any) => {
          if (aula.materia?.nome) {
            materiaNames.add(aula.materia.nome);
          }
        });
      }
      
      // Processar temas do aluno (para matérias)
      if (aluno.temas) {
        aluno.temas.forEach((tema: any) => {
          if (tema.materia?.nome) {
            materiaNames.add(tema.materia.nome);
          }
        });
      }
      
      // Contar aulas deste mês
      let aulasEsteMes = 0;
      if (aluno.aulas) {
        aulasEsteMes = aluno.aulas.filter((aula: any) => {
          const aulaDate = new Date(aula.data);
          return aulaDate >= firstDayOfMonth;
        }).length;
      }
      
      return {
        id: aluno.id,
        nome: aluno.nome,
        anoEscolar: aluno.anoEscolar,
        materias: Array.from(materiaNames),
        totalAulas: aulasEsteMes
      };
    });
  }, [alunos]);

  // Filtrar alunos com base nos filtros selecionados
  const filteredAlunos = React.useMemo(() => {
    if (!processedAlunos) return [];
    
    return processedAlunos.filter((aluno) => {
      // Filtrar por ano escolar
      if (anoEscolarFilter !== "todos" && aluno.anoEscolar !== anoEscolarFilter) {
        return false;
      }
      
      // Filtrar por matéria
      if (materiaFilter !== "todas" && !aluno.materias?.includes(materiaFilter)) {
        return false;
      }
      
      // Filtrar por termo de busca
      if (searchTerm && !aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [processedAlunos, anoEscolarFilter, materiaFilter, searchTerm]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-heading font-semibold text-gray-800">Alunos</h2>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Aluno
          </Button>
        </div>

        {/* Busca e Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
                <Input 
                  placeholder="Buscar alunos..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Select 
                value={anoEscolarFilter} 
                onValueChange={setAnoEscolarFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ano Escolar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  <SelectItem value="6_ano">6º Ano</SelectItem>
                  <SelectItem value="7_ano">7º Ano</SelectItem>
                  <SelectItem value="8_ano">8º Ano</SelectItem>
                  <SelectItem value="9_ano">9º Ano</SelectItem>
                  <SelectItem value="1_em">1º EM</SelectItem>
                  <SelectItem value="2_em">2º EM</SelectItem>
                  <SelectItem value="3_em">3º EM</SelectItem>
                  <SelectItem value="superior">Superior</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={materiaFilter} 
                onValueChange={setMateriaFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Matéria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as matérias</SelectItem>
                  {materias && materias.map((materia: any) => (
                    <SelectItem key={materia.id} value={materia.nome}>
                      {materia.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de Alunos */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredAlunos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Nenhum aluno encontrado com os filtros selecionados.</p>
            {(anoEscolarFilter !== "todos" || materiaFilter !== "todas" || searchTerm) && (
              <Button 
                variant="link" 
                onClick={() => {
                  setAnoEscolarFilter("todos");
                  setMateriaFilter("todas");
                  setSearchTerm("");
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlunos.map((aluno) => (
              <AlunoCard
                key={aluno.id}
                id={aluno.id}
                nome={aluno.nome}
                anoEscolar={aluno.anoEscolar}
                materias={aluno.materias}
                totalAulas={aluno.totalAulas}
              />
            ))}
          </div>
        )}

        {/* Formulário de novo aluno */}
        <AlunoForm
          open={showForm}
          onOpenChange={setShowForm}
        />
      </div>
    </MainLayout>
  );
}
