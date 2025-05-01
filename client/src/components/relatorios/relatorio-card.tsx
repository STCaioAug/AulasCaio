import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface RelatorioCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  onClick: () => void;
  buttonText?: string;
}

export function RelatorioCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary-600",
  onClick,
  buttonText = "Gerar Relatório"
}: RelatorioCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className={`p-3 bg-primary-100 rounded-md ${iconColor} inline-block mb-3`}>
          <Icon className="text-xl h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>
        <Button 
          onClick={onClick}
          className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 transition-colors"
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
