import { useUserRole } from "@/hooks/useUserRole";
import { Lock } from "lucide-react";

interface ProtectedValueProps {
  value: string | number;
  formatAsCurrency?: boolean;
  className?: string;
}

/**
 * Component that hides financial values from users without permission
 * Only users with 'gestao' role can see the actual values
 */
export function ProtectedValue({ value, formatAsCurrency = true, className = "" }: ProtectedValueProps) {
  const { canViewValues } = useUserRole();

  if (!canViewValues) {
    return (
      <span className={`inline-flex items-center gap-1 text-muted-foreground ${className}`}>
        <Lock className="h-3 w-3" />
        <span className="blur-sm select-none" aria-hidden="true">
          {formatAsCurrency ? "R$ •••••" : "•••••"}
        </span>
      </span>
    );
  }

  if (formatAsCurrency && typeof value === 'number') {
    return (
      <span className={className}>
        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    );
  }

  return <span className={className}>{value}</span>;
}

/**
 * Hook to format currency with protection
 */
export function useProtectedCurrency() {
  const { canViewValues } = useUserRole();

  const formatCurrency = (value: number): string => {
    if (!canViewValues) {
      return "R$ •••••";
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return { formatCurrency, canViewValues };
}
