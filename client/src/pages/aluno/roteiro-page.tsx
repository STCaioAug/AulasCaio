import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout/student-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { BookMarked, Calendar, PlusCircle, Check, CheckCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart } from "@/components/graficos/pie-chart";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function RoteiroPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("pendentes");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    tema: "",
    materiaId: "",
    dataDaProva: "",
    descricao: "",
    dificuldade: "media"
  });

  // Buscar dados do aluno
  const { data: alunoData, isLoading: isLoadingAluno } = useQuery({
    queryKey: ["/api/alunos/usuario"],
    enabled: !!user?.alunoId
  });

  // Mutation para adicionar um novo tema de estudo
  const adicionarTemaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/temas", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos/usuario"] });
      setDialogOpen(false);
      setFormData({
        tema: "",
        materiaId: "",
        dataDaProva: "",
        descricao: "",
        dificuldade: "media"
      });
      toast({
        title: "Tema adicionado",
        description: "O tema de estudo foi adicionado com sucesso ao seu roteiro.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar tema",
        description: error.message || "Ocorreu um erro ao tentar adicionar o tema. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para marcar um tema como estudado
  const marcarEstudadoMutation = useMutation({
    mutationFn: async (temaId: number) => {
      const res = await apiRequest("PATCH", `/api/temas/${temaId}/estudado`, { estudado: true });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos/usuario"] });
      toast({
        title: "Tema concluído",
        description: "Parabéns! O tema foi marcado como estudado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar tema",
        description: error.message || "Ocorreu um erro ao marcar o tema como estudado.",
        variant: "destructive",
      });
    },
  });

  // Lista de matérias disponíveis
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

  // Níveis de dificuldade
  const niveisDificuldade = [
    { value: "facil", label: "Fácil" },
    { value: "media", label: "Média" },
    { value: "dificil", label: "Difícil" },
  ];

  // Função para adicionar um novo tema
  const handleAdicionarTema = () => {
    if (!formData.tema || !formData.materiaId) {
      toast({
        title: "Dados incompletos",
        description: "Preencha pelo menos o tema e a matéria.",
        variant: "destructive",
      });
      return;
    }

    const temaData = {
      titulo: formData.tema,
      materiaId: parseInt(formData.materiaId),
      alunoId: user?.alunoId,
      dificuldade: formData.dificuldade,
      dataDaProva: formData.dataDaProva ? new Date(formData.dataDaProva).toISOString() : null,
      descricao: formData.descricao || null,
      estudado: false
    };

    adicionarTemaMutation.mutate(temaData);
  };

  // Função para marcar um tema como estudado
  const handleMarcarEstudado = (temaId: number) => {
    marcarEstudadoMutation.mutate(temaId);
  };

  // Filtrar temas pendentes e concluídos
  const temasPendentes = React.useMemo(() => {
    if (!alunoData?.temas) return [];
    return alunoData.temas.filter((tema: any) => !tema.estudado);
  }, [alunoData?.temas]);

  const temasConcluidos = React.useMemo(() => {
    if (!alunoData?.temas) return [];
    return alunoData.temas.filter((tema: any) => tema.estudado);
  }, [alunoData?.temas]);

  // Formatar data
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "Não informada";
    return format(new Date(dataString), "dd/MM/yyyy");
  };

  // Dados para o gráfico de matérias
  const dadosMateriasChart = React.useMemo(() => {
    if (!alunoData?.temas || alunoData.temas.length === 0) return [];
    
    const materiaCount: Record<string, { total: number, estudados: number }> = {};
    
    alunoData.temas.forEach((tema: any) => {
      const nomeMateria = tema.materia?.nome || "Sem matéria";
      if (!materiaCount[nomeMateria]) {
        materiaCount[nomeMateria] = { total: 0, estudados: 0 };
      }
      materiaCount[nomeMateria].total += 1;
      if (tema.estudado) {
        materiaCount[nomeMateria].estudados += 1;
      }
    });
    
    return Object.entries(materiaCount).map(([nome, { total, estudados }]) => ({
      name: nome,
      value: total
    }));
  }, [alunoData?.temas]);

  // Dados para gráfico de progresso
  const dadosProgressoChart = React.useMemo(() => {
    if (!alunoData?.temas || alunoData.temas.length === 0) {
      return [];
    }
    
    const total = alunoData.temas.length;
    const estudados = alunoData.temas.filter((tema: any) => tema.estudado).length;
    const pendentes = total - estudados;
    
    return [
      { name: "Estudados", value: estudados },
      { name: "Pendentes", value: pendentes }
    ];
  }, [alunoData?.temas]);

  // Cores para o gráfico de pizza
  const CORES_GRAFICO = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#8DD1E1'];
  const CORES_PROGRESSO = ['#4CAF50', '#FF9800'];

  return (
    <StudentLayout title="Roteiro de Estudos">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">Roteiro de Estudos</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Tema
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Tema de Estudo</DialogTitle>
                <DialogDescription>
                  Adicione um novo tema para seu roteiro de estudos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tema</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="Ex: Equações do 2º grau"
                    value={formData.tema}
                    onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Matéria</label>
                  <select
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={formData.materiaId}
                    onChange={(e) => setFormData({ ...formData, materiaId: e.target.value })}
                  >
                    <option value="">Selecione uma matéria</option>
                    {materias.map((materia) => (
                      <option key={materia.id} value={materia.id}>
                        {materia.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data da Prova (opcional)</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={formData.dataDaProva}
                    onChange={(e) => setFormData({ ...formData, dataDaProva: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição (opcional)</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 p-2"
                    rows={3}
                    placeholder="Detalhes sobre o tema ou tópicos a estudar"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nível de Dificuldade</label>
                  <select
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={formData.dificuldade}
                    onChange={(e) => setFormData({ ...formData, dificuldade: e.target.value })}
                  >
                    {niveisDificuldade.map((nivel) => (
                      <option key={nivel.value} value={nivel.value}>
                        {nivel.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdicionarTema} disabled={adicionarTemaMutation.isPending}>
                  {adicionarTemaMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Gráficos e Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Progresso de Estudos</CardTitle>
              <CardDescription>
                Status atual do seu roteiro
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {dadosProgressoChart.length > 0 ? (
                <PieChart 
                  data={dadosProgressoChart} 
                  title=""
                  nameKey="name"
                  valueKey="value"
                  colors={CORES_PROGRESSO}
                  height={300}
                  legend={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BookMarked className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>Nenhum tema adicionado</p>
                    <Button 
                      variant="link" 
                      onClick={() => setDialogOpen(true)}
                      className="mt-2"
                    >
                      Adicionar seu primeiro tema
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Matéria</CardTitle>
              <CardDescription>
                Temas por disciplina
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {dadosMateriasChart.length > 0 ? (
                <PieChart 
                  data={dadosMateriasChart} 
                  title=""
                  nameKey="name"
                  valueKey="value"
                  colors={CORES_GRAFICO}
                  height={300}
                  legend={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>Nenhum tema adicionado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Temas */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Temas de Estudo</CardTitle>
            <Tabs defaultValue="pendentes" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="pendentes" className="mt-0">
              {isLoadingAluno ? (
                <div className="text-center py-6">Carregando temas...</div>
              ) : temasPendentes.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tema</TableHead>
                        <TableHead>Matéria</TableHead>
                        <TableHead>Data da Prova</TableHead>
                        <TableHead>Dificuldade</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {temasPendentes.map((tema: any) => (
                        <TableRow key={tema.id}>
                          <TableCell className="font-medium">{tema.titulo}</TableCell>
                          <TableCell>{tema.materia?.nome || "Não especificada"}</TableCell>
                          <TableCell>{formatarData(tema.dataDaProva)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={tema.dificuldade === "dificil" ? "destructive" : 
                                     tema.dificuldade === "facil" ? "outline" : "secondary"}
                            >
                              {tema.dificuldade === "facil" ? "Fácil" : 
                               tema.dificuldade === "media" ? "Médio" : "Difícil"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleMarcarEstudado(tema.id)}
                              className="hover:bg-green-100 text-green-600"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" /> 
                              Concluir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookMarked className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Você não possui temas pendentes de estudo</p>
                  <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                    Adicionar um novo tema de estudo
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="concluidos" className="mt-0">
              {isLoadingAluno ? (
                <div className="text-center py-6">Carregando temas...</div>
              ) : temasConcluidos.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tema</TableHead>
                        <TableHead>Matéria</TableHead>
                        <TableHead>Data da Prova</TableHead>
                        <TableHead>Dificuldade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {temasConcluidos.map((tema: any) => (
                        <TableRow key={tema.id}>
                          <TableCell className="font-medium">{tema.titulo}</TableCell>
                          <TableCell>{tema.materia?.nome || "Não especificada"}</TableCell>
                          <TableCell>{formatarData(tema.dataDaProva)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={tema.dificuldade === "dificil" ? "destructive" : 
                                     tema.dificuldade === "facil" ? "outline" : "secondary"}
                            >
                              {tema.dificuldade === "facil" ? "Fácil" : 
                               tema.dificuldade === "media" ? "Médio" : "Difícil"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                              <Check className="mr-1 h-3 w-3" /> Concluído
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Check className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Você ainda não concluiu nenhum tema de estudo</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
