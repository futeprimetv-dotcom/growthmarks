import { Badge } from "@/components/ui/badge";

interface Props {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  qualificado: { label: "Qualificado", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  contatado: { label: "Contatado", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  descartado: { label: "Descartado", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" }
};

export function ProspectStatusBadge({ status }: Props) {
  const config = statusConfig[status] || statusConfig.novo;
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
