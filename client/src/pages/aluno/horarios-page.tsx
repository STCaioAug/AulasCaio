import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout/student-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type HorarioDisponivel = {
  id: number;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  disponivel: boolean;
};

const diasSemana = [
  { numero: 1, abreviacao: "Seg", nome: "Segunda-feira" },
  { numero: 2, abreviacao: "Ter", nome: "Terça-feira" },
  { numero: 3, abreviacao: "Qua", nome: "Quarta-feira" },
  { numero: 4, abreviacao: "Qui", nome: "Quinta-feira" },
  { numero: 5, abreviacao: "Sex", nome: "Sexta-feira" },
  { numero: 6, abreviacao: "Sáb", nome: "Sábado" },
];

function DiaSemanaLabel({ diaSemana }: { diaSemana: number }) {
  const dia = diasSemana.find(d => d.numero === diaSemana);
  return <span>{dia?.nome || "Dia desconhecido"}</span>;
}

export default function HorariosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("disponiveis");

  // Buscar horários disponíveis
  const { data: horariosDisponiveis, isLoading } = useQuery({
    queryKey: ["/api/horarios-disponiveis"],
  });

  // Buscar aulas agendadas do aluno
  const { data: aulasAgendadas, isLoading: carregandoAulas } = useQuery({
    queryKey: ["/api/aulas/aluno/agendadas"],
    enabled: !!user?.alunoId
  });

  // Organizar horários por dia da semana
  const horariosPorDia = React.useMemo(() => {
    if (!horariosDisponiveis) return [];
    
    return diasSemana.map(dia => {
      const horariosDoDia = horariosDisponiveis.filter(
        (h: HorarioDisponivel) => h.diaSemana === dia.numero
      );
      
      return {
        dia,
        horarios: horariosDoDia.sort((a: HorarioDisponivel, b: HorarioDisponivel) => 
          a.horaInicio.localeCompare(b.horaInicio)
        )
      };
    }).filter(d => d.horarios.length > 0);
  }, [horariosDisponiveis]);

  // Função para solicitar agendamento
  const solicitarAgendamento = (horario: HorarioDisponivel) => {
    toast({
      title: "Solicitação enviada",
      description: `Horário solicitado para ${diasSemana.find(d => d.numero === horario.diaSemana)?.nome} às ${horario.horaInicio}`
    });
  };

  return (
    <StudentLayout title="Horários">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">Horários</h1>
        </div>

        <Tabs defaultValue="disponiveis" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="disponiveis">Horários Disponíveis</TabsTrigger>
            <TabsTrigger value="agendados">Aulas Agendadas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="disponiveis">
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    Carregando horários disponíveis...
                  </CardContent>
                </Card>
              ) : horariosPorDia.length > 0 ? (
                horariosPorDia.map(({ dia, horarios }) => (
                  <Card key={dia.numero}>
                    <CardHeader>
                      <CardTitle className="text-lg">{dia.nome}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {horarios.map((horario: HorarioDisponivel) => (
                          <div 
                            key={horario.id} 
                            className="p-4 border rounded-lg flex justify-between items-center hover:border-primary-600 transition-colors"
                          >
                            <div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-primary-600 mr-2" />
                                <span className="font-medium">{horario.horaInicio} - {horario.horaFim}</span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className="mt-2 bg-green-50 text-green-700 border-green-200"
                              >
                                Disponível
                              </Badge>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => solicitarAgendamento(horario)}
                            >
                              Solicitar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-gray-500">
                    Não há horários disponíveis no momento.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="agendados">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Aulas Agendadas</CardTitle>
              </CardHeader>
              <CardContent>
                {carregandoAulas ? (
                  <div className="py-6 text-center">Carregando aulas agendadas...</div>
                ) : aulasAgendadas && aulasAgendadas.length > 0 ? (
                  <div className="space-y-4">
                    {aulasAgendadas.map((aula: any) => (
                      <div 
                        key={aula.id} 
                        className="p-4 border rounded-lg flex justify-between items-start"
                      >
                        <div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-primary-600 mr-2" />
                            <span className="font-medium">
                              {format(new Date(aula.data), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-700">
                              {format(new Date(aula.data), "HH:mm", { locale: ptBR })} - 
                              {format(new Date(new Date(aula.data).getTime() + aula.duracao * 60 * 60 * 1000), "HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Badge variant="outline">{aula.materia?.nome || "Aula"}</Badge>
                            <Badge 
                              variant="outline" 
                              className="ml-2 bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {aula.status === "agendada" ? "Agendada" : "Confirmada"}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Detalhes
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    Você não tem aulas agendadas no momento.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
