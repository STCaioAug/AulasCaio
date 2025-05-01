import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export interface AlunoCardProps {
  id: number;
  nome: string;
  anoEscolar: string;
  materias?: string[];
  totalAulas?: number;
}

// Funções para formatar dados
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

export function AlunoCard({ id, nome, anoEscolar, materias = [], totalAulas = 0 }: AlunoCardProps) {
  // Iniciais para o avatar
  const iniciais = nome
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              {iniciais}
            </div>
            <div className="ml-3">
              <h3 className="font-medium">{nome}</h3>
              <p className="text-sm text-gray-500">
                {formatAnoEscolar(anoEscolar)}
                {materias.length > 0 && ` - ${materias.join(', ')}`}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 flex justify-between items-center">
          <div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
              {totalAulas} aulas este mês
            </Badge>
          </div>
          <Link href={`/alunos/${id}`}>
            <Button variant="ghost" className="text-primary-600 hover:text-primary-800">
              <GraduationCap className="h-4 w-4 mr-1" /> Detalhes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
