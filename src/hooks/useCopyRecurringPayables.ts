import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CopyRecurringParams {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
}

export function useCopyRecurringPayables() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromMonth, fromYear, toMonth, toYear }: CopyRecurringParams) => {
      // Check if target month already has recurring items copied
      const { data: existingItems, error: checkError } = await supabase
        .from("payables")
        .select("id")
        .eq("reference_month", toMonth)
        .eq("reference_year", toYear)
        .eq("recurring", true)
        .eq("is_archived", false)
        .limit(1);

      if (checkError) throw checkError;

      // If already has recurring items, skip copy
      if (existingItems && existingItems.length > 0) {
        return { copied: 0, skipped: true };
      }

      // Get recurring items from previous month
      const { data: recurringItems, error: fetchError } = await supabase
        .from("payables")
        .select("*")
        .eq("reference_month", fromMonth)
        .eq("reference_year", fromYear)
        .eq("recurring", true)
        .eq("is_archived", false);

      if (fetchError) throw fetchError;

      if (!recurringItems || recurringItems.length === 0) {
        return { copied: 0, skipped: false };
      }

      // Create new items for the target month
      const newItems = recurringItems.map((item) => {
        // Calculate new due date (same day, new month/year)
        const oldDueDate = new Date(item.due_date);
        const day = oldDueDate.getDate();
        
        // Handle months with fewer days
        const newDate = new Date(toYear, toMonth - 1, 1);
        const lastDayOfMonth = new Date(toYear, toMonth, 0).getDate();
        const adjustedDay = Math.min(day, lastDayOfMonth);
        newDate.setDate(adjustedDay);

        return {
          description: item.description,
          category: item.category,
          value: item.value,
          due_date: newDate.toISOString().split('T')[0],
          reference_month: toMonth,
          reference_year: toYear,
          status: "pending",
          supplier: item.supplier,
          notes: item.notes,
          recurring: true,
        };
      });

      const { error: insertError } = await supabase
        .from("payables")
        .insert(newItems);

      if (insertError) throw insertError;

      return { copied: newItems.length, skipped: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      if (result.skipped) {
        // Do nothing, already copied
      } else if (result.copied > 0) {
        toast.success(`${result.copied} contas recorrentes copiadas para o período!`);
      }
    },
    onError: (error) => {
      console.error("Error copying recurring payables:", error);
      toast.error("Erro ao copiar contas recorrentes");
    },
  });
}

export function useCopyRecurringReceivables() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromMonth, fromYear, toMonth, toYear }: CopyRecurringParams) => {
      // Check if target month already has recurring items copied (use a marker)
      const { data: existingItems, error: checkError } = await supabase
        .from("receivables")
        .select("id")
        .eq("reference_month", toMonth)
        .eq("reference_year", toYear)
        .eq("is_archived", false)
        .limit(1);

      if (checkError) throw checkError;

      // If already has items, assume recurring were copied
      if (existingItems && existingItems.length > 0) {
        return { copied: 0, skipped: true };
      }

      // Get items from previous month that could be recurring (services are typically recurring)
      // For receivables, we don't have a recurring flag, so we skip this for now
      return { copied: 0, skipped: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
    },
    onError: (error) => {
      console.error("Error copying recurring receivables:", error);
    },
  });
}
