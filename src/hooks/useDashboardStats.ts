import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [
        clientsResult,
        demandsResult,
        servicesResult,
        expensesResult,
      ] = await Promise.all([
        supabase.from("clients").select("id, status, monthly_value").eq("status", "active"),
        supabase.from("demands").select("id, status, priority, deadline, title, client_id, assigned_to"),
        supabase.from("services").select("id, monthly_value, status").eq("status", "active"),
        supabase.from("expenses").select("id, value, category"),
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (demandsResult.error) throw demandsResult.error;
      if (servicesResult.error) throw servicesResult.error;
      if (expensesResult.error) throw expensesResult.error;

      const activeClients = clientsResult.data?.length || 0;
      const monthlyClientRevenue = clientsResult.data?.reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
      
      const demands = demandsResult.data || [];
      const inProgressDemands = demands.filter(d => d.status === "in_progress" || d.status === "todo" || d.status === "review").length;
      const urgentDemands = demands.filter(d => d.priority === "urgent" && d.status !== "done" && d.status !== "cancelled");
      
      const today = new Date();
      const nearDeadlineDemands = demands.filter(d => {
        if (!d.deadline || d.status === "done" || d.status === "cancelled") return false;
        const deadline = new Date(d.deadline);
        const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff <= 3 && diff >= 0;
      });

      const serviceRevenue = servicesResult.data?.reduce((sum, s) => sum + (s.monthly_value || 0), 0) || 0;
      const totalRevenue = monthlyClientRevenue + serviceRevenue;

      const totalExpenses = expensesResult.data?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;

      return {
        activeClients,
        inProgressDemands,
        urgentDemandsCount: urgentDemands.length,
        urgentDemands,
        nearDeadlineDemands,
        totalRevenue,
        totalExpenses,
        netRevenue: totalRevenue - totalExpenses,
      };
    },
  });
}

export function useRevenueChartData() {
  return useQuery({
    queryKey: ["revenue-chart"],
    queryFn: async () => {
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("monthly_value, start_date, status");

      if (servicesError) throw servicesError;

      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("monthly_value, contract_start, status");

      if (clientsError) throw clientsError;

      // Generate last 6 months data
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        
        // Calculate revenue for this month (simplified - just show current recurring)
        const serviceValue = services?.reduce((sum, s) => sum + (s.monthly_value || 0), 0) || 0;
        const clientValue = clients?.reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
        
        months.push({
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          valor: serviceValue + clientValue,
        });
      }

      return months;
    },
  });
}

export function useWeeklyDemandsData() {
  return useQuery({
    queryKey: ["weekly-demands"],
    queryFn: async () => {
      const { data: demands, error } = await supabase
        .from("demands")
        .select("created_at, status, updated_at");

      if (error) throw error;

      // Generate last 4 weeks data
      const weeks = [];
      const now = new Date();
      
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const newDemands = demands?.filter(d => {
          const created = new Date(d.created_at);
          return created >= weekStart && created <= weekEnd;
        }).length || 0;

        const completedDemands = demands?.filter(d => {
          if (d.status !== "done") return false;
          const updated = new Date(d.updated_at);
          return updated >= weekStart && updated <= weekEnd;
        }).length || 0;

        weeks.push({
          week: `Sem ${4 - i}`,
          novas: newDemands,
          concluidas: completedDemands,
        });
      }

      return weeks;
    },
  });
}
