import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export interface AvailableHour {
  id: number;
  day: {
    short: string;
    long: string;
  };
  startTime: string;
  endTime: string;
  duration: number;
}

interface AvailableHoursProps {
  hours: AvailableHour[];
  title?: string;
  onAdd?: (hour: AvailableHour) => void;
  maxHeight?: string;
}

export function AvailableHours({ hours, title = "Horários Vagos na Semana", onAdd, maxHeight = "max-h-60" }: AvailableHoursProps) {
  return (
    <Card className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-semibold text-gray-800">{title}</h3>
        <button className="text-sm text-primary-600 hover:underline">Ver todos</button>
      </div>
      <div className={`overflow-auto ${maxHeight}`}>
        {hours.map((hour) => (
          <div key={hour.id} className="flex py-2 border-b">
            <div className="w-16 text-xs font-semibold text-gray-600 bg-gray-100 flex items-center justify-center rounded p-1">
              {hour.day.short}
            </div>
            <div className="ml-2">
              <p className="font-medium text-sm">{hour.startTime} - {hour.endTime}</p>
              <p className="text-xs text-gray-500">{hour.duration} horas disponíveis</p>
            </div>
            {onAdd && (
              <button 
                className="ml-auto text-primary-600 hover:text-primary-800"
                onClick={() => onAdd(hour)}
                aria-label="Adicionar aula"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
        
        {hours.length === 0 && (
          <div className="py-4 text-center text-gray-500">
            Nenhum horário vago disponível.
          </div>
        )}
      </div>
    </Card>
  );
}
