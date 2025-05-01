import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout/student-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Download, FileText, Printer, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatoriosPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Buscar dados do aluno logado
  const { data: alunoData, isLoading } = useQuery({
    queryKey: ["/api/alunos/usuario"],
    enabled: !!user?.alunoId
  });

  // Tipos de relatórios disponíveis
  const tiposRelatorio = [
    {
      id: "resumo_atividades",
      nome: "Resumo de Atividades",
      descricao: "Relatório completo com todas as aulas realizadas e temas estudados"
    },
    {
      id: "progresso_materias",
      nome: "Progresso por Matérias",
      descricao: "Análise detalhada do progresso em cada matéria estudada"
    },
    {
      id: "historico_aulas",
      nome: "Histórico de Aulas",
      descricao: "Listagem de todas as aulas com data, horário e conteúdo estudado"
    }
  ];

  // Função para gerar relatório
  const gerarRelatorio = async (tipoRelatorio: string, formato: string) => {
    try {
      // Simula geração de relatório
      toast({
        title: "Gerando relatório",
        description: `O relatório está sendo gerado em formato ${formato.toUpperCase()}`
      });

      // Em uma implementação real, chamaria a API para gerar o relatório
      // const res = await fetch(`/api/relatorios/${tipoRelatorio}?formato=${formato}&alunoId=${user?.alunoId}`);
      // const blob = await res.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `relatorio_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.${formato}`;
      // a.click();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    }
  };

  return (
    <StudentLayout title="Relatórios">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">Meus Relatórios</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiposRelatorio.map((tipo) => (
            <Card key={tipo.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  {tipo.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{tipo.descricao}</p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => gerarRelatorio(tipo.id, 'pdf')}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => gerarRelatorio(tipo.id, 'png')}
                  >
                    <Image className="h-3.5 w-3.5 mr-1" /> PNG
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Aulas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center p-6">Carregando dados...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Matéria</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(alunoData?.aulas || [])?.length > 0 ? (
                    (alunoData.aulas || []).filter((aula: any) => aula.status === "realizada").map((aula: any) => (
                      <TableRow key={aula.id}>
                        <TableCell>
                          {format(new Date(aula.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{aula.materia?.nome || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{aula.conteudo || "—"}</TableCell>
                        <TableCell>{aula.duracao}h</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => gerarRelatorio(`aula_${aula.id}`, 'pdf')}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">Nenhuma aula realizada encontrada</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
