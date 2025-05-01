import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { AvailableHours, AvailableHour } from "@/components/dashboard/available-hours";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  CheckCircle, 
  CreditCard, 
  CalendarCheck, 
  Clock 
} from "lucide-react";

// Componente HomePage - Dashboard inicial
export default function HomePage() {
  const { toast } = useToast();
  const [periodoFilter, setPeriodoFilter] = useState<string>("mes");

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
      { name: "Agendadas", value: indicadores.aulasAgendadas || 0 },
      { name: "Realizadas", value: indicadores.aulasDadas || 0 }
    ];
  }, [indicadores]);

  // Transformar dados de horários disponíveis para o componente
  const availableHours: AvailableHour[] = React.useMemo(() => {
    if (!horariosData) return [];

    const diasSemana = [
      { short: "DOM", long: "Domingo" },
      { short: "SEG", long: "Segunda" },
      { short: "TER", long: "Terça" },
      { short: "QUA", long: "Quarta" },
      { short: "QUI", long: "Quinta" },
      { short: "SEX", long: "Sexta" },
      { short: "SÁB", long: "Sábado" }
    ];

    return horariosData.map((horario: any) => {
      const horaInicio = parseInt(horario.horaInicio.split(":")[0]);
      const horaFim = parseInt(horario.horaFim.split(":")[0]);
      const duracao = horaFim - horaInicio;

      return {
        id: horario.id,
        day: diasSemana[horario.diaSemana],
        startTime: horario.horaInicio,
        endTime: horario.horaFim,
        duration: duracao
      };
    });
  }, [horariosData]);

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

  // Cores para o gráfico de pizza
  const COLORS = ["#6366f1", "#ec4899"];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-heading font-semibold text-gray-800">Dashboard</h2>
          
          <div className="flex space-x-2">
            <select 
              className="px-3 py-1 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={periodoFilter}
              onChange={(e) => setPeriodoFilter(e.target.value)}
            >
              {periodoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards de indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Aulas Confirmadas"
            value={loadingIndicadores ? "..." : indicadores?.aulasConfirmadas || "0"}
            icon={<CheckCircle className="h-5 w-5" />}
            trend={{ value: 12, label: "em relação ao mês anterior" }}
            trendDirection="up"
            colorClass="card-primary"
            href="/calendario"
          />
          
          <StatsCard
            title="Acumulado do Mês"
            value={loadingIndicadores ? "..." : `R$ ${indicadores?.acumuladoMes?.toFixed(2) || "0,00"}`.replace(".", ",")}
            icon={<CreditCard className="h-5 w-5" />}
            trend={{ value: 8, label: "em relação ao mês anterior" }}
            trendDirection="up"
            colorClass="card-secondary"
            href="/relatorios"
          />
          
          <StatsCard
            title="Aulas Agendadas vs. Dadas"
            value={loadingIndicadores ? "..." : `${indicadores?.aulasDadas || 0}/${indicadores?.aulasAgendadas || 0}`}
            icon={<CalendarCheck className="h-5 w-5" />}
            trend={{ value: 75, label: "de conversão" }}
            trendDirection="neutral"
            colorClass="card-accent"
            href="/graficos"
          />
          
          <StatsCard
            title="Horas Trabalhadas"
            value={loadingIndicadores ? "..." : `${indicadores?.horasTrabalhadas || 0}h`}
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: 5, label: "em relação ao mês anterior" }}
            trendDirection="down"
            colorClass="card-emerald"
            href="/graficos"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Horas Livres por Dia"
            options={timeRangeOptions}
            onOptionChange={(value) => {
              console.log("Filtrar horas livres por", value);
              toast({
                title: "Filtro aplicado",
                description: `Visualizando dados para ${value === "semana" ? "esta semana" : "este mês"}`
              });
            }}
            selectedOption="semana"
          >
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horasLivresPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} horas`, "Disponível"]} />
                  <Bar dataKey="horas" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          
          <ChartCard
            title="Horas Trabalhadas"
            options={timeRangeOptions}
            onOptionChange={(value) => {
              console.log("Filtrar horas trabalhadas por", value);
              toast({
                title: "Filtro aplicado",
                description: `Visualizando dados para ${value === "semana" ? "esta semana" : "este mês"}`
              });
            }}
            selectedOption="semana"
          >
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horasTrabalhadasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} horas`, "Trabalhadas"]} />
                  <Bar dataKey="horas" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Gráfico e Horários Vagos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Aulas Agendadas vs. Dadas"
            actionLabel="Ver detalhes"
            onAction={() => {
              toast({
                title: "Ação",
                description: "Redirecionando para detalhes"
              });
            }}
          >
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aulasComparativo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {aulasComparativo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center text-sm">
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 bg-primary-600 rounded-full mr-1"></div>
                  <span>Agendadas ({Math.round((indicadores?.aulasAgendadas / (indicadores?.aulasAgendadas + indicadores?.aulasDadas || 1)) * 100 || 0)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-secondary-500 rounded-full mr-1"></div>
                  <span>Realizadas ({Math.round((indicadores?.aulasDadas / (indicadores?.aulasAgendadas + indicadores?.aulasDadas || 1)) * 100 || 0)}%)</span>
                </div>
              </div>
            </div>
          </ChartCard>
          
          <AvailableHours
            hours={availableHours}
            onAdd={(hour) => {
              toast({
                title: "Adicionar aula",
                description: `No ${hour.day.long}, de ${hour.startTime} até ${hour.endTime}`
              });
            }}
          />
        </div>
      </div>
    </MainLayout>
  );
}
