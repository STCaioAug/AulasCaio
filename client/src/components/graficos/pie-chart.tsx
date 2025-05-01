import React from "react";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PieChartProps {
  data: any[];
  title: string;
  nameKey: string;
  valueKey: string;
  colors?: string[];
  height?: number;
  filters?: {
    options: { value: string; label: string }[];
    selectedOption: string;
    onOptionChange: (value: string) => void;
  };
  tooltip?: boolean;
  legend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  legendPosition?: "top" | "right" | "bottom" | "left";
}

export function PieChart({
  data,
  title,
  nameKey,
  valueKey,
  colors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"],
  height = 300,
  filters,
  tooltip = true,
  legend = true,
  innerRadius = 0,
  outerRadius = 80,
  legendPosition = "bottom"
}: PieChartProps) {
  // Garantir que existam cores suficientes para todos os dados
  const ensureColors = () => {
    if (data.length <= colors.length) return colors;
    
    // Se não houver cores suficientes, repete as existentes
    const extendedColors = [...colors];
    while (extendedColors.length < data.length) {
      extendedColors.push(...colors.slice(0, data.length - extendedColors.length));
    }
    return extendedColors;
  };
  
  const chartColors = ensureColors();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {filters && (
            <Select
              value={filters.selectedOption}
              onValueChange={filters.onOptionChange}
            >
              <SelectTrigger className="h-8 w-auto text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filters.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                fill="#8884d8"
                dataKey={valueKey}
                nameKey={nameKey}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              {tooltip && <Tooltip />}
              {legend && <Legend layout="horizontal" verticalAlign={legendPosition} align="center" />}
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legenda alternativa para visualização móvel (quando necessário) */}
        {data.length > 3 && (
          <div className="grid grid-cols-2 gap-2 mt-4 md:hidden">
            {data.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                <span className="text-xs truncate">
                  {entry[nameKey]}: {typeof entry[valueKey] === 'number' ? entry[valueKey].toFixed(0) : entry[valueKey]}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
