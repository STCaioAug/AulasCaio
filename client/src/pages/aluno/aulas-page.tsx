import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout/student-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { formatAnoEscolar, formatStatus } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AulasPage() {
  const { user } = useAuth();
  const [filter, setFilter] = React.useState("proximas");

  // Buscar aulas do aluno logado
  const { data: aulasData, isLoading } = useQuery({
    queryKey: ["/api/aulas/aluno"],
    enabled: !!user?.alunoId
  });

  // Separar aulas por status
  const proximasAulas = React.useMemo(() => {
    if (!aulasData) return [];
    return aulasData
      .filter((aula: any) => aula.status === "agendada" || aula.status === "confirmada")
      .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [aulasData]);

  const aulasPassadas = React.useMemo(() => {
    if (!aulasData) return [];
    return aulasData
      .filter((aula: any) => aula.status === "realizada")
      .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [aulasData]);

  // Estatísticas
  const totalAulas = React.useMemo(() => aulasData?.length || 0, [aulasData]);
  const totalHoras = React.useMemo(() => {
    if (!aulasData) return 0;
    return aulasData.reduce((acc: number, aula: any) => acc + (aula.duracao || 0), 0);
  }, [aulasData]);

  // Agrupar aulas por matéria
  const aulasPorMateria = React.useMemo(() => {
    if (!aulasData) return {};
    return aulasData.reduce((acc: any, aula: any) => {
      const materia = aula.materia?.nome || "Sem matéria";
      if (!acc[materia]) acc[materia] = { count: 0, horas: 0 };
      acc[materia].count++;
      acc[materia].horas += (aula.duracao || 0);
      return acc;
    }, {});
  }, [aulasData]);

  return (
    <StudentLayout title="Minhas Aulas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">Minhas Aulas</h1>
          <Button variant="default">
            <Calendar className="mr-2 h-4 w-4" /> Solicitar aula
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de aulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-primary-600 mr-2" />
                <span className="text-2xl font-bold">{totalAulas}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Horas de estudo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-primary-600 mr-2" />
                <span className="text-2xl font-bold">{totalHoras}h</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Próxima aula</CardTitle>
            </CardHeader>
            <CardContent>
              {proximasAulas.length > 0 ? (
                <div className="flex items-center">
                  <BookOpen className="h-6 w-6 text-primary-600 mr-2" />
                  <div>
                    <span className="font-bold">{proximasAulas[0].materia?.nome || "Aula"}</span>
                    <p className="text-xs text-gray-500">
                      {format(new Date(proximasAulas[0].data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Nenhuma aula agendada</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Aulas</CardTitle>
            <Tabs defaultValue="proximas" className="mt-2">
              <TabsList>
                <TabsTrigger 
                  value="proximas"
                  onClick={() => setFilter("proximas")}
                >
                  Próximas Aulas
                </TabsTrigger>
                <TabsTrigger 
                  value="passadas"
                  onClick={() => setFilter("passadas")}
                >
                  Aulas Passadas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="proximas" className="mt-4">
                {isLoading ? (
                  <div className="p-6 text-center">Carregando...</div>
                ) : proximasAulas.length > 0 ? (
                  <div className="space-y-4">
                    {proximasAulas.map((aula: any) => (
                      <div key={aula.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10 bg-primary-100 text-primary-600">
                              <AvatarFallback>{aula.materia?.nome?.[0] || "A"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{aula.materia?.nome || "Aula"}</h3>
                              <p className="text-sm text-gray-500">
                                {format(new Date(aula.data), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{formatStatus(aula.status)}</Badge>
                                <Badge variant="outline">{aula.duracao}h</Badge>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Button variant="ghost" size="sm">
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    Você não tem aulas agendadas no momento.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="passadas" className="mt-4">
                {isLoading ? (
                  <div className="p-6 text-center">Carregando...</div>
                ) : aulasPassadas.length > 0 ? (
                  <div className="space-y-4">
                    {aulasPassadas.map((aula: any) => (
                      <div key={aula.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10 bg-primary-100 text-primary-600">
                              <AvatarFallback>{aula.materia?.nome?.[0] || "A"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{aula.materia?.nome || "Aula"}</h3>
                              <p className="text-sm text-gray-500">
                                {format(new Date(aula.data), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{formatStatus(aula.status)}</Badge>
                                <Badge variant="outline">{aula.duracao}h</Badge>
                              </div>
                              {aula.conteudo && (
                                <p className="mt-2 text-sm">
                                  <span className="font-medium">Conteúdo:</span> {aula.conteudo}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <Button variant="ghost" size="sm">
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    Você ainda não teve nenhuma aula realizada.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matérias Estudadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(aulasPorMateria).map(([materia, stats]: [string, any]) => (
                <div key={materia} className="p-4 border rounded-lg bg-white">
                  <h3 className="font-medium">{materia}</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Aulas</p>
                      <p className="font-bold">{stats.count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Horas</p>
                      <p className="font-bold">{stats.horas}h</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
