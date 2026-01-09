import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ExportEntity = 'clients' | 'leads' | 'demands' | 'contracts' | 'expenses' | 'receivables' | 'payables' | 'team_members' | 'goals';

const entityLabels: Record<ExportEntity, string> = {
  clients: 'Clientes',
  leads: 'Leads',
  demands: 'Demandas',
  contracts: 'Contratos',
  expenses: 'Despesas',
  receivables: 'Contas a Receber',
  payables: 'Contas a Pagar',
  team_members: 'Equipe',
  goals: 'Metas',
};

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
          return String(value).replace(/,/g, ';');
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportEntity = async (entity: ExportEntity, format: 'csv' | 'json' = 'csv') => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      const { data, error } = await supabase
        .from(entity)
        .select('*')
        .eq('is_archived', false);

      setExportProgress(70);

      if (error) throw error;

      const filename = `${entity}_export`;
      
      if (format === 'csv') {
        exportToCSV(data || [], filename);
      } else {
        exportToJSON(data || [], filename);
      }

      setExportProgress(100);
      toast.success(`${entityLabels[entity]} exportados com sucesso!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportAll = async (format: 'csv' | 'json' = 'json') => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const entities: ExportEntity[] = ['clients', 'leads', 'demands', 'contracts', 'expenses', 'receivables', 'payables', 'team_members', 'goals'];
      const allData: Record<string, unknown[]> = {};

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        setExportProgress(Math.round((i / entities.length) * 80));

        const { data } = await supabase
          .from(entity)
          .select('*');

        allData[entity] = data || [];
      }

      setExportProgress(90);

      const filename = 'backup_completo';
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      setExportProgress(100);
      toast.success('Backup completo exportado com sucesso!');
    } catch (error) {
      console.error('Export all error:', error);
      toast.error('Erro ao exportar backup');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return {
    isExporting,
    exportProgress,
    exportEntity,
    exportAll,
    entityLabels,
  };
}
