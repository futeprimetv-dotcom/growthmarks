import { cn } from "@/lib/utils";

// Support multiple status types from different contexts
type StatusType = 
  | "ativo" | "pausado" | "encerrado" // Client
  | "pago" | "pendente" | "atrasado" // Payment
  | "renovacao" // Contract
  | "disponivel" | "ocupado" // Team
  | "active" | "inactive" | "pending" // English variants from database
  | string; // Allow any string for flexibility

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Client status (Portuguese)
  ativo: { label: "Ativo", className: "bg-success/20 text-success border-success/30" },
  pausado: { label: "Pausado", className: "bg-warning/20 text-warning border-warning/30" },
  encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground border-muted" },
  // Client status (English - from database)
  active: { label: "Ativo", className: "bg-success/20 text-success border-success/30" },
  inactive: { label: "Inativo", className: "bg-muted text-muted-foreground border-muted" },
  // Payment status
  pago: { label: "Pago", className: "bg-success/20 text-success border-success/30" },
  pendente: { label: "Pendente", className: "bg-warning/20 text-warning border-warning/30" },
  pending: { label: "Pendente", className: "bg-warning/20 text-warning border-warning/30" },
  atrasado: { label: "Atrasado", className: "bg-destructive/20 text-destructive border-destructive/30" },
  // Contract status
  renovacao: { label: "Em Renovação", className: "bg-warning/20 text-warning border-warning/30" },
  // Team status
  disponivel: { label: "Disponível", className: "bg-success/20 text-success border-success/30" },
  ocupado: { label: "Ocupado", className: "bg-warning/20 text-warning border-warning/30" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          "bg-secondary text-secondary-foreground border-secondary",
          className
        )}
      >
        {status}
      </span>
    );
  }
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
