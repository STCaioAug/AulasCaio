import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout/student-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, Calendar as CalendarIcon, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatWeekDay } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Define o tipo de horário disponível
interface HorarioDisponivel {
  id: number;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  disponivel: boolean;
}

// Define o dia da semana por extenso com base no número
function getDiaSemana(diaSemana: number): string {
  const dias = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];
  return dias[diaSemana];
}

// Componente para exibir horários disponíveis
export default function HorariosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedHorario, setSelectedHorario] = React.useState<HorarioDisponivel | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedMateria, setSelectedMateria] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  // Buscar horários disponíveis
  const { data: horarios, isLoading: isLoadingHorarios } = useQuery({
    queryKey: ["/api/horarios-disponiveis"],
    enabled: !!user?.id
  });

  // Buscar aulas agendadas do aluno para desabilitar os horários já escolhidos
  const { data: aulasAgendadas, isLoading: isLoadingAulas } = useQuery({
    queryKey: ["/api/aulas/aluno/agendadas"],
    enabled: !!user?.alunoId
  });

  // Verifica se a data selecionada é válida (pelo menos amanhã)
  const isValidDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  // Lista de matérias disponíveis para agendar
  const materias = [
    { id: 1, nome: "Matemática" },
    { id: 2, nome: "Física" },
    { id: 3, nome: "Química" },
    { id: 4, nome: "Biologia" },
    { id: 5, nome: "História" },
    { id: 6, nome: "Geografia" },
    { id: 7, nome: "Português" },
    { id: 8, nome: "Inglês" },
    { id: 9, nome: "Filosofia" },
    { id: 10, nome: "Sociologia" },
  ];

  // Mutation para agendar uma aula
  const agendarAulaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/aulas", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aulas/aluno/agendadas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/aulas/aluno"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alunos/usuario"] });
      setDialogOpen(false);
      setSelectedHorario(null);
      setSelectedMateria("");
      setSelectedDate(null);
      toast({
        title: "Aula agendada com sucesso!",
        description: "Sua solicitação de aula foi enviada e está aguardando confirmação.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao agendar aula",
        description: error.message || "Ocorreu um erro ao tentar agendar sua aula. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função para agendar aula
  const handleAgendar = () => {
    if (!selectedHorario || !selectedDate || !selectedMateria || !user?.alunoId) {
      toast({
        title: "Dados incompletos",
        description: "Selecione a data, horário e matéria para agendar a aula.",
        variant: "destructive",
      });
      return;
    }

    // Horas e minutos do horário
    const [horaInicio, minutoInicio] = selectedHorario.horaInicio.split(":").map(Number);
    const [horaFim, minutoFim] = selectedHorario.horaFim.split(":").map(Number);
    
    // Data com horário
    const dataAula = new Date(selectedDate);
    dataAula.setHours(horaInicio, minutoInicio, 0, 0);
    
    // Calcular duração
    const inicioMinutos = horaInicio * 60 + minutoInicio;
    const fimMinutos = horaFim * 60 + minutoFim;
    const duracaoHoras = (fimMinutos - inicioMinutos) / 60;
    
    // Dados da aula
    const aulaData = {
      data: dataAula.toISOString(),
      duracao: duracaoHoras,
      alunoId: user.alunoId,
      materiaId: parseInt(selectedMateria),
      status: "agendada",
      valor: 80, // Valor padrão por hora
    };
    
    agendarAulaMutation.mutate(aulaData);
  };

  // Agrupar horários por dia da semana
  const horariosPorDia = React.useMemo(() => {
    if (!horarios || horarios.length === 0) return {};
    
    return horarios.reduce((acc: any, horario: HorarioDisponivel) => {
      const dia = horario.diaSemana;
      if (!acc[dia]) acc[dia] = [];
      acc[dia].push(horario);
      return acc;
    }, {});
  }, [horarios]);

  return (
    <StudentLayout title="Horários Disponíveis">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">Horários Disponíveis</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informações sobre agendamento */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle>Como agendar uma aula</CardTitle>
              <CardDescription>
                Siga os passos abaixo para agendar uma aula com seu professor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center text-center space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-primary-100 p-2 rounded-full text-primary-700">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium">1. Escolha o horário</h3>
                  <p className="text-sm text-gray-500">
                    Selecione um dos horários disponíveis listados abaixo
                  </p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-primary-100 p-2 rounded-full text-primary-700">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium">2. Selecione a data</h3>
                  <p className="text-sm text-gray-500">
                    Escolha um dia disponível no calendário para a aula
                  </p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-primary-100 p-2 rounded-full text-primary-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium">3. Confirme o agendamento</h3>
                  <p className="text-sm text-gray-500">
                    Revise os detalhes e confirme sua aula
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de horários */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Horários Disponíveis</CardTitle>
                <CardDescription>
                  Selecione um dos horários abaixo para agendar sua aula
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHorarios ? (
                  <div className="text-center py-6">Carregando horários disponíveis...</div>
                ) : horarios && horarios.length > 0 ? (
                  <Tabs defaultValue="1" className="w-full">
                    <TabsList className="w-full justify-start overflow-auto">
                      {Object.keys(horariosPorDia).map((dia) => (
                        <TabsTrigger key={dia} value={dia}>
                          {formatWeekDay(parseInt(dia))}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {Object.entries(horariosPorDia).map(([dia, horariosData]: [string, any]) => (
                      <TabsContent key={dia} value={dia} className="space-y-4 mt-4">
                        <div className="grid gap-2">
                          {horariosData.map((horario: HorarioDisponivel) => (
                            <Button
                              key={horario.id}
                              variant={selectedHorario?.id === horario.id ? "default" : "outline"}
                              className="justify-between py-6 h-auto"
                              onClick={() => setSelectedHorario(horario)}
                            >
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>
                                  {horario.horaInicio} - {horario.horaFim}
                                </span>
                              </div>
                              <Badge variant="outline">
                                {Math.round((new Date(`2023-01-01T${horario.horaFim}:00`) - 
                                          new Date(`2023-01-01T${horario.horaInicio}:00`)) / 
                                          (1000 * 60)) / 60}h
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Não há horários disponíveis no momento
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Resumo e confirmção */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Aula</CardTitle>
                <CardDescription>
                  Detalhes do horário selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedHorario ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Dia da Semana</p>
                      <p className="font-medium">{getDiaSemana(selectedHorario.diaSemana)}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Horário</p>
                      <p className="font-medium">{selectedHorario.horaInicio} - {selectedHorario.horaFim}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Duração</p>
                      <p className="font-medium">
                        {Math.round((new Date(`2023-01-01T${selectedHorario.horaFim}:00`) - 
                              new Date(`2023-01-01T${selectedHorario.horaInicio}:00`)) / 
                              (1000 * 60)) / 60} horas
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500">Selecione a Matéria</label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                        value={selectedMateria}
                        onChange={(e) => setSelectedMateria(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {materias.map((materia) => (
                          <option key={materia.id} value={materia.id}>{materia.nome}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500">Selecione a Data</label>
                      <input 
                        type="date" 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          if (isValidDate(date)) {
                            setSelectedDate(date);
                          } else {
                            toast({
                              title: "Data inválida",
                              description: "Selecione uma data futura para o agendamento.",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500 space-y-2">
                    <Clock className="h-10 w-10 mx-auto text-gray-300" />
                    <p>Selecione um horário disponível</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      disabled={!selectedHorario || !selectedMateria || !selectedDate}
                      onClick={() => {
                        if (selectedHorario && selectedMateria && selectedDate) {
                          setDialogOpen(true);
                        }
                      }}
                    >
                      Agendar Aula
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Agendamento</DialogTitle>
                      <DialogDescription>
                        Revise os detalhes da sua aula antes de confirmar
                      </DialogDescription>
                    </DialogHeader>
                    
                    {selectedHorario && selectedDate && (
                      <div className="space-y-4 py-4">
                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                          <div className="bg-primary-100 p-2 rounded-full text-primary-700">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Data e Horário</p>
                            <p className="text-sm text-gray-500">
                              {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}, {selectedHorario.horaInicio} - {selectedHorario.horaFim}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                          <div className="bg-primary-100 p-2 rounded-full text-primary-700">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Matéria</p>
                            <p className="text-sm text-gray-500">
                              {materias.find(m => m.id === parseInt(selectedMateria))?.nome || ""}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                          <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                            <Info className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Informação</p>
                            <p className="text-sm text-gray-500">
                              Após o agendamento, você receberá a confirmação da aula. 
                              Seu professor entrará em contato para confirmar os detalhes e o local da aula.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleAgendar} disabled={agendarAulaMutation.isPending}>
                        {agendarAulaMutation.isPending ? "Confirmando..." : "Confirmar Agendamento"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
