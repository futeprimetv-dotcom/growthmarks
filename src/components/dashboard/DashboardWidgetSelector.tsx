import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";

interface Widget {
  id: string;
  label: string;
}

const AVAILABLE_WIDGETS: Widget[] = [
  { id: 'stats', label: 'Cards de Estatísticas' },
  { id: 'weeklyChart', label: 'Gráfico Semanal' },
  { id: 'revenueChart', label: 'Gráfico de Receita' },
  { id: 'urgentDemands', label: 'Demandas Urgentes' },
  { id: 'todayDeadlines', label: 'Prazos de Hoje' },
];

interface DashboardWidgetSelectorProps {
  visibleWidgets: string[];
  onToggleWidget: (widgetId: string) => void;
}

export function DashboardWidgetSelector({ visibleWidgets, onToggleWidget }: DashboardWidgetSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Personalizar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Widgets visíveis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AVAILABLE_WIDGETS.map((widget) => (
          <DropdownMenuCheckboxItem
            key={widget.id}
            checked={visibleWidgets.includes(widget.id)}
            onCheckedChange={() => onToggleWidget(widget.id)}
          >
            {widget.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
