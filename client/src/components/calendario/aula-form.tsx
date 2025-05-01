import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar-pt";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

// Schema para validação do formulário
const aulaFormSchema = z.object({
  data: z.date({
    required_error: "Selecione a data da aula",
  }),
  horario: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato inválido. Use HH:MM"
  }),
  alunoId: z.string().min(1, { message: "Selecione um aluno" }),
  materiaId: z.string().min(1, { message: "Selecione uma matéria" }),
  duracao: z.string().transform(val => parseInt(val)).refine((val) => !isNaN(val) && val >= 15, {
    message: "A duração mínima é de 15 minutos",
  }),
  valor: z.string().transform(val => parseFloat(val)).refine((val) => !isNaN(val) && val >= 0, {
    message: "O valor não pode ser negativo",
  }),
  status: z.enum(["agendada", "confirmada", "cancelada", "realizada"], {
    required_error: "Selecione o status da aula",
  }),
  observacoes: z.string().optional(),
  conteudo: z.string().optional(),
});

type AulaFormValues = z.infer<typeof aulaFormSchema>;

interface AulaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  aula?: any;
}

export function AulaForm({ open, onOpenChange, initialDate, aula }: AulaFormProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isEditing = !!aula;

  // Carregar alunos para o select
  const { data: alunos } = useQuery({
    queryKey: ["/api/alunos"],
    enabled: open,
  });

  // Carregar matérias para o select
  const { data: materias } = useQuery({
    queryKey: ["/api/materias"],
    enabled: open,
  });

  // Preparar valores iniciais
  const getInitialValues = () => {
    if (isEditing) {
      // Se estiver editando, usar valores da aula
      const aulaDate = new Date(aula.data);
      return {
        data: aulaDate,
        horario: format(aulaDate, "HH:mm"),
        alunoId: aula.alunoId.toString(),
        materiaId: aula.materiaId.toString(),
        duracao: aula.duracao.toString(),
        valor: typeof aula.valor === 'number'
          ? aula.valor.toFixed(2)
          : parseFloat(aula.valor).toFixed(2),
        status: aula.status,
        observacoes: aula.observacoes || "",
        conteudo: aula.conteudo || "",
      };
    } else {
      // Se estiver criando, usar data inicial ou data atual
      const defaultDate = initialDate || new Date();
      return {
        data: defaultDate,
        horario: format(new Date(), "HH:mm"),
        alunoId: "",
        materiaId: "",
        duracao: "60",
        valor: "0.00",
        status: "agendada" as const,
        observacoes: "",
        conteudo: "",
      };
    }
  };

  // Inicializar formulário
  const form = useForm<AulaFormValues>({
    resolver: zodResolver(aulaFormSchema),
    defaultValues: getInitialValues(),
  });

  // Atualizar valores iniciais quando o modal abrir ou quando a aula mudar
  useEffect(() => {
    if (open) {
      form.reset(getInitialValues());
    }
  }, [open, aula, initialDate]);

  // Mutação para criar aula
  const createAulaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/aulas", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Aula criada",
        description: "A aula foi agendada com sucesso."
      });
      // Invalidar consultas para recarregar dados
      queryClient.invalidateQueries({ queryKey: ["/api/aulas"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao agendar a aula: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutação para atualizar aula
  const updateAulaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/aulas/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Aula atualizada",
        description: "A aula foi atualizada com sucesso."
      });
      // Invalidar consultas para recarregar dados
      queryClient.invalidateQueries({ queryKey: ["/api/aulas"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao atualizar a aula: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutação para excluir aula
  const deleteAulaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/aulas/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Aula excluída",
        description: "A aula foi excluída com sucesso."
      });
      // Invalidar consultas para recarregar dados
      queryClient.invalidateQueries({ queryKey: ["/api/aulas"] });
      setDeleteDialogOpen(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao excluir a aula: ${error.message}`,
        variant: "destructive"
      });
      setDeleteDialogOpen(false);
    }
  });

  // Função para enviar o formulário
  async function onSubmit(values: AulaFormValues) {
    try {
      // Combinar data e horário
      const [hours, minutes] = values.horario.split(':').map(Number);
      const combinedDate = new Date(values.data);
      combinedDate.setHours(hours, minutes);

      // Preparar dados para envio
      const aulaData = {
        ...values,
        data: combinedDate.toISOString(),
        alunoId: parseInt(values.alunoId),
        materiaId: parseInt(values.materiaId),
        duracao: parseInt(values.duracao.toString()),
        valor: parseFloat(values.valor.toString()),
      };

      if (isEditing) {
        await updateAulaMutation.mutateAsync({ id: aula.id, data: aulaData });
      } else {
        await createAulaMutation.mutateAsync(aulaData);
      }
    } catch (error) {
      console.error("Erro ao processar formulário:", error);
    }
  }

  // Função para excluir aula
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (aula) {
      deleteAulaMutation.mutate(aula.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Aula" : "Nova Aula"}</DialogTitle>
            {isEditing && (
              <DialogDescription>
                Edite os detalhes da aula ou altere seu status.
              </DialogDescription>
            )}
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data */}
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Horário */}
                <FormField
                  control={form.control}
                  name="horario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input {...field} placeholder="HH:MM" />
                        </FormControl>
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Aluno */}
              <FormField
                control={form.control}
                name="alunoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aluno</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {alunos && alunos.length > 0 ? (
                          alunos.map((aluno: any) => (
                            <SelectItem key={aluno.id} value={aluno.id.toString()}>
                              {aluno.nome}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Carregando alunos...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Matéria */}
              <FormField
                control={form.control}
                name="materiaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matéria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma matéria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materias && materias.length > 0 ? (
                          materias.map((materia: any) => (
                            <SelectItem key={materia.id} value={materia.id.toString()}>
                              {materia.nome}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Carregando matérias...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duração */}
                <FormField
                  control={form.control}
                  name="duracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          placeholder="60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Valor */}
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agendada">Agendada</SelectItem>
                        <SelectItem value="confirmada">Confirmada</SelectItem>
                        <SelectItem value="realizada">Realizada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações sobre a aula" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conteúdo (para aulas realizadas) */}
              {form.watch("status") === "realizada" && (
                <FormField
                  control={form.control}
                  name="conteudo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo Estudado</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Conteúdo abordado na aula" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter className="pt-4">
                {isEditing && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    className="mr-auto"
                  >
                    Excluir
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAulaMutation.isPending || updateAulaMutation.isPending}
                >
                  {(createAulaMutation.isPending || updateAulaMutation.isPending) 
                    ? "Salvando..." 
                    : isEditing ? "Atualizar" : "Agendar"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteAulaMutation.isPending}
            >
              {deleteAulaMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
