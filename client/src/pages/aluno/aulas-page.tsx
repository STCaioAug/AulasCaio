import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout/student-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen, Bookmark, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatStatus } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart } from "@/components/graficos/bar-chart";

export default function AulasPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState("proximas");
  
  // Buscar os dados do aluno
  const { data: alunoData, isLoading } = useQuery({
    queryKey: ["/api/alunos/usuario"],
    enabled: !!user?.alunoId
  });

  // Aulas próximas (futuras)
  const proximasAulas = React.useMemo(() => {
    if (!alunoData?.aulas) return [];
    
    const dataAtual = new Date();
    return alunoData.aulas.filter(
      (aula: any) => new Date(aula.data) >= dataAtual
    ).sort(
      (a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );
  }, [alunoData?.aulas]);

  // Aulas passadas
  const aulasPassadas = React.useMemo(() => {
    if (!alunoData?.aulas) return [];
    
    const dataAtual = new Date();
    return alunoData.aulas.filter(
      (aula: any) => new Date(aula.data) < dataAtual
    ).sort(
      (a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [alunoData?.aulas]);

  // Dados para os gráficos
  const dadosAulasPorMateria = React.useMemo(() => {
    if (!alunoData?.aulas || alunoData.aulas.length === 0) return [];
    
    // Agrupar aulas por matéria
    const materias: Record<string, number> = alunoData.aulas.reduce((acc: any, aula: any) => {
      const nomeMateria = aula.materia?.nome || "Sem matéria";
      acc[nomeMateria] = (acc[nomeMateria] || 0) + 1;
      return acc;
    }, {});
    
    // Converter para o formato do gráfico
    return Object.keys(materias).map(nome => ({
      materia: nome,
      quantidade: materias[nome]
    })).sort((a, b) => b.quantidade - a.quantidade);
  }, [alunoData?.aulas]);

  return (
    <StudentLayout title="Minhas Aulas">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">Minhas Aulas</h1>
          <Button variant="outline" onClick={() => window.open("/aluno/horarios", "_self")}>
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Aula
          </Button>
        </div>

        {/* Resumo e Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Desempenho por Matéria</CardTitle>
              <CardDescription>
                Quantidade de aulas realizadas por matéria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {dadosAulasPorMateria.length > 0 ? (
                  <BarChart 
                    data={dadosAulasPorMateria}
                    title=""
                    xAxisKey="materia"
                    yAxisKey="quantidade"
                    height={300}
                    barName="Aulas"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados para exibir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>
                Progresso e estatísticas gerais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Total de Aulas</p>
                  <p className="text-2xl font-bold">{alunoData?.aulas?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Próxima Aula</p>
                  {proximasAulas.length > 0 ? (
                    <p className="text-sm font-semibold">
                      {format(new Date(proximasAulas[0].data), "dd/MM • HH:mm")} - {proximasAulas[0].materia?.nome || "Aula"}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Nenhuma aula agendada</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.open("/aluno/horarios", "_self")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Ver horários disponíveis
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lista de aulas */}
        <Card>
          <CardHeader>
            <CardTitle>Aulas</CardTitle>
            <Tabs defaultValue="proximas" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="proximas">Próximas</TabsTrigger>
                <TabsTrigger value="passadas">Passadas</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="proximas" className="mt-0">
              {isLoading ? (
                <div className="py-4 text-center">Carregando aulas...</div>
              ) : proximasAulas.length > 0 ? (
                <div className="space-y-4">
                  {proximasAulas.map((aula: any) => (
                    <Card key={aula.id} className="overflow-hidden">
                      <div className="border-l-4 border-primary-500 pl-4 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <Badge className="mr-2">{aula.materia?.nome || "Aula"}</Badge>
                              <Badge variant="outline">{formatStatus(aula.status)}</Badge>
                            </div>
                            <h3 className="font-semibold mt-2">
                              {format(new Date(aula.data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </h3>
                            <div className="flex items-center text-gray-500 mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {format(new Date(aula.data), "HH:mm")} - {aula.duracao}h
                              </span>
                            </div>
                            {aula.conteudo && (
                              <p className="mt-2 text-gray-600">
                                <span className="font-medium">Conteúdo:</span> {aula.conteudo}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                    <p>Você não tem aulas agendadas</p>
                    <Button 
                      variant="link" 
                      className="mt-2" 
                      onClick={() => window.open("/aluno/horarios", "_self")}
                    >
                      Agendar uma aula agora
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="passadas" className="mt-0">
              {isLoading ? (
                <div className="py-4 text-center">Carregando aulas...</div>
              ) : aulasPassadas.length > 0 ? (
                <div className="space-y-4">
                  {aulasPassadas.map((aula: any) => (
                    <Card key={aula.id} className="overflow-hidden">
                      <div className="border-l-4 border-gray-400 pl-4 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <Badge variant="secondary" className="mr-2">{aula.materia?.nome || "Aula"}</Badge>
                              <Badge variant="outline">{formatStatus(aula.status)}</Badge>
                            </div>
                            <h3 className="font-semibold mt-2">
                              {format(new Date(aula.data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </h3>
                            <div className="flex items-center text-gray-500 mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {format(new Date(aula.data), "HH:mm")} - {aula.duracao}h
                              </span>
                            </div>
                            {aula.conteudo && (
                              <p className="mt-2 text-gray-600">
                                <span className="font-medium">Conteúdo:</span> {aula.conteudo}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                    <p>Você ainda não teve nenhuma aula</p>
                    <Button 
                      variant="link" 
                      className="mt-2" 
                      onClick={() => window.open("/aluno/horarios", "_self")}
                    >
                      Agendar sua primeira aula
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
