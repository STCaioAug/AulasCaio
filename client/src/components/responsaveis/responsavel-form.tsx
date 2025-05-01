import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Schema para validação do formulário
const responsavelFormSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  telefone: z.string().min(10, { message: "Telefone inválido" }),
  whatsapp: z.string().min(10, { message: "WhatsApp inválido" }),
  alunosIds: z.array(z.string().or(z.number())).optional()
});

type ResponsavelFormValues = z.infer<typeof responsavelFormSchema>;

interface ResponsavelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responsavel?: {
    id: number;
    nome: string;
    telefone: string;
    whatsapp: string;
    alunos?: Array<{ aluno: { id: number; nome: string } }>;
  };
}

export function ResponsavelForm({ open, onOpenChange, responsavel }: ResponsavelFormProps) {
  const { toast } = useToast();
  const isEditing = !!responsavel;

  // Carregar todos os alunos para o select
  const { data: alunos } = useQuery({
    queryKey: ["/api/alunos"],
    enabled: open // Só carrega os dados quando o modal estiver aberto
  });

  // Preparar valores iniciais para alunosIds
  const alunosIdsDefault = React.useMemo(() => {
    if (!responsavel?.alunos) return [];
    return responsavel.alunos.map(rel => rel.aluno.id.toString());
  }, [responsavel]);

  // Formatação automática de telefone
  const formatTelefone = (value: string) => {
    if (!value) return value;
    
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, "");
    
    // Formato: (00) 00000-0000
    if (numbers.length <= 11) {
      let formatted = "";
      if (numbers.length > 0) formatted += `(${numbers.substring(0, 2)}`;
      if (numbers.length > 2) formatted += `) ${numbers.substring(2, 7)}`;
      if (numbers.length > 7) formatted += `-${numbers.substring(7, 11)}`;
      return formatted;
    }
    
    return value;
  };

  // Formatação automática de link WhatsApp
  const formatWhatsApp = (telefone: string) => {
    if (!telefone) return "";
    const numbers = telefone.replace(/\D/g, "");
    if (numbers.length >= 10) {
      return `https://wa.me/55${numbers}`;
    }
    return telefone;
  };

  const defaultValues: Partial<ResponsavelFormValues> = {
    nome: responsavel?.nome || "",
    telefone: responsavel?.telefone || "",
    whatsapp: responsavel?.whatsapp || "",
    alunosIds: alunosIdsDefault
  };

  const form = useForm<ResponsavelFormValues>({
    resolver: zodResolver(responsavelFormSchema),
    defaultValues
  });

  // Atualizar automaticamente o link do WhatsApp quando o telefone mudar
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "telefone") {
        const formattedPhone = formatTelefone(value.telefone || "");
        form.setValue("telefone", formattedPhone);
        form.setValue("whatsapp", formatWhatsApp(formattedPhone));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(data: ResponsavelFormValues) {
    try {
      if (isEditing) {
        await apiRequest("PUT", `/api/responsaveis/${responsavel.id}`, data);
        toast({
          title: "Responsável atualizado",
          description: "As informações do responsável foram atualizadas com sucesso."
        });
      } else {
        await apiRequest("POST", "/api/responsaveis", data);
        toast({
          title: "Responsável cadastrado",
          description: "O novo responsável foi cadastrado com sucesso."
        });
      }
      
      // Invalidar a query para recarregar a lista de responsáveis
      queryClient.invalidateQueries({ queryKey: ["/api/responsaveis"] });
      
      // Fechar o formulário
      onOpenChange(false);
      // Resetar o formulário
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o responsável. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Responsável" : "Novo Responsável"}</DialogTitle>
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
                    <Input placeholder="Nome completo do responsável" {...field} />
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
                      placeholder="(00) 00000-0000" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do WhatsApp</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://wa.me/5500000000000" 
                      {...field}
                      disabled 
                      className="bg-gray-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="alunosIds"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>Responsável por</FormLabel>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {alunos && alunos.length > 0 ? alunos.map((aluno: any) => (
                      <div key={aluno.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`aluno-${aluno.id}`} 
                          checked={form.watch("alunosIds")?.includes(aluno.id.toString())}
                          onCheckedChange={(checked) => {
                            const currentValues = form.getValues("alunosIds") || [];
                            const alunoId = aluno.id.toString();
                            
                            if (checked) {
                              form.setValue(
                                "alunosIds", 
                                [...currentValues, alunoId],
                                { shouldValidate: true }
                              );
                            } else {
                              form.setValue(
                                "alunosIds", 
                                currentValues.filter(id => id !== alunoId),
                                { shouldValidate: true }
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`aluno-${aluno.id}`} className="text-sm">
                          {aluno.nome}
                        </Label>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 py-2">Nenhum aluno disponível</p>
                    )}
                  </div>
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
