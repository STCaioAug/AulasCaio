import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Schema para validação do formulário
const alunoFormSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  anoEscolar: z.string({ required_error: "Selecione o ano escolar" }),
  escola: z.string().default("Outra"),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal(""))
});

type AlunoFormValues = z.infer<typeof alunoFormSchema>;

interface AlunoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno?: {
    id: number;
    nome: string;
    anoEscolar: string;
    escola?: string;
    email?: string;
    telefone?: string;
    observacoes?: string;
  };
}

export function AlunoForm({ open, onOpenChange, aluno }: AlunoFormProps) {
  const { toast } = useToast();
  const isEditing = !!aluno;

  const defaultValues: Partial<AlunoFormValues> = {
    nome: aluno?.nome || "",
    anoEscolar: aluno?.anoEscolar || "",
    escola: aluno?.escola || "Outra",
    email: aluno?.email || "",
    telefone: aluno?.telefone || "",
    observacoes: aluno?.observacoes || ""
  };

  const form = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoFormSchema),
    defaultValues
  });

  async function onSubmit(data: AlunoFormValues) {
    try {
      if (isEditing) {
        await apiRequest("PUT", `/api/alunos/${aluno.id}`, data);
        toast({
          title: "Aluno atualizado",
          description: "As informações do aluno foram atualizadas com sucesso."
        });
      } else {
        await apiRequest("POST", "/api/alunos", data);
        toast({
          title: "Aluno cadastrado",
          description: "O novo aluno foi cadastrado com sucesso."
        });
      }
      
      // Invalidar a query para recarregar a lista de alunos
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      
      // Fechar o formulário
      onOpenChange(false);
      // Resetar o formulário
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar aluno:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o aluno. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do aluno" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="anoEscolar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano Escolar</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano escolar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6_ano">6º Ano</SelectItem>
                        <SelectItem value="7_ano">7º Ano</SelectItem>
                        <SelectItem value="8_ano">8º Ano</SelectItem>
                        <SelectItem value="9_ano">9º Ano</SelectItem>
                        <SelectItem value="1_em">1º Ensino Médio</SelectItem>
                        <SelectItem value="2_em">2º Ensino Médio</SelectItem>
                        <SelectItem value="3_em">3º Ensino Médio</SelectItem>
                        <SelectItem value="superior">Ensino Superior</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="escola"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a escola" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EEP">EEP</SelectItem>
                        <SelectItem value="CLQ">CLQ</SelectItem>
                        <SelectItem value="Liceu">Liceu</SelectItem>
                        <SelectItem value="Objetivo">Objetivo</SelectItem>
                        <SelectItem value="Mackenzie">Mackenzie</SelectItem>
                        <SelectItem value="Bandeirantes">Bandeirantes</SelectItem>
                        <SelectItem value="Anglo">Anglo</SelectItem>
                        <SelectItem value="Poliedro">Poliedro</SelectItem>
                        <SelectItem value="Outra">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email do aluno" {...field} />
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
                      <Input placeholder="Telefone do aluno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o aluno" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
