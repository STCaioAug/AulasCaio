import React from "react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BarChartProps {
  data: any[];
  title: string;
  xAxisKey: string;
  yAxisKey: string;
  barColor?: string;
  height?: number;
  filters?: {
    options: { value: string; label: string }[];
    selectedOption: string;
    onOptionChange: (value: string) => void;
  };
  tooltip?: boolean;
  grid?: boolean;
  legend?: boolean;
  barName?: string;
}

export function BarChart({
  data,
  title,
  xAxisKey,
  yAxisKey,
  barColor = "var(--primary)",
  height = 300,
  filters,
  tooltip = true,
  grid = true,
  legend = false,
  barName
}: BarChartProps) {
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
            <RechartsBarChart
              data={data}
              margin={{
                top: 5,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >
              {grid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              {tooltip && <Tooltip />}
              {legend && <Legend />}
              <Bar
                dataKey={yAxisKey}
                name={barName || yAxisKey}
                fill={barColor}
                radius={[4, 4, 0, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
