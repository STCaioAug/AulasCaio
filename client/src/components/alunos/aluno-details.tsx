import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  CalendarIcon, 
  FileText, 
  Download, 
  Printer, 
  MessageSquare,
  PenSquare,
  Trash2,
  CheckCircle,
  User,
  Key,
  Shield,
  Copy,
  RefreshCw,
  Image
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlunoForm } from "./aluno-form";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface AlunoDetailsProps {
  alunoId: string;
}

// Formatação de ano escolar para exibição
const formatAnoEscolar = (anoEscolar: string) => {
  switch (anoEscolar) {
    case '6_ano': return '6º Ano';
    case '7_ano': return '7º Ano';
    case '8_ano': return '8º Ano';
    case '9_ano': return '9º Ano';
    case '1_em': return '1º EM';
    case '2_em': return '2º EM';
    case '3_em': return '3º EM';
    case 'superior': return 'Ensino Superior';
    default: return anoEscolar;
  }
};

// Formatação de dificuldade para exibição
const formatDificuldade = (dificuldade: string) => {
  switch (dificuldade) {
    case 'facil': return 'Fácil';
    case 'medio': return 'Médio';
    case 'dificil': return 'Difícil';
    default: return dificuldade;
  }
};

// Formatação de status de aula para exibição
const formatStatus = (status: string) => {
  switch (status) {
    case 'agendada': return 'Agendada';
    case 'confirmada': return 'Confirmada';
    case 'cancelada': return 'Cancelada';
    case 'realizada': return 'Realizada';
    default: return status;
  }
};

// Componente para cor do status
const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    agendada: { bg: "bg-blue-100", text: "text-blue-800" },
    confirmada: { bg: "bg-green-100", text: "text-green-800" },
    cancelada: { bg: "bg-red-100", text: "text-red-800" },
    realizada: { bg: "bg-purple-100", text: "text-purple-800" },
  };

  const colors = colorMap[status] || { bg: "bg-gray-100", text: "text-gray-800" };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {formatStatus(status)}
    </span>
  );
};

