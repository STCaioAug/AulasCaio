import React from "react";
import { useParams } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { AlunoDetails } from "@/components/alunos/aluno-details";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AlunoDetailsPage() {
  // Obter o ID do aluno da URL
  const params = useParams<{ id: string }>();
  const alunoId = params.id;

  // Verificar se o aluno existe
  const { data: aluno, isLoading, error } = useQuery({
    queryKey: [`/api/alunos/${alunoId}`],
  });

  return (
    <MainLayout>
      {/* Botão de volta */}
      <Link href="/alunos">
        <Button variant="ghost" className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para a lista de alunos
        </Button>
      </Link>

      {/* Exibir estado de carregamento */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Exibir mensagem de erro, se ocorrer */}
      {error && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-500">Erro ao carregar os dados do aluno.</p>
          <p className="text-gray-500 mt-2">{(error as Error).message}</p>
        </div>
      )}

      {/* Exibir detalhes do aluno */}
      {!isLoading && !error && alunoId && (
        <AlunoDetails alunoId={alunoId} />
      )}
    </MainLayout>
  );
}
