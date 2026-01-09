import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import type { Demand, DemandStatus } from "@/data/mockData";

interface KanbanBoardProps {
  demands: Demand[];
  onDemandMove: (demandId: string, newStatus: DemandStatus) => void;
}

const columns: { id: DemandStatus; title: string }[] = [
  { id: "entrada", title: "Entrada" },
  { id: "planejamento", title: "Planejamento" },
  { id: "producao", title: "Em Produção" },
  { id: "revisao", title: "Revisão" },
  { id: "entregue", title: "Entregue" },
];

export function KanbanBoard({ demands, onDemandMove }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find(col => col.id === overId);
    if (targetColumn) {
      onDemandMove(activeId, targetColumn.id);
    } else {
      // Dropped on another card, find its column
      const targetDemand = demands.find(d => d.id === overId);
      if (targetDemand) {
        onDemandMove(activeId, targetDemand.status);
      }
    }

    setActiveId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeDemand = demands.find(d => d.id === activeId);
    if (!activeDemand) return;

    // Check if over a column
    const targetColumn = columns.find(col => col.id === overId);
    if (targetColumn && activeDemand.status !== targetColumn.id) {
      onDemandMove(activeId, targetColumn.id);
      return;
    }

    // Check if over another demand
    const overDemand = demands.find(d => d.id === overId);
    if (overDemand && activeDemand.status !== overDemand.status) {
      onDemandMove(activeId, overDemand.status);
    }
  };

  const activeDemand = activeId ? demands.find(d => d.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)]">
        {columns.map((column) => {
          const columnDemands = demands.filter(d => d.status === column.id);
          
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={columnDemands.length}
            >
              <SortableContext
                items={columnDemands.map(d => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnDemands.map((demand) => (
                  <KanbanCard key={demand.id} demand={demand} />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeDemand ? (
          <KanbanCard demand={activeDemand} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
