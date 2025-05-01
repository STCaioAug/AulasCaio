import React, { useState } from "react";
import { Calendar as CalendarPt } from "@/components/ui/calendar-pt";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  PlusCircle 
} from "lucide-react";
import { AulaForm } from "./aula-form";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

// Enum para modo de visualização do calendário
enum ViewMode {
  Month = "month",
  Week = "week",
  Day = "day"
}

// Componente principal
export function CalendarioView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAulaForm, setShowAulaForm] = useState(false);
  const [aulaToEdit, setAulaToEdit] = useState<any | null>(null);

  // Calcular intervalo de datas para a consulta
  const getDateInterval = () => {
    switch (viewMode) {
      case ViewMode.Month:
        return {
          inicio: startOfMonth(currentDate),
          fim: endOfMonth(currentDate)
        };
      case ViewMode.Week:
        return {
          inicio: startOfWeek(currentDate, { weekStartsOn: 0 }),
          fim: endOfWeek(currentDate, { weekStartsOn: 0 })
        };
      case ViewMode.Day:
        return {
          inicio: currentDate,
          fim: currentDate
        };
    }
  };

  const { inicio, fim } = getDateInterval();

  // Buscar aulas do período
  const { data: aulas, isLoading } = useQuery({
    queryKey: [`/api/aulas?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`],
  });

  // Navegar entre períodos
  const navigateToPrevious = () => {
    switch (viewMode) {
      case ViewMode.Month:
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case ViewMode.Week:
        const newWeekDate = new Date(currentDate);
        newWeekDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newWeekDate);
        break;
      case ViewMode.Day:
        const newDayDate = new Date(currentDate);
        newDayDate.setDate(currentDate.getDate() - 1);
        setCurrentDate(newDayDate);
        break;
    }
  };

  const navigateToNext = () => {
    switch (viewMode) {
      case ViewMode.Month:
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case ViewMode.Week:
        const newWeekDate = new Date(currentDate);
        newWeekDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newWeekDate);
        break;
      case ViewMode.Day:
        const newDayDate = new Date(currentDate);
        newDayDate.setDate(currentDate.getDate() + 1);
        setCurrentDate(newDayDate);
        break;
    }
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  // Abrir formulário para adicionar aula
  const handleAddAula = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setAulaToEdit(null);
    setShowAulaForm(true);
  };

  // Abrir formulário para editar aula
  const handleEditAula = (aula: any) => {
    setAulaToEdit(aula);
    setShowAulaForm(true);
  };

  // Verificar se existem aulas em uma determinada data
  const getAulasForDate = (date: Date) => {
    if (!aulas) return [];
    return aulas.filter((aula: any) => isSameDay(new Date(aula.data), date));
  };

  // Formatar o título para o período atual
  const getFormattedTitle = () => {
    switch (viewMode) {
      case ViewMode.Month:
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
      case ViewMode.Week:
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(weekStart, "dd", { locale: ptBR })} - ${format(weekEnd, "dd")} de ${format(weekEnd, "MMMM", { locale: ptBR })}`;
      case ViewMode.Day:
        return format(currentDate, "dd 'de' MMMM yyyy", { locale: ptBR });
    }
  };

  // Renderizar conteúdo da visualização mensal
  const renderMonthView = () => {
    // Renderizar células do calendário com aulas
    const renderCalendarCell = (date: Date) => {
      const aulasDodia = getAulasForDate(date);
      const isOutsideMonth = !isSameMonth(date, currentDate);
      
      return (
        <div className={`p-2 h-32 text-sm ${isOutsideMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}>
          <div className="flex justify-between">
            <span>{format(date, "d")}</span>
            {!isOutsideMonth && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 text-primary-600 hover:text-primary-800 -mt-1 -mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddAula(date);
                }}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
            {aulasDodia.map((aula: any) => (
              <div
                key={aula.id}
                className={`text-xs p-1 rounded cursor-pointer truncate
                  ${aula.status === 'agendada' ? 'bg-primary-100 text-primary-800' : ''}
                  ${aula.status === 'confirmada' ? 'bg-green-100 text-green-800' : ''}
                  ${aula.status === 'cancelada' ? 'bg-red-100 text-red-800' : ''}
                  ${aula.status === 'realizada' ? 'bg-purple-100 text-purple-800' : ''}
                `}
                onClick={() => handleEditAula(aula)}
              >
                <p className="truncate">{format(new Date(aula.data), "HH:mm")} - {aula.aluno?.nome}</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
          <div className="bg-white p-2 text-center text-sm font-medium text-gray-500">Dom</div>
          <div className="bg-white p-2 text-center text-sm font-medium text-gray-500">Seg</div>
          <div className="bg-white p-2 text-center text-sm font-medium text-gray-500">Ter</div>
          <div className="bg-white p-2 text-center text-sm font-medium text-gray-500">Qua</div>
          <div className="bg-white p-2 text-center text-sm font-medium text-gray-500">Qui</div>
          <div className="bg-white p-2 text-center text-sm font-medium text-gray-500">Sex</div>
          <div className="bg-white p-2 text-center text-sm font-medium text-gray-500">Sáb</div>
        </div>
        
        {/* Calendário com data picker customizado */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Este é apenas um exemplo visual - na implementação real, seria gerado dinamicamente baseado no calendário */}
          {Array.from({ length: 35 }).map((_, index) => {
            // Calcular a data para cada célula
            const firstDayOfMonth = startOfMonth(currentDate);
            const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + index);
            
            return (
              <div 
                key={index} 
                className="cursor-pointer"
                onClick={() => setSelectedDate(cellDate)}
              >
                {renderCalendarCell(cellDate)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar visualização da semana (simplificada)
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
          {Array.from({ length: 7 }).map((_, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            return (
              <div key={index} className="bg-white p-2 text-center">
                <div className="text-sm font-medium text-gray-500">
                  {format(date, "EEEEEE", { locale: ptBR })}
                </div>
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center mx-auto mt-1
                    ${isSameDay(date, new Date()) ? "bg-primary-600 text-white" : ""}
                  `}
                >
                  {format(date, "d")}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="divide-y">
          {Array.from({ length: 7 }).map((_, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            const aulasDodia = getAulasForDate(date);
            
            return (
              <div key={index} className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">
                    {format(date, "EEEE", { locale: ptBR })}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => handleAddAula(date)}
                  >
                    <PlusCircle className="h-3 w-3 mr-1" /> Aula
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {aulasDodia.length === 0 ? (
                    <p className="text-sm text-gray-400 py-1">Nenhuma aula agendada</p>
                  ) : (
                    aulasDodia.map((aula: any) => (
                      <div 
                        key={aula.id} 
                        className="p-2 rounded-md border text-sm cursor-pointer hover:bg-gray-50"
                        onClick={() => handleEditAula(aula)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{format(new Date(aula.data), "HH:mm")} - {aula.aluno?.nome}</p>
                            <p className="text-xs text-gray-500">{aula.materia?.nome} - {aula.duracao} min</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`
                              ${aula.status === 'agendada' ? 'bg-primary-100 text-primary-800' : ''}
                              ${aula.status === 'confirmada' ? 'bg-green-100 text-green-800' : ''}
                              ${aula.status === 'cancelada' ? 'bg-red-100 text-red-800' : ''}
                              ${aula.status === 'realizada' ? 'bg-purple-100 text-purple-800' : ''}
                            `}
                          >
                            {aula.status === 'agendada' ? 'Agendada' : ''}
                            {aula.status === 'confirmada' ? 'Confirmada' : ''}
                            {aula.status === 'cancelada' ? 'Cancelada' : ''}
                            {aula.status === 'realizada' ? 'Realizada' : ''}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar visualização do dia
  const renderDayView = () => {
    const aulasDodia = getAulasForDate(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium">
            {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
        </div>
        
        <div className="p-4">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAddAula(currentDate)}
            >
              <PlusCircle className="h-4 w-4 mr-1" /> Nova Aula
            </Button>
          </div>
          
          <div className="space-y-3">
            {aulasDodia.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>Nenhuma aula agendada para este dia</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleAddAula(currentDate)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Agendar Aula
                </Button>
              </div>
            ) : (
              aulasDodia.map((aula: any) => (
                <div 
                  key={aula.id} 
                  className="p-3 rounded-md border cursor-pointer hover:bg-gray-50"
                  onClick={() => handleEditAula(aula)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{format(new Date(aula.data), "HH:mm")} - {aula.aluno?.nome}</p>
                      <p className="text-sm text-gray-500">{aula.materia?.nome}</p>
                      <p className="text-xs text-gray-500 mt-1">Duração: {aula.duracao} minutos</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${aula.status === 'agendada' ? 'bg-primary-100 text-primary-800' : ''}
                        ${aula.status === 'confirmada' ? 'bg-green-100 text-green-800' : ''}
                        ${aula.status === 'cancelada' ? 'bg-red-100 text-red-800' : ''}
                        ${aula.status === 'realizada' ? 'bg-purple-100 text-purple-800' : ''}
                      `}
                    >
                      {aula.status === 'agendada' ? 'Agendada' : ''}
                      {aula.status === 'confirmada' ? 'Confirmada' : ''}
                      {aula.status === 'cancelada' ? 'Cancelada' : ''}
                      {aula.status === 'realizada' ? 'Realizada' : ''}
                    </Badge>
                  </div>
                  {aula.observacoes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {aula.observacoes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <CardTitle className="text-lg">Calendário</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={navigateToToday}>
                Hoje
              </Button>
              <Button variant="ghost" size="icon" onClick={navigateToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600 min-w-24 text-center">
                {getFormattedTitle()}
              </span>
              <Button variant="ghost" size="icon" onClick={navigateToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <select
                className="px-2 py-1 text-sm border rounded-md"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
              >
                <option value={ViewMode.Month}>Mês</option>
                <option value={ViewMode.Week}>Semana</option>
                <option value={ViewMode.Day}>Dia</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {viewMode === ViewMode.Month && renderMonthView()}
              {viewMode === ViewMode.Week && renderWeekView()}
              {viewMode === ViewMode.Day && renderDayView()}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Legenda */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-medium mb-2">Legenda</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-primary-100 border border-primary-300 rounded mr-2"></div>
              <span className="text-sm">Aula Agendada</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span className="text-sm">Aula Confirmada</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
              <span className="text-sm">Aula Cancelada</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
              <span className="text-sm">Aula Realizada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de aula */}
      <AulaForm 
        open={showAulaForm} 
        onOpenChange={setShowAulaForm} 
        initialDate={selectedDate} 
        aula={aulaToEdit}
      />
    </div>
  );
}
