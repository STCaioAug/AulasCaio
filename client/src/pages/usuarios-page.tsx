import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, PenSquare, UserPlus, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Redirect } from "wouter";

type User = {
  id: number;
  username: string;
  nome: string;
  email: string;
  telefone: string;
};

type UserFormValues = z.infer<typeof userFormSchema>;

const userFormSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(5, "A senha deve ter pelo menos 5 caracteres").optional(),
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional()
});

export default function UsuariosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Redirecionar se não for o usuário administrador
  if (user?.username !== "STCaio") {
    return <Redirect to="/" />;
  }
  
  // Consulta para buscar usuários
  const { data: usuarios, isLoading } = useQuery<User[]>({
    queryKey: ["/api/usuarios"],
    staleTime: 1000 * 60, // 1 minuto
  });
  
  // Form para criar/editar usuário
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      nome: "",
      email: "",
      telefone: ""
    },
  });
  
  // Efeito para preencher o form quando um usuário for selecionado para edição
  useEffect(() => {
    if (selectedUser) {
      form.reset({
        username: selectedUser.username,
        password: "", // Não preenchemos a senha na edição
        nome: selectedUser.nome,
        email: selectedUser.email,
        telefone: selectedUser.telefone || ""
      });
    } else {
      form.reset({
        username: "",
        password: "",
        nome: "",
        email: "",
        telefone: ""
      });
    }
  }, [selectedUser, form]);
  
  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/usuarios", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      setOpenForm(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormValues & { id: number }) => {
      const { id, ...userData } = data;
      const res = await apiRequest("PUT", `/api/usuarios/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      setOpenForm(false);
      setSelectedUser(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handler para abrir o formulário de criação
  const handleAddUser = () => {
    setSelectedUser(null);
    form.reset();
    setOpenForm(true);
  };
  
  // Handler para abrir o formulário de edição
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setOpenForm(true);
  };
  
  // Handler para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };
  
  // Handler para confirmar a exclusão
  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };
  
  // Handler para enviar o formulário
  const onSubmit = (data: UserFormValues) => {
    if (selectedUser) {
      // Se a senha estiver vazia na edição, remover do objeto
      if (!data.password) {
        const { password, ...restData } = data;
        updateUserMutation.mutate({ ...restData, id: selectedUser.id });
      } else {
        updateUserMutation.mutate({ ...data, id: selectedUser.id });
      }
    } else {
      // Na criação, a senha é obrigatória
      if (!data.password) {
        toast({
          title: "Erro",
          description: "A senha é obrigatória para criar um novo usuário",
          variant: "destructive",
        });
        return;
      }
      createUserMutation.mutate(data);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Gerenciamento de Usuários</h1>
          <Button 
            onClick={handleAddUser}
            className="flex items-center gap-2"
          >
            <UserPlus size={16} />
            Novo Usuário
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Carregando usuários...</div>
        ) : !usuarios || usuarios.length === 0 ? (
          <div className="text-center py-4">Nenhum usuário encontrado.</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome de Usuário</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.id}</TableCell>
                    <TableCell>{usuario.username}</TableCell>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{usuario.telefone || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditUser(usuario)}
                          disabled={usuario.username === "STCaio"}
                          title={usuario.username === "STCaio" ? "Usuário administrador não pode ser editado" : "Editar usuário"}
                        >
                          <PenSquare size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(usuario)}
                          disabled={usuario.username === "STCaio"}
                          title={usuario.username === "STCaio" ? "Usuário administrador não pode ser excluído" : "Excluir usuário"}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Modal de criação/edição de usuário */}
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser ? "Edite as informações do usuário abaixo." : "Preencha os dados do novo usuário."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={selectedUser?.username === "STCaio"}
                          placeholder="Digite o nome de usuário"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Senha
                        {selectedUser && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Deixe em branco para manter a senha atual)
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          disabled={selectedUser?.username === "STCaio"}
                          placeholder={selectedUser ? "••••••••" : "Digite a senha"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Digite o nome completo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Digite o e-mail"
                          type="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Digite o telefone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      createUserMutation.isPending ||
                      updateUserMutation.isPending ||
                      (selectedUser?.username === "STCaio")
                    }
                  >
                    {selectedUser ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de confirmação de exclusão */}
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Você tem certeza que deseja excluir o usuário <strong>{selectedUser?.nome}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDeleteDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
