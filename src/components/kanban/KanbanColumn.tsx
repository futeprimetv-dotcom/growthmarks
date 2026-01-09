import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 bg-secondary/30 rounded-xl flex flex-col",
        isOver && "ring-2 ring-primary bg-primary/5"
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground bg-card px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px]">
        {children}
      </div>
    </div>
  );
}
