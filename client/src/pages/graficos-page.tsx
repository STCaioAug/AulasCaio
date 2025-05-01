import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { BarChart } from "@/components/graficos/bar-chart";
import { PieChart } from "@/components/graficos/pie-chart";
import { useQuery } from "@tanstack/react-query";
import { 
  CheckCircle, 
  CreditCard, 
  Clock,
  Loader2,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function GraficosPage() {
  const { toast } = useToast();
  const [periodoFilter, setPeriodoFilter] = useState<string>("mes");
  const [horasLivresFilter, setHorasLivresFilter] = useState<string>("semana");
  const [horasTrabalhadasFilter, setHorasTrabalhadasFilter] = useState<string>("semana");
  const [distribuicaoFilter, setDistribuicaoFilter] = useState<string>("mes");

  // Buscar indicadores
  const { data: indicadores, isLoading: loadingIndicadores } = useQuery({
    queryKey: [`/api/dashboard/indicadores?periodo=${periodoFilter}`],
  });

  // Buscar horários disponíveis
  const { data: horariosData } = useQuery({
    queryKey: ["/api/horarios-disponiveis"],
  });

  // Buscar aulas
  const { data: aulas } = useQuery({
    queryKey: ["/api/aulas"],
  });

  // Buscar matérias para os gráficos
  const { data: materias } = useQuery({
    queryKey: ["/api/materias"],
  });

  // Configurar dados para o gráfico de horas livres por dia
  const horasLivresPorDia = React.useMemo(() => {
    if (!horariosData) return [];

    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const horasPorDia = new Array(7).fill(0);

    horariosData.forEach((horario: any) => {
      const horaInicio = parseInt(horario.horaInicio.split(":")[0]);
      const horaFim = parseInt(horario.horaFim.split(":")[0]);
      const duracao = horaFim - horaInicio;
      
      horasPorDia[horario.diaSemana] += duracao;
    });

    return diasSemana.map((dia, index) => ({
      dia,
      horas: horasPorDia[index]
    }));
  }, [horariosData]);

  // Configurar dados para o gráfico de horas trabalhadas por dia
  const horasTrabalhadasPorDia = React.useMemo(() => {
    if (!aulas) return [];

    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const horasPorDia = new Array(7).fill(0);

    aulas.forEach((aula: any) => {
      if (aula.status === 'confirmada' || aula.status === 'realizada') {
        const data = new Date(aula.data);
        const diaSemana = data.getDay();
        horasPorDia[diaSemana] += aula.duracao / 60; // Converter minutos para horas
      }
    });

    return diasSemana.map((dia, index) => ({
      dia,
      horas: horasPorDia[index]
    }));
  }, [aulas]);

  // Configurar dados para o gráfico comparativo de aulas
  const aulasComparativo = React.useMemo(() => {
    if (!indicadores) return [];

    return [
      { name: "Agendadas", value: indicadores.aulasAgendadas - indicadores.aulasDadas || 0 },
      { name: "Realizadas", value: indicadores.aulasDadas || 0 }
    ];
  }, [indicadores]);

  // Configurar dados para o gráfico de distribuição por matéria
  const distribuicaoPorMateria = React.useMemo(() => {
    if (!aulas || !materias) return [];

    // Mapear materias por id para facilitar a busca
    const materiasMap = new Map();
    materias.forEach((materia: any) => {
      materiasMap.set(materia.id, materia.nome);
    });

    // Contar aulas por matéria
    const countPorMateria: Record<string, number> = {};
    
    aulas.forEach((aula: any) => {
      const materiaNome = materiasMap.get(aula.materiaId) || "Desconhecido";
      countPorMateria[materiaNome] = (countPorMateria[materiaNome] || 0) + 1;
    });

    // Transformar em formato para o gráfico
    return Object.entries(countPorMateria).map(([name, value]) => ({
      name,
      value
    }));
  }, [aulas, materias]);

  // Opções para filtro de período
  const periodoOptions = [
    { value: "dia", label: "Hoje" },
    { value: "semana", label: "Esta Semana" },
    { value: "mes", label: "Este Mês" },
  ];

  // Opções para filtros de gráficos
  const timeRangeOptions = [
    { value: "semana", label: "Esta Semana" },
    { value: "mes", label: "Este Mês" },
  ];

  // Exportar gráficos
  const handleExport = () => {
    toast({
      title: "Exportar gráficos",
      description: "Esta funcionalidade estará disponível em breve."
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-heading font-semibold text-gray-800">Gráficos e Estatísticas</h2>
          <div className="flex space-x-2">
            <select
              className="px-3 py-1 text-sm border rounded-md shadow-sm"
              value={periodoFilter}
              onChange={(e) => setPeriodoFilter(e.target.value)}
            >
              {periodoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          </div>
        </div>

        {/* Cards de indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total de Aulas Confirmadas</p>
                <h3 className="text-2xl font-semibold text-gray-800">
                  {loadingIndicadores ? "..." : indicadores?.aulasConfirmadas || "0"}
                </h3>
              </div>
              <div className="p-2 bg-primary-100 rounded-md text-primary-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(80, (indicadores?.aulasConfirmadas || 0) / 0.3)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Meta: 30</span>
                <span>{Math.min(100, Math.round((indicadores?.aulasConfirmadas || 0) / 0.3))}%</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total de Horas Trabalhadas</p>
                <h3 className="text-2xl font-semibold text-gray-800">
                  {loadingIndicadores ? "..." : `${indicadores?.horasTrabalhadas || 0}h`}
                </h3>
              </div>
              <div className="p-2 bg-emerald-100 rounded-md text-emerald-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (indicadores?.horasTrabalhadas || 0) / 0.75)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Meta: 75h</span>
                <span>{Math.min(100, Math.round((indicadores?.horasTrabalhadas || 0) / 0.75))}%</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">Acumulado do Mês</p>
                <h3 className="text-2xl font-semibold text-gray-800">
                  {loadingIndicadores ? "..." : `R$ ${indicadores?.acumuladoMes?.toFixed(2) || "0,00"}`.replace('.', ',')}
                </h3>
              </div>
              <div className="p-2 bg-pink-100 rounded-md text-secondary-500">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-secondary-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (indicadores?.acumuladoMes || 0) / 45)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Meta: R$ 4.500,00</span>
                <span>{Math.min(100, Math.round((indicadores?.acumuladoMes || 0) / 45))}%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart
            title="Horas Livres por Dia"
            data={horasLivresPorDia}
            xAxisKey="dia"
            yAxisKey="horas"
            barColor="hsl(var(--primary))"
            filters={{
              options: timeRangeOptions,
              selectedOption: horasLivresFilter,
              onOptionChange: setHorasLivresFilter
            }}
            barName="Horas Livres"
          />
          
          <BarChart
            title="Horas Trabalhadas por Dia"
            data={horasTrabalhadasPorDia}
            xAxisKey="dia"
            yAxisKey="horas"
            barColor="hsl(var(--chart-4))"
            filters={{
              options: timeRangeOptions,
              selectedOption: horasTrabalhadasFilter,
              onOptionChange: setHorasTrabalhadasFilter
            }}
            barName="Horas Trabalhadas"
          />
        </div>

        {/* Gráficos Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChart
            title="Aulas Agendadas vs. Dadas"
            data={aulasComparativo}
            nameKey="name"
            valueKey="value"
            colors={["hsl(var(--primary))", "hsl(var(--secondary))"]}
            legend={true}
          />
          
          <Card className="bg-white rounded-lg shadow-md p-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Distribuição por Matéria</CardTitle>
                <select
                  className="px-2 py-1 text-xs border rounded"
                  value={distribuicaoFilter}
                  onChange={(e) => setDistribuicaoFilter(e.target.value)}
                >
                  <option value="mes">Este Mês</option>
                  <option value="mes_anterior">Mês Anterior</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingIndicadores ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {distribuicaoPorMateria.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.name}</span>
                        <span className="font-medium">
                          {Math.round((item.value / (distribuicaoPorMateria.reduce((acc, curr) => acc + curr.value, 0) || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-${
                            index === 0 ? "primary-600" : 
                            index === 1 ? "secondary-500" : 
                            index === 2 ? "accent-500" : 
                            index === 3 ? "emerald-500" : 
                            "amber-500"
                          }`}
                          style={{ 
                            width: `${(item.value / (distribuicaoPorMateria.reduce((acc, curr) => acc + curr.value, 0) || 1)) * 100}%`,
                            backgroundColor: [
                              "hsl(var(--primary))",
                              "hsl(var(--secondary))",
                              "hsl(var(--accent))",
                              "hsl(var(--chart-4))",
                              "hsl(var(--chart-5))"
                            ][index % 5]
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  {distribuicaoPorMateria.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      <p>Não há dados suficientes para exibir</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
