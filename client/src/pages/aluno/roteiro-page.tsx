import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout/student-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calendar, Clock, BookMarked, BookOpen, PlusCircle, CheckCircle, XCircle, CalendarDays, BarChart } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDificuldade } from "@/lib/utils";

// Schema para formulário de tema de estudo
const temaFormSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  materiaId: z.string({ required_error: "Selecione uma matéria" }),
  dificuldade: z.string({ required_error: "Selecione a dificuldade" }),
  dataProva: z.string().optional(),
  observacoes: z.string().optional(),
});

type TemaFormValues = z.infer<typeof temaFormSchema>;

// Schema para formulário de horas de estudo
const horasEstudoFormSchema = z.object({
  data: z.string({ required_error: "Informe a data" }),
  duracao: z.string({ required_error: "Informe a duração" }),
  temaId: z.string({ required_error: "Selecione um tema" }),
  descricao: z.string().optional(),
});

type HorasEstudoFormValues = z.infer<typeof horasEstudoFormSchema>;

export default function RoteiroPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [temaDialogOpen, setTemaDialogOpen] = React.useState(false);
  const [horasDialogOpen, setHorasDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("temas");

  // Buscar dados do aluno logado
  const { data: alunoData, isLoading } = useQuery({
    queryKey: ["/api/alunos/usuario"],
    enabled: !!user?.alunoId
  });

  // Buscar matérias disponíveis
  const { data: materias } = useQuery({
    queryKey: ["/api/materias"],
  });

  // Formulário para criar tema de estudo
  const temaForm = useForm<TemaFormValues>({
    resolver: zodResolver(temaFormSchema),
    defaultValues: {
      nome: "",
      materiaId: "",
      dificuldade: "medio",
      dataProva: "",
      observacoes: "",
    },
  });

  // Formulário para registrar horas de estudo
  const horasForm = useForm<HorasEstudoFormValues>({
    resolver: zodResolver(horasEstudoFormSchema),
    defaultValues: {
      data: format(new Date(), "yyyy-MM-dd"),
      duracao: "1",
      temaId: "",
      descricao: "",
    },
  });

  // Mutação para criar tema
  const createTemaMutation = useMutation({
    mutationFn: async (data: TemaFormValues) => {
      const res = await apiRequest("POST", "/api/temas", {
        ...data,
        alunoId: user?.alunoId,
        estudado: false,
        materiaId: parseInt(data.materiaId),
        dataProva: data.dataProva ? new Date(data.dataProva).toISOString() : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Tema cadastrado",
        description: "O tema de estudo foi adicionado com sucesso"
      });
      setTemaDialogOpen(false);
      temaForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/alunos/usuario"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível cadastrar o tema: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutação para registrar horas de estudo
  const registrarHorasMutation = useMutation({
    mutationFn: async (data: HorasEstudoFormValues) => {
      // Em uma implementação real, salvaria no banco de dados
      // Aqui vamos apenas simular o sucesso
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Horas registradas",
        description: "As horas de estudo foram registradas com sucesso"
      });
      setHorasDialogOpen(false);
      horasForm.reset({
        data: format(new Date(), "yyyy-MM-dd"),
        duracao: "1",
        temaId: "",
        descricao: "",
      });
      // Em uma implementação real, invalidaria as queries
      // queryClient.invalidateQueries({ queryKey: ["/api/alunos/usuario"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível registrar as horas: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutação para marcar tema como estudado
  const updateTemaMutation = useMutation({
    mutationFn: async (data: { id: number, estudado: boolean }) => {
      const res = await apiRequest("PUT", `/api/temas/${data.id}`, { estudado: data.estudado });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos/usuario"] });
      toast({
        title: "Tema atualizado",
        description: "O status do tema foi atualizado com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o tema: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Submissão do formulário de tema
  const onSubmitTema = (data: TemaFormValues) => {
    createTemaMutation.mutate(data);
  };

  // Submissão do formulário de horas
  const onSubmitHoras = (data: HorasEstudoFormValues) => {
    registrarHorasMutation.mutate(data);
  };

  // Dados para gráficos
  const horasEstudoPorDia = [
    { name: "Dom", horas: 0 },
    { name: "Seg", horas: 2 },
    { name: "Ter", horas: 1.5 },
    { name: "Qua", horas: 3 },
    { name: "Qui", horas: 2 },
    { name: "Sex", horas: 1 },
    { name: "Sáb", horas: 0.5 },
  ];

  const horasEstudoPorMateria = [
    { name: "Matemática", value: 8 },
    { name: "Física", value: 5 },
    { name: "Química", value: 4 },
    { name: "Biologia", value: 3 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Filtragem de temas
  const temasAtivos = React.useMemo(() => {
    if (!alunoData?.temas) return [];
    return alunoData.temas.filter((tema: any) => !tema.estudado);
  }, [alunoData?.temas]);

  const temasEstudados = React.useMemo(() => {
    if (!alunoData?.temas) return [];
    return alunoData.temas.filter((tema: any) => tema.estudado);
  }, [alunoData?.temas]);

  // Temas com provas próximas
  const temasComProvas = React.useMemo(() => {
    if (!alunoData?.temas) return [];
    const hoje = new Date();
    return alunoData.temas
      .filter((tema: any) => tema.dataProva && new Date(tema.dataProva) > hoje)
      .sort((a: any, b: any) => new Date(a.dataProva).getTime() - new Date(b.dataProva).getTime());
  }, [alunoData?.temas]);

  return (
    <StudentLayout title="Roteiro de Estudos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">Roteiro de Estudos</h1>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setHorasDialogOpen(true)}
            >
              <Clock className="mr-2 h-4 w-4" /> Registrar horas
            </Button>
            <Button 
              onClick={() => setTemaDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Novo tema
            </Button>
          </div>
        </div>

        {temasComProvas.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Provas Próximas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {temasComProvas.slice(0, 3).map((tema: any) => (
                  <div key={tema.id} className="flex justify-between items-center p-2 bg-white rounded border border-orange-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                        {format(new Date(tema.dataProva), "dd/MM/yyyy")}
                      </Badge>
                      <span className="font-medium">{tema.nome}</span>
                    </div>
                    <Badge variant="outline">{tema.materia?.nome || "Matéria"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Horas de Estudo na Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={horasEstudoPorDia}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} horas`, 'Tempo de estudo']} />
                    <Bar dataKey="horas" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Matéria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={horasEstudoPorMateria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {horasEstudoPorMateria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} horas`, 'Tempo de estudo']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meus Temas de Estudo</CardTitle>
            <Tabs defaultValue="temas" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="temas">Temas Pendentes</TabsTrigger>
                <TabsTrigger value="estudados">Temas Estudados</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Carregando temas de estudo...</div>
            ) : (
              <TabsContent value="temas" className="mt-0">
                {temasAtivos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tema</TableHead>
                        <TableHead>Matéria</TableHead>
                        <TableHead>Dificuldade</TableHead>
                        <TableHead>Data da Prova</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {temasAtivos.map((tema: any) => (
                        <TableRow key={tema.id}>
                          <TableCell className="font-medium">{tema.nome}</TableCell>
                          <TableCell>{tema.materia?.nome || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatDificuldade(tema.dificuldade)}</Badge>
                          </TableCell>
                          <TableCell>
                            {tema.dataProva ? format(new Date(tema.dataProva), "dd/MM/yyyy") : "—"}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateTemaMutation.mutate({ id: tema.id, estudado: true })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Concluído
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Você não tem temas de estudo pendentes.
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="estudados" className="mt-0">
              {isLoading ? (
                <div className="text-center py-4">Carregando temas estudados...</div>
              ) : temasEstudados.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tema</TableHead>
                      <TableHead>Matéria</TableHead>
                      <TableHead>Dificuldade</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {temasEstudados.map((tema: any) => (
                      <TableRow key={tema.id}>
                        <TableCell className="font-medium">{tema.nome}</TableCell>
                        <TableCell>{tema.materia?.nome || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatDificuldade(tema.dificuldade)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateTemaMutation.mutate({ id: tema.id, estudado: false })}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reabrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Você ainda não concluiu nenhum tema de estudo.
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para criar novo tema */}
      <Dialog open={temaDialogOpen} onOpenChange={setTemaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tema de Estudo</DialogTitle>
            <DialogDescription>
              Adicione um novo tema ou conteúdo para estudar
            </DialogDescription>
          </DialogHeader>

          <Form {...temaForm}>
            <form onSubmit={temaForm.handleSubmit(onSubmitTema)} className="space-y-4">
              <FormField
                control={temaForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do tema</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Funções do segundo grau" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={temaForm.control}
                name="materiaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matéria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma matéria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materias?.map((materia: any) => (
                          <SelectItem key={materia.id} value={materia.id.toString()}>
                            {materia.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={temaForm.control}
                name="dificuldade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dificuldade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a dificuldade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={temaForm.control}
                name="dataProva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da prova (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Se este tema for para uma prova, informe a data
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={temaForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setTemaDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createTemaMutation.isPending}
                >
                  {createTemaMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para registrar horas de estudo */}
      <Dialog open={horasDialogOpen} onOpenChange={setHorasDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Horas de Estudo</DialogTitle>
            <DialogDescription>
              Registre o tempo que você dedicou ao estudo
            </DialogDescription>
          </DialogHeader>

          <Form {...horasForm}>
            <form onSubmit={horasForm.handleSubmit(onSubmitHoras)} className="space-y-4">
              <FormField
                control={horasForm.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={horasForm.control}
                name="duracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (horas)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0.5">30 minutos</SelectItem>
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="1.5">1 hora e meia</SelectItem>
                        <SelectItem value="2">2 horas</SelectItem>
                        <SelectItem value="2.5">2 horas e meia</SelectItem>
                        <SelectItem value="3">3 horas</SelectItem>
                        <SelectItem value="4">4 horas</SelectItem>
                        <SelectItem value="5">5 horas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={horasForm.control}
                name="temaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tema estudado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {temasAtivos.map((tema: any) => (
                          <SelectItem key={tema.id} value={tema.id.toString()}>
                            {tema.nome} ({tema.materia?.nome || "Sem matéria"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={horasForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="O que você estudou?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setHorasDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={registrarHorasMutation.isPending}
                >
                  {registrarHorasMutation.isPending ? "Registrando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
