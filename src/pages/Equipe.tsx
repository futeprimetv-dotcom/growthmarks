import { useState } from "react";
import { teamMembers, getDemandsByResponsible, demands } from "@/data/mockData";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Briefcase, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/priority-badge";

export default function Equipe() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Equipe</h1>
        <p className="text-muted-foreground">Gerencie a equipe e suas demandas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamMembers.map((member) => {
          const isExpanded = expandedId === member.id;
          const memberDemands = getDemandsByResponsible(member.id).filter(d => d.status !== 'entregue');

          return (
            <Card
              key={member.id}
              className={cn(
                "overflow-hidden transition-all cursor-pointer hover:shadow-lg",
                isExpanded && "ring-2 ring-primary"
              )}
              onClick={() => toggleExpand(member.id)}
            >
              {/* Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{member.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        {member.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={member.status} />
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                    <Kanban className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{memberDemands.length} demandas</span>
                  </div>
                </div>
              </div>

              {/* Expanded Content - Demands List */}
              {isExpanded && memberDemands.length > 0 && (
                <div className="border-t bg-secondary/30 p-6" onClick={(e) => e.stopPropagation()}>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                    Demandas Atribuídas
                  </h4>
                  <div className="space-y-3">
                    {memberDemands.map((demand) => (
                      <div
                        key={demand.id}
                        className="p-4 rounded-lg bg-card border flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{demand.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Prazo: {new Date(demand.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <PriorityBadge priority={demand.priority} />
                      </div>
                    ))}
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
