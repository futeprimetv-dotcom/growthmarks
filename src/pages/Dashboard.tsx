import { StatCard } from "@/components/dashboard/StatCard";
import { UrgentDemandsList } from "@/components/dashboard/UrgentDemandsList";
import { TodayDeadlinesList } from "@/components/dashboard/TodayDeadlinesList";
import { WeeklyDemandsChart } from "@/components/dashboard/WeeklyDemandsChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DashboardWidgetSelector } from "@/components/dashboard/DashboardWidgetSelector";
import { DraggableWidget } from "@/components/dashboard/DraggableWidget";
import { Users, Kanban, AlertTriangle, DollarSign, CheckCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardLayout, useUpdateDashboardLayout } from "@/hooks/useDashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { useProtectedCurrency } from "@/components/ui/protected-value";
import { Navigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";

type WidgetId = 'stats' | 'weeklyChart' | 'revenueChart' | 'urgentDemands' | 'todayDeadlines';

const DEFAULT_WIDGETS: WidgetId[] = ['stats', 'weeklyChart', 'revenueChart', 'urgentDemands', 'todayDeadlines'];
const DEFAULT_VISIBLE = ['stats', 'urgentDemands', 'todayDeadlines', 'weeklyChart', 'revenueChart'];

export default function Dashboard() {
  const { canViewDashboard, loading: roleLoading } = useUserRole();
  const { formatCurrency } = useProtectedCurrency();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: layoutData, isLoading: layoutLoading } = useDashboardLayout();
  const updateLayout = useUpdateDashboardLayout();

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(DEFAULT_VISIBLE);

  useEffect(() => {
    if (layoutData) {
      if (layoutData.layout && Array.isArray(layoutData.layout) && layoutData.layout.length > 0) {
        setWidgetOrder(layoutData.layout as WidgetId[]);
      }
      if (layoutData.visible_widgets && Array.isArray(layoutData.visible_widgets)) {
        setVisibleWidgets(layoutData.visible_widgets);
      }
    }
  }, [layoutData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as WidgetId);
        const newIndex = items.indexOf(over.id as WidgetId);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        updateLayout.mutate({ layout: newOrder });
        return newOrder;
      });
    }
  }, [updateLayout]);

  const handleToggleWidget = useCallback((widgetId: string) => {
    setVisibleWidgets((prev) => {
      const newVisible = prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId];
      
      updateLayout.mutate({ visible_widgets: newVisible });
      return newVisible;
    });
  }, [updateLayout]);

  const isLoading = roleLoading || statsLoading || layoutLoading;

  const widgets = useMemo(() => ({
    stats: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Clientes Ativos"
          value={stats?.activeClients || 0}
          icon={Users}
        />
        <StatCard
          title="Demandas em Andamento"
          value={stats?.inProgressDemands || 0}
          icon={Kanban}
        />
        <StatCard
          title="Demandas Urgentes"
          value={stats?.urgentDemandsCount || 0}
          icon={AlertTriangle}
          variant="destructive"
        />
        <StatCard
          title="Faturamento Mensal"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Receita Líquida"
          value={formatCurrency(stats?.netRevenue || 0)}
          icon={CheckCircle}
        />
      </div>
    ),
    weeklyChart: <WeeklyDemandsChart />,
    revenueChart: <RevenueChart />,
    urgentDemands: <UrgentDemandsList />,
    todayDeadlines: <TodayDeadlinesList />,
  }), [stats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!canViewDashboard) {
    return <Navigate to="/producao" replace />;
  }

  const visibleOrderedWidgets = widgetOrder.filter(id => visibleWidgets.includes(id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        <DashboardWidgetSelector 
          visibleWidgets={visibleWidgets} 
          onToggleWidget={handleToggleWidget} 
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleOrderedWidgets} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {visibleOrderedWidgets.map((widgetId) => (
              <DraggableWidget key={widgetId} id={widgetId}>
                {widgets[widgetId]}
              </DraggableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
