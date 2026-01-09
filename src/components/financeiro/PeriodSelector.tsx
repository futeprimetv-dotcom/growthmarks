import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PeriodSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onPeriodChange: (month: number, year: number) => void;
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function PeriodSelector({ selectedMonth, selectedYear, onPeriodChange }: PeriodSelectorProps) {
  const currentDate = new Date(selectedYear, selectedMonth - 1, 1);
  const today = new Date();
  const isCurrentPeriod = selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();
  const isFuturePeriod = currentDate > today;

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    onPeriodChange(newDate.getMonth() + 1, newDate.getFullYear());
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    onPeriodChange(newDate.getMonth() + 1, newDate.getFullYear());
  };

  const handleGoToToday = () => {
    onPeriodChange(today.getMonth() + 1, today.getFullYear());
  };

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(v) => onPeriodChange(parseInt(v), selectedYear)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedYear.toString()} 
            onValueChange={(v) => onPeriodChange(selectedMonth, parseInt(v))}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!isCurrentPeriod && (
        <Button variant="ghost" size="sm" onClick={handleGoToToday} className="gap-2">
          <Calendar className="h-4 w-4" />
          Hoje
        </Button>
      )}

      {isFuturePeriod && (
        <span className="text-sm text-muted-foreground bg-primary/10 px-2 py-1 rounded">
          📅 Planejamento futuro
        </span>
      )}

      {!isCurrentPeriod && !isFuturePeriod && (
        <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
          📊 Período passado
        </span>
      )}
    </div>
  );
}
