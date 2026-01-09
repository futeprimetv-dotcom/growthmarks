import { cn } from "@/lib/utils";

// Support both legacy (green/yellow/red) and database (low/medium/high/urgent) priority types
type LegacyPriority = "green" | "yellow" | "red";
type DatabasePriority = "low" | "medium" | "high" | "urgent";
export type Priority = LegacyPriority | DatabasePriority;

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  // Legacy colors
  green: { label: "Normal", className: "bg-success text-success-foreground" },
  yellow: { label: "Atenção", className: "bg-warning text-warning-foreground" },
  red: { label: "Urgente", className: "bg-destructive text-destructive-foreground" },
  // Database priorities
  low: { label: "Baixa", className: "bg-success text-success-foreground" },
  medium: { label: "Média", className: "bg-primary text-primary-foreground" },
  high: { label: "Alta", className: "bg-warning text-warning-foreground" },
  urgent: { label: "Urgente", className: "bg-destructive text-destructive-foreground" },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  if (!config) return null;
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}
