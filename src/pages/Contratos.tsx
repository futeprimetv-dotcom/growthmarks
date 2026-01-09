import { useState } from "react";
import { contracts, getClientById } from "@/data/mockData";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, FileText, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function Contratos() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contratos</h1>
        <p className="text-muted-foreground">Gerencie contratos e pacotes de serviços</p>
      </div>

      <div className="grid gap-4">
        {contracts.map((contract) => {
          const isExpanded = expandedId === contract.id;
          const client = getClientById(contract.clientId);

          return (
            <Card
              key={contract.id}
              className={cn(
                "overflow-hidden transition-all cursor-pointer hover:shadow-lg",
                isExpanded && "ring-2 ring-primary"
              )}
              onClick={() => toggleExpand(contract.id)}
            >
              {/* Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">{client?.name}</h3>
                      <StatusBadge status={contract.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">{contract.type}</span>
                      <span>•</span>
                      <span>
                        {new Date(contract.startDate).toLocaleDateString('pt-BR')} - {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        R$ {contract.value.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contract.type === 'mensal' ? 'por mês' : 'valor total'}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t bg-secondary/30 p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Services */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Serviços Inclusos</h4>
                      <div className="flex flex-wrap gap-2">
                        {contract.services.map((service, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Vigência</p>
                          <p className="font-medium">
                            {new Date(contract.startDate).toLocaleDateString('pt-BR')} até {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-card">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Total Estimado</p>
                          <p className="font-medium">
                            R$ {(contract.value * 12).toLocaleString('pt-BR')}/ano
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
