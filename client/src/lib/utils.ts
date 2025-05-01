import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatação de valores para exibição
export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

// Formatação de ano escolar para exibição
export function formatAnoEscolar(anoEscolar: string): string {
  switch (anoEscolar) {
    case '1_ef': return '1º Ano EF';
    case '2_ef': return '2º Ano EF';
    case '3_ef': return '3º Ano EF';
    case '4_ef': return '4º Ano EF';
    case '5_ef': return '5º Ano EF';
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
}

// Formatação de status de aula para exibição
export function formatStatus(status: string): string {
  switch (status) {
    case 'agendada': return 'Agendada';
    case 'confirmada': return 'Confirmada';
    case 'cancelada': return 'Cancelada';
    case 'realizada': return 'Realizada';
    default: return status;
  }
}

// Formatação de dificuldade para exibição
export function formatDificuldade(dificuldade: string): string {
  switch (dificuldade) {
    case 'facil': return 'Fácil';
    case 'medio': return 'Médio';
    case 'dificil': return 'Difícil';
    default: return dificuldade;
  }
}

// Obter iniciais de um nome
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Formatar dias da semana
export function formatWeekDay(day: number): string {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return days[day] || `Dia ${day}`;
}

// Converter status para classes de cor
export function getStatusColorClass(status: string): { bg: string; text: string } {
  const colorMap: Record<string, { bg: string; text: string }> = {
    agendada: { bg: "bg-blue-100", text: "text-blue-800" },
    confirmada: { bg: "bg-green-100", text: "text-green-800" },
    cancelada: { bg: "bg-red-100", text: "text-red-800" },
    realizada: { bg: "bg-purple-100", text: "text-purple-800" },
  };

  return colorMap[status] || { bg: "bg-gray-100", text: "text-gray-800" };
}
