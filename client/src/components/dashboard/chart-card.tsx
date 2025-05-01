import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  options?: {
    value: string;
    label: string;
  }[];
  onOptionChange?: (value: string) => void;
  selectedOption?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ChartCard({
  title,
  children,
  options,
  onOptionChange,
  selectedOption,
  actionLabel,
  onAction,
}: ChartCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-semibold text-gray-800">{title}</h3>
        <div className="flex space-x-2">
          {options && onOptionChange && (
            <Select
              value={selectedOption}
              onValueChange={onOptionChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="text-sm text-primary-600 hover:underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}
