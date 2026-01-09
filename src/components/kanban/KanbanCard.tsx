import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getClientById, getTeamMemberById, type Demand } from "@/data/mockData";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Calendar, User, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  demand: Demand;
  isDragging?: boolean;
}

export function KanbanCard({ demand, isDragging }: KanbanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const client = getClientById(demand.clientId);
  const responsible = getTeamMemberById(demand.responsibleId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: demand.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card rounded-lg border p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
        (isDragging || isSortableDragging) && "opacity-50 shadow-xl rotate-2",
        demand.priority === 'red' && "border-l-4 border-l-destructive"
      )}
    >
      {/* Drag Handle & Priority */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <PriorityBadge priority={demand.priority} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Title & Client */}
      <h4 className="font-medium text-sm mb-1 line-clamp-2">{demand.title}</h4>
      <p className="text-xs text-muted-foreground mb-3">{client?.name}</p>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {responsible?.name}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(demand.deadline).toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t text-sm">
          <p className="text-muted-foreground">{demand.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Criado em:</span>
            <span className="text-xs">
              {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
