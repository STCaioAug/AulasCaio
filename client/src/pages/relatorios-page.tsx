import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { RelatorioCard } from "@/components/relatorios/relatorio-card";
import { RelatorioForm } from "@/components/relatorios/relatorio-form";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToPNG, generateWhatsAppText } from "@/components/relatorios/pdf-export";
import {
  GraduationCap,
  Calendar,
  DollarSign,
  Download,
  Share
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RelatoriosPage() {
  const { toast } = useToast();
  const [tipoRelatorio, setTipoRelatorio] = useState<string | null>(null);

  // Buscar relatórios recentes (isto é uma simulação)
  const relatoriosRecentes = [
    {
      id: 1,
      nome: "Relatório mensal - Junho",
      tipo: "Financeiro",
      data: "30/06/2023",
      formato: "PDF"
    },
    {
      id: 2,
      nome: "Maria Almeida - Progresso",
      tipo: "Individual",
      data: "25/06/2023",
      formato: "WhatsApp"
    },
    {
      id: 3,
      nome: "Horários Disponíveis",
      tipo: "Horários",
      data: "20/06/2023",
      formato: "PNG"
    }
  ];

  // Funções para lidar com diferentes tipos de relatórios
  const handleRelatorioAluno = () => {
    setTipoRelatorio("aluno");
  };

  const handleRelatorioHorarios = () => {
    setTipoRelatorio("horarios");
  };

  const handleRelatorioFinanceiro = () => {
    setTipoRelatorio("financeiro");
  };

  // Download de relatório simulado
  const handleDownload = (relatorio: any) => {
    toast({
      title: "Download iniciado",
      description: `Baixando "${relatorio.nome}" em formato ${relatorio.formato}`
    });
  };

  // Compartilhar relatório simulado
  const handleShare = (relatorio: any) => {
    toast({
      title: "Compartilhar",
      description: `Opções de compartilhamento para "${relatorio.nome}"`
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-heading font-semibold text-gray-800">Relatórios</h2>
        </div>

        {/* Cards de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RelatorioCard
            title="Relatório Individual do Aluno"
            description="Gere relatórios detalhados sobre o progresso de cada aluno, conteúdos estudados e próximas aulas."
            icon={GraduationCap}
            iconColor="text-primary-600"
            onClick={handleRelatorioAluno}
          />
          
          <RelatorioCard
            title="Relatório de Horários"
            description="Visualize e exporte horários disponíveis e já reservados para compartilhar com responsáveis."
            icon={Calendar}
            iconColor="text-green-600"
            onClick={handleRelatorioHorarios}
            buttonText="Gerar Relatório"
          />
          
          <RelatorioCard
            title="Relatório Financeiro"
            description="Acompanhe receitas por período ou aluno, compare com metas e projete ganhos futuros."
            icon={DollarSign}
            iconColor="text-secondary-500"
            onClick={handleRelatorioFinanceiro}
            buttonText="Gerar Relatório"
          />
        </div>

        {/* Formulário de Relatório */}
        {tipoRelatorio && (
          <RelatorioForm />
        )}

        {/* Relatórios Recentes */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Relatórios Recentes</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatoriosRecentes.map((relatorio) => (
                    <TableRow key={relatorio.id}>
                      <TableCell className="font-medium">{relatorio.nome}</TableCell>
                      <TableCell>{relatorio.tipo}</TableCell>
                      <TableCell>{relatorio.data}</TableCell>
                      <TableCell>{relatorio.formato}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(relatorio)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShare(relatorio)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