// Componente para buscar e exibir informações do usuário associado ao aluno
function FetchUserData({ alunoId }: { alunoId: string }) {
  const { toast } = useToast();
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState("");
  
  // Buscar usuário pelo ID do aluno
  const { data: userData, isLoading: isLoadingUser, error: userError, refetch } = useQuery({
    queryKey: [`/api/users/by-aluno/${alunoId}`],
  });
  
  // Mutação para redefinir senha
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: number, newPassword: string }) => {
      const res = await apiRequest("PUT", `/api/users/${data.userId}/reset-password`, { 
        password: data.newPassword
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/by-aluno/${alunoId}`] });
      toast({
        title: "Senha redefinida",
        description: "A senha foi redefinida com sucesso."
      });
      setResetPasswordDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível redefinir a senha: " + error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutação para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string, password: string, nome: string, alunoId: number }) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/by-aluno/${alunoId}`] });
      toast({
        title: "Usuário criado",
        description: "A conta de usuário foi criada com sucesso."
      });
      setNewUserDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o usuário: " + error.message,
        variant: "destructive"
      });
    }
  });
  
  // Gerar nova senha para usuário
  const gerarSenha = () => {
    if (!userData?.usuario) return;
    
    // Gerar senha padrão (primeiras 3 letras do nome + ano escolar + "2025")
    let namePart = userData.nome.substring(0, 3).toLowerCase();
    const novaSenha = namePart + userData.anoEscolar.replace('_', '') + "2025";
    setNewPassword(novaSenha);
    
    // Abrir diálogo de confirmação
    setResetPasswordDialogOpen(true);
  };
  
  // Função para criar conta de usuário para aluno existente
  const criarContaUsuario = () => {
    if (!userData) return;
    
    // Gerar nome de usuário baseado no nome do aluno (substituir espaços por underscores e deixar minúsculo)
    const nomeFormatado = userData.nome.toLowerCase().replace(/\s+/g, '_');
    // Remover acentos e caracteres especiais
    const nomeNormalizado = nomeFormatado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    setGeneratedUsername(nomeNormalizado);
    
    // Gerar senha padrão (primeiras 3 letras do nome + ano escolar + "2025")
    let namePart = userData.nome.substring(0, 3).toLowerCase();
    namePart = namePart.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const novaSenha = namePart + userData.anoEscolar.replace('_', '') + "2025";
    setNewPassword(novaSenha);
    
    // Abrir diálogo para confirmar criação de usuário
    setNewUserDialogOpen(true);
  };
  
  // Confirmar criação de novo usuário
  const confirmarCriacaoUsuario = () => {
    if (!userData || !generatedUsername || !newPassword) return;
    
    createUserMutation.mutate({
      username: generatedUsername,
      password: newPassword,
      nome: userData.nome,
      alunoId: parseInt(alunoId)
    });
  };
  
  // Função para copiar para o clipboard
  const copiarParaClipboard = (texto: string) => {
    navigator.clipboard.writeText(texto)
      .then(() => {
        toast({
          title: "Copiado!",
          description: "Informação copiada para a área de transferência"
        });
      })
      .catch(err => {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o texto: " + err.message,
          variant: "destructive"
        });
      });
  };
  
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (userError) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-500">Erro ao buscar informações do usuário.</p>
      </div>
    );
  }
  
  if (!userData?.usuario) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">Este aluno não possui uma conta de usuário associada.</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={criarContaUsuario}
        >
          <User className="h-4 w-4 mr-1" /> Criar conta de usuário
        </Button>
      </div>
    );
  }
  
  const usuario = userData.usuario;
  
  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Dados da conta</h3>
              <div className="mt-2 space-y-3">
                <div className="flex justify-between items-center p-3 rounded-md border bg-gray-50">
                  <div>
                    <p className="text-xs text-gray-500">Nome de usuário</p>
                    <p className="font-medium">{usuario.username}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copiarParaClipboard(usuario.username)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-md border bg-gray-50">
                  <div>
                    <p className="text-xs text-gray-500">E-mail</p>
                    <p className="font-medium">{usuario.email || "Não cadastrado"}</p>
                  </div>
                  {usuario.email && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copiarParaClipboard(usuario.email)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tipo de acesso</h3>
              <div className="mt-2">
                <div className="p-3 rounded-md border bg-gray-50">
                  <div className="flex items-center">
                    <Shield className={`h-5 w-5 ${usuario.isAdmin ? "text-purple-500" : "text-green-500"} mr-2`} />
                    <p className="font-medium">{usuario.isAdmin ? "Administrador" : "Aluno"}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {usuario.isAdmin 
                      ? "Possui acesso total ao sistema, incluindo todas as funções administrativas." 
                      : "Possui acesso limitado ao sistema, com foco nas funções de aluno."}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Gerenciamento de senha</h3>
              <div className="mt-2 space-y-3">
                <div className="p-3 rounded-md border bg-gray-50">
                  <p className="text-sm">Redefinir senha do usuário</p>
                  <p className="text-xs text-gray-500 mt-1 mb-3">
                    Gere uma nova senha para este usuário. Uma senha padrão será criada usando o padrão: 
                    <span className="font-mono bg-gray-200 px-1 rounded">xxx + anoescolar + 2025</span>
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={gerarSenha}
                    className="w-full"
                  >
                    <Key className="h-4 w-4 mr-1" /> Gerar nova senha
                  </Button>
                </div>
                
                <div className="p-3 rounded-md border bg-gray-50">
                  <p className="text-sm">Status da conta</p>
                  <div className="flex items-center mt-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-sm">Ativa</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Último acesso</h3>
              <div className="mt-2">
                <div className="p-3 rounded-md border bg-gray-50">
                  <p className="text-sm">{usuario.lastLogin ? format(new Date(usuario.lastLogin), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Nunca acessou"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dialog para redefinir senha */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Você está prestes a redefinir a senha do usuário <span className="font-medium">{usuario.username}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nova senha:</p>
              <div className="flex items-center justify-between p-2 bg-gray-100 rounded border">
                <code className="text-sm">{newPassword}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copiarParaClipboard(newPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Anote esta senha pois ela não será exibida novamente após a confirmação.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => resetPasswordMutation.mutate({ userId: usuario.id, newPassword })}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Redefinindo..." : "Confirmar redefinição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para criar novo usuário */}
      <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar conta de usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a criar uma conta de usuário para o aluno. Os dados abaixo serão utilizados para o acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nome de usuário:</p>
              <div className="flex items-center justify-between p-2 bg-gray-100 rounded border">
                <code className="text-sm">{generatedUsername}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copiarParaClipboard(generatedUsername)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Senha:</p>
              <div className="flex items-center justify-between p-2 bg-gray-100 rounded border">
                <code className="text-sm">{newPassword}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copiarParaClipboard(newPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Anote essas informações pois elas não serão exibidas novamente após a confirmação.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmarCriacaoUsuario}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AlunoDetails({ alunoId }: AlunoDetailsProps) {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [temaDialogOpen, setTemaDialogOpen] = useState(false);

  // Carregar dados do aluno
  const { data: aluno, isLoading } = useQuery({
    queryKey: [`/api/alunos/${alunoId}`],
  });

  // Filtragem de dados para gráficos
  const aulasPorMateria = React.useMemo(() => {
    if (!aluno?.aulas) return [];
    
    const materiasCount: Record<string, number> = {};
    
    aluno.aulas.forEach((aula: any) => {
      const materiaNome = aula.materia?.nome || "Desconhecida";
      materiasCount[materiaNome] = (materiasCount[materiaNome] || 0) + 1;
    });
    
    return Object.entries(materiasCount).map(([name, value]) => ({ name, value }));
  }, [aluno?.aulas]);

  // Mutação para marcar tema como estudado/não estudado
  const updateTemaMutation = useMutation({
    mutationFn: async (data: { id: number; estudado: boolean }) => {
      const res = await apiRequest("PUT", `/api/temas/${data.id}`, { 
        ...aluno.temas.find(t => t.id === data.id),
        estudado: data.estudado 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/alunos/${alunoId}`] });
      toast({
        title: "Tema atualizado",
        description: "Status do tema atualizado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o tema: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Mutação para deletar aluno
  const deleteAlunoMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/alunos/${alunoId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      toast({
        title: "Aluno removido",
        description: "O aluno foi removido com sucesso."
      });
      // Redirecionar para lista de alunos
      window.location.href = "/alunos";
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o aluno: " + error.message,
        variant: "destructive"
      });
      setDeleteDialogOpen(false);
    }
  });

  // Gerar relatório para WhatsApp
  const gerarRelatorioWhatsApp = () => {
    if (!aluno) return;

    // Formatar dados para texto do WhatsApp
    const materiasEstudadas = aluno.temas
      .filter((tema: any) => tema.estudado)
      .map((tema: any) => tema.nome)
      .join(", ");
      
    const proximasAulas = aluno.aulas
      .filter((aula: any) => aula.status === "agendada" || aula.status === "confirmada")
      .map((aula: any) => 
        `${format(new Date(aula.data), "dd/MM - HH:mm")} - ${aula.materia?.nome}`)
      .join("\n");

    const texto = `*Relatório: ${aluno.nome}*\n\n` +
      `*Ano Escolar:* ${formatAnoEscolar(aluno.anoEscolar)}\n\n` +
      `*Temas Estudados:*\n${materiasEstudadas || "Nenhum tema concluído ainda"}\n\n` +
      `*Próximas Aulas:*\n${proximasAulas || "Nenhuma aula agendada"}`;

    // Copiar para área de transferência
    navigator.clipboard.writeText(texto)
      .then(() => {
        toast({
          title: "Relatório copiado!",
          description: "Texto formatado para WhatsApp copiado para área de transferência"
        });
      })
      .catch(err => {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o texto: " + err.message,
          variant: "destructive"
        });
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">Aluno não encontrado</h3>
        <p className="text-sm text-gray-500 mt-2">O aluno solicitado não existe ou foi removido.</p>
      </div>
    );
  }

  // Iniciais para o avatar
  const iniciais = aluno.nome
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <div className="space-y-6">
        {/* Cabeçalho com informações do aluno */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-xl">
              {iniciais}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-heading font-semibold text-gray-800">{aluno.nome}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline">{formatAnoEscolar(aluno.anoEscolar)}</Badge>
                {aluno.email && (
                  <span className="text-sm text-gray-500">{aluno.email}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <PenSquare className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          </div>
        </div>

        {/* Observações, se existirem */}
        {aluno.observacoes && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Observações</h3>
              <p className="text-sm text-gray-700">{aluno.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Responsáveis</CardTitle>
          </CardHeader>
          <CardContent>
            {aluno.responsaveis && aluno.responsaveis.length > 0 ? (
              <div className="space-y-3">
                {aluno.responsaveis.map((rel: any) => (
                  <div key={rel.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{rel.responsavel.nome}</p>
                      <p className="text-sm text-gray-500">{rel.responsavel.telefone}</p>
                    </div>
                    <a
                      href={rel.responsavel.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum responsável cadastrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Abas para Aulas, Temas e Relatórios */}
        <Tabs defaultValue="aulas">
          <TabsList className="w-full border-b">
            <TabsTrigger value="aulas" className="flex-1">Aulas</TabsTrigger>
            <TabsTrigger value="temas" className="flex-1">Temas</TabsTrigger>
            <TabsTrigger value="relatorios" className="flex-1">Relatórios</TabsTrigger>
            <TabsTrigger value="usuario" className="flex-1">Usuário</TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da aba Aulas */}
          <TabsContent value="aulas" className="pt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Histórico de Aulas</CardTitle>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-1" /> Agendar Aula
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {aluno.aulas && aluno.aulas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Matéria</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aluno.aulas.map((aula: any) => (
                          <TableRow key={aula.id}>
                            <TableCell>
                              {format(new Date(aula.data), "dd/MM/yyyy - HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>{aula.materia?.nome}</TableCell>
                            <TableCell>
                              <StatusBadge status={aula.status} />
                            </TableCell>
                            <TableCell>{aula.duracao} min</TableCell>
                            <TableCell>R$ {parseFloat(aula.valor).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4 text-center">Nenhuma aula registrada.</p>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de aulas por matéria */}
            {aulasPorMateria.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Aulas por Matéria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aulasPorMateria}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Aulas" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Conteúdo da aba Temas */}
          <TabsContent value="temas" className="pt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Temas e Conteúdos</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setTemaDialogOpen(true)}>
                    Adicionar Tema
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2 text-sm text-gray-500">Temas Estudados</h3>
                    {aluno.temas && aluno.temas.filter((tema: any) => tema.estudado).length > 0 ? (
                      <div className="space-y-2">
                        {aluno.temas
                          .filter((tema: any) => tema.estudado)
                          .map((tema: any) => (
                            <div key={tema.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                              <Checkbox 
                                id={`tema-${tema.id}`} 
                                checked={tema.estudado}
                                onCheckedChange={(checked) => {
                                  updateTemaMutation.mutate({ 
                                    id: tema.id, 
                                    estudado: checked as boolean 
                                  });
                                }}
                              />
                              <label 
                                htmlFor={`tema-${tema.id}`} 
                                className="ml-2 flex-1 text-sm font-medium line-through"
                              >
                                {tema.nome}
                              </label>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="outline" 
                                  className="bg-gray-100"
                                >
                                  {tema.materia?.nome}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="bg-gray-100"
                                >
                                  {formatDificuldade(tema.dificuldade)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 p-2">Nenhum tema concluído ainda.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 text-sm text-gray-500">Temas a Estudar</h3>
                    {aluno.temas && aluno.temas.filter((tema: any) => !tema.estudado).length > 0 ? (
                      <div className="space-y-2">
                        {aluno.temas
                          .filter((tema: any) => !tema.estudado)
                          .map((tema: any) => (
                            <div key={tema.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                              <Checkbox 
                                id={`tema-${tema.id}`} 
                                checked={tema.estudado}
                                onCheckedChange={(checked) => {
                                  updateTemaMutation.mutate({ 
                                    id: tema.id, 
                                    estudado: checked as boolean 
                                  });
                                }}
                              />
                              <label 
                                htmlFor={`tema-${tema.id}`} 
                                className="ml-2 flex-1 text-sm font-medium"
                              >
                                {tema.nome}
                              </label>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="outline" 
                                  className="bg-gray-100"
                                >
                                  {tema.materia?.nome}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="bg-gray-100"
                                >
                                  {formatDificuldade(tema.dificuldade)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 p-2">Nenhum tema pendente.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da aba Relatórios */}
          <TabsContent value="relatorios" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Relatórios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center h-16"
                      onClick={() => {
                        // Importamos e usamos a função de exportação para PDF
                        import('@/components/relatorios/pdf-export').then(module => {
                          module.exportToPDF('aluno', alunoId);
                        });
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <Download className="h-5 w-5 mb-1" />
                        <span className="text-sm">Exportar PDF</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center h-16"
                      onClick={() => {
                        // Importamos e usamos a função de exportação para PNG
                        import('@/components/relatorios/pdf-export').then(module => {
                          module.exportToPNG('aluno', alunoId);
                        });
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <FileText className="h-5 w-5 mb-1" />
                        <span className="text-sm">Gerar Relatório.png</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center h-16"
                      onClick={gerarRelatorioWhatsApp}
                    >
                      <div className="flex flex-col items-center">
                        <MessageSquare className="h-5 w-5 mb-1" />
                        <span className="text-sm">Texto WhatsApp</span>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="rounded-md border p-4 bg-gray-50">
                    <h3 className="font-medium text-sm mb-2">Relatório rápido</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Aulas este mês:</strong> {aluno.aulas?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Temas estudados:</strong> {aluno.temas?.filter((t: any) => t.estudado).length || 0} de {aluno.temas?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Próxima aula:</strong> {
                        aluno.aulas?.find((a: any) => 
                          a.status === "agendada" || a.status === "confirmada" && new Date(a.data) > new Date()
                        ) 
                          ? format(
                              new Date(aluno.aulas.find((a: any) => 
                                a.status === "agendada" || a.status === "confirmada" && new Date(a.data) > new Date()
                              ).data),
                              "dd/MM/yyyy - HH:mm",
                              { locale: ptBR }
                            )
                          : "Nenhuma aula agendada"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da aba Usuário */}
          <TabsContent value="usuario" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Acesso</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Buscar dados do usuário */}
                <FetchUserData alunoId={alunoId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para editar aluno */}
      <AlunoForm 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        aluno={aluno}
      />

      {/* Dialog para confirmar exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o aluno <span className="font-medium">{aluno.nome}</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteAlunoMutation.mutate()}
              disabled={deleteAlunoMutation.isPending}
            >
              {deleteAlunoMutation.isPending ? "Excluindo..." : "Excluir aluno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar tema */}
      <Dialog open={temaDialogOpen} onOpenChange={setTemaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Tema</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Esta funcionalidade estará disponível em breve.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setTemaDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
