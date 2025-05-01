import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout/student-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent
} from "@/components/ui/tabs";
import { Calendar, Clock, Download, ArrowUpDown, FileText, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart } from "@/components/graficos/pie-chart";
import { BarChart } from "@/components/graficos/bar-chart";
import { formatStatus, formatCurrency } from "@/lib/utils";

export default function RelatoriosAlunoPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState("aulas");
  
  // Buscar dados do aluno logado
  const { data: alunoData, isLoading } = useQuery({
    queryKey: ["/api/alunos/usuario"],
    enabled: !!user?.alunoId
  });

  // Dados para o gráfico de aulas por matéria
  const dadosAulasPorMateria = React.useMemo(() => {
    if (!alunoData?.aulas || alunoData.aulas.length === 0) return [];
    
    // Agrupar aulas por matéria
    const materias: Record<string, number> = {};
    
    alunoData.aulas.forEach((aula: any) => {
      const nomeMateria = aula.materia?.nome || "Sem matéria";
      materias[nomeMateria] = (materias[nomeMateria] || 0) + 1;
    });
    
    // Converter para o formato do gráfico
    return Object.keys(materias).map(nome => ({
      name: nome,
      value: materias[nome]
    }));
  }, [alunoData?.aulas]);

  // Dados para o gráfico de aulas por mês
  const dadosAulasPorMes = React.useMemo(() => {
    if (!alunoData?.aulas || alunoData.aulas.length === 0) return [];
    
    // Agrupar aulas por mês
    const meses: Record<string, number> = {};
    const nomeMeses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    alunoData.aulas.forEach((aula: any) => {
      const data = new Date(aula.data);
      const mesIndex = data.getMonth();
      const mesNome = nomeMeses[mesIndex];
      meses[mesNome] = (meses[mesNome] || 0) + 1;
    });
    
    // Converter para o formato do gráfico e ordenar por mês
    return Object.keys(meses)
      .map(nome => ({
        mes: nome,
        quantidade: meses[nome]
      }))
      .sort((a, b) => nomeMeses.indexOf(a.mes) - nomeMeses.indexOf(b.mes));
  }, [alunoData?.aulas]);

  // Função para exportar relatório
  const exportarRelatorio = () => {
    // Em uma implementação real, este método geraria um PDF ou CSV
    alert("Relatório exportado com sucesso!");
  };

  // Cores para o gráfico de pizza
  const CORES_GRAFICO = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#8DD1E1'];

  // Calcular estatísticas gerais
  const estatisticas = React.useMemo(() => {
    if (!alunoData?.aulas) return {
      totalAulas: 0,
      totalHoras: 0,
      valorTotal: 0
    };

    const totalAulas = alunoData.aulas.length;
    let totalHoras = 0;
    let valorTotal = 0;

    alunoData.aulas.forEach((aula: any) => {
      totalHoras += aula.duracao || 0;
      valorTotal += aula.valor || 0;
    });

    return {
      totalAulas,
      totalHoras,
      valorTotal
    };
  }, [alunoData?.aulas]);

  return (
    <StudentLayout title="Relatórios">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">Relatórios</h1>
          <Button variant="outline" onClick={exportarRelatorio}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{estatisticas.totalAulas}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Horas de Estudo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{estatisticas.totalHoras}h</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Valor Investido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(estatisticas.valorTotal)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Aulas por Matéria</CardTitle>
              <CardDescription>
                Distribuição das aulas por disciplina
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {dadosAulasPorMateria.length > 0 ? (
                <PieChart 
                  data={dadosAulasPorMateria}
                  title=""
                  nameKey="name"
                  valueKey="value"
                  colors={CORES_GRAFICO}
                  height={300}
                  legend={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aulas por Mês</CardTitle>
              <CardDescription>
                Número de aulas realizadas por mês
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {dadosAulasPorMes.length > 0 ? (
                <BarChart 
                  data={dadosAulasPorMes}
                  title=""
                  xAxisKey="mes"
                  yAxisKey="quantidade"
                  height={300}
                  barName="Aulas"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico de aulas */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Detalhado</CardTitle>
            <CardDescription>
              Todas as aulas realizadas e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="aulas" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="aulas">Aulas</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              </TabsList>

              <TabsContent value="aulas" className="mt-0">
                {isLoading ? (
                  <div className="py-4 text-center">Carregando histórico...</div>
                ) : alunoData?.aulas && alunoData.aulas.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">
                            <Button variant="ghost" size="sm" className="p-0 h-auto font-semibold">
                              <ArrowUpDown className="mr-2 h-3 w-3" />
                              Data
                            </Button>
                          </TableHead>
                          <TableHead>Matéria</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alunoData.aulas
                          .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .map((aula: any) => (
                            <TableRow key={aula.id}>
                              <TableCell className="font-medium">
                                {format(new Date(aula.data), "dd/MM/yyyy HH:mm")}
                              </TableCell>
                              <TableCell>{aula.materia?.nome || "Não especificada"}</TableCell>
                              <TableCell>{aula.duracao}h</TableCell>
                              <TableCell>{formatStatus(aula.status)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(aula.valor)}</TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-300 mb-4" />
                      <p>Nenhuma aula foi registrada ainda</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pagamentos" className="mt-0">
                <div className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-4" />
                    <p>O histórico de pagamentos será implementado em breve</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Total: </span>
              {isLoading ? "Carregando..." : `${estatisticas.totalAulas} aulas, ${estatisticas.totalHoras}h de estudos`}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Detalhes Completos
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Relatório Detalhado</DialogTitle>
                  <DialogDescription>
                    Histórico completo de aulas e pagamentos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                  <div className="space-y-2">
                    <h3 className="font-medium">Resumo</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-gray-500 mb-1">Total de Aulas</div>
                        <div className="text-xl font-semibold">{estatisticas.totalAulas}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-gray-500 mb-1">Horas de Estudo</div>
                        <div className="text-xl font-semibold">{estatisticas.totalHoras}h</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-gray-500 mb-1">Valor Total</div>
                        <div className="text-xl font-semibold">{formatCurrency(estatisticas.valorTotal)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Lista de Aulas</h3>
                    {alunoData?.aulas && alunoData.aulas.length > 0 ? (
                      <div className="space-y-2">
                        {alunoData.aulas
                          .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .map((aula: any) => (
                            <div key={aula.id} className="p-3 bg-gray-50 rounded-md">
                              <div className="flex justify-between">
                                <div>
                                  <div className="font-medium">{aula.materia?.nome || "Aula"}</div>
                                  <div className="text-gray-500 text-sm">
                                    {format(new Date(aula.data), "PPP 'às' HH:mm", { locale: ptBR })}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div>{formatCurrency(aula.valor)}</div>
                                  <div className="text-gray-500 text-sm">
                                    {aula.duracao}h - {formatStatus(aula.status)}
                                  </div>
                                </div>
                              </div>
                              {aula.conteudo && (
                                <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                                  <span className="font-medium">Conteúdo:</span> {aula.conteudo}
                                </div>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="py-6 text-center text-gray-500">
                        Nenhuma aula registrada
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </StudentLayout>
  );
}
