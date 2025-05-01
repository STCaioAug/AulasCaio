import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  trendDirection?: "up" | "down" | "neutral";
  colorClass?: string;
  href?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  trendDirection = "neutral",
  colorClass = "card-primary",
  href,
}: StatsCardProps) {
  const content = (
    <Card className={cn("hover:shadow-lg transition-shadow cursor-pointer card-with-border-left", colorClass)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <h3 className="text-2xl font-semibold text-gray-800">{value}</h3>
          </div>
          <div className="p-2 bg-primary-100 rounded-md text-primary-600">
            {icon}
          </div>
        </div>
        {trend && (
          <div className={cn("mt-2 text-xs", {
            "text-green-600": trendDirection === "up",
            "text-red-600": trendDirection === "down",
            "text-yellow-600": trendDirection === "neutral",
          })}>
            <span>
              {trendDirection === "up" && <ArrowUpIcon className="inline-block w-3 h-3 mr-1" />}
              {trendDirection === "down" && <ArrowDownIcon className="inline-block w-3 h-3 mr-1" />}
              {trendDirection === "neutral" && <MinusIcon className="inline-block w-3 h-3 mr-1" />}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
