import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToPNG, generateWhatsAppText } from "./pdf-export";

// Schema para validação do formulário
const relatorioFormSchema = z.object({
  tipoRelatorio: z.string({
    required_error: "Selecione o tipo de relatório",
  }),
  periodo: z.string({
    required_error: "Selecione o período",
  }),
  alunoId: z.string().optional(),
  formatoExportacao: z.string({
    required_error: "Selecione o formato de exportação",
  }),
  incluirGraficos: z.boolean().default(true),
});

type RelatorioFormValues = z.infer<typeof relatorioFormSchema>;

export function RelatorioForm() {
  const { toast } = useToast();
  
  // Carregar alunos para o select
  const { data: alunos } = useQuery({
    queryKey: ["/api/alunos"],
  });

  // Inicializar formulário
  const form = useForm<RelatorioFormValues>({
    resolver: zodResolver(relatorioFormSchema),
    defaultValues: {
      tipoRelatorio: "aluno",
      periodo: "mes_atual",
      alunoId: "todos",
      formatoExportacao: "pdf",
      incluirGraficos: true,
    },
  });

  // Submeter formulário
  async function onSubmit(values: RelatorioFormValues) {
    try {
      // Aqui você implementaria a lógica para gerar o relatório
      console.log("Gerando relatório com os seguintes dados:", values);
      
      // Simulação de geração de relatório
      toast({
        title: "Gerando relatório",
        description: "Seu relatório está sendo processado...",
      });

      setTimeout(() => {
        // Baseado no formato de exportação, chamar a função apropriada
        switch (values.formatoExportacao) {
          case "pdf":
            exportToPDF(values.tipoRelatorio, values.alunoId !== "todos" ? values.alunoId : undefined);
            break;
          case "png":
            exportToPNG(values.tipoRelatorio, values.alunoId !== "todos" ? values.alunoId : undefined);
            break;
          case "whatsapp":
            generateWhatsAppText(values.tipoRelatorio, values.alunoId !== "todos" ? values.alunoId : undefined);
            break;
          case "excel":
            toast({
              title: "Exportação para Excel",
              description: "Esta funcionalidade estará disponível em breve.",
            });
            break;
        }
      }, 1000);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o relatório.",
        variant: "destructive",
      });
    }
  }

  // Verificar se deve mostrar seleção de aluno
  const showAlunoSelect = form.watch("tipoRelatorio") === "aluno" || form.watch("tipoRelatorio") === "financeiro";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Personalizar Relatório</CardTitle>
        <CardDescription>Configure as opções do relatório que deseja gerar</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Relatório */}
              <FormField
                control={form.control}
                name="tipoRelatorio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Relatório</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de relatório" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aluno">Relatório Individual do Aluno</SelectItem>
                        <SelectItem value="horarios">Relatório de Horários</SelectItem>
                        <SelectItem value="financeiro">Relatório Financeiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Período */}
              <FormField
                control={form.control}
                name="periodo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ultima_semana">Última Semana</SelectItem>
                        <SelectItem value="mes_atual">Mês Atual</SelectItem>
                        <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                        <SelectItem value="ultimo_trimestre">Último Trimestre</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Aluno (condicionalmente exibido) */}
              {showAlunoSelect && (
                <FormField
                  control={form.control}
                  name="alunoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aluno</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o aluno" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Alunos</SelectItem>
                          {alunos && alunos.map((aluno: any) => (
                            <SelectItem key={aluno.id} value={aluno.id.toString()}>
                              {aluno.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Formato de Exportação */}
              <FormField
                control={form.control}
                name="formatoExportacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato de Exportação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="whatsapp">Texto para WhatsApp</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Incluir Gráficos */}
            <FormField
              control={form.control}
              name="incluirGraficos"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="incluir_graficos"
                    />
                  </FormControl>
                  <Label htmlFor="incluir_graficos">Incluir gráficos</Label>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Gerar Relatório
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
