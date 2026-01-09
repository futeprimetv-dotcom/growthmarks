import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  novo: "Novo",
  contato_inicial: "Contato Inicial",
  em_qualificacao: "Em Qualificação",
  reuniao_agendada: "Reunião Agendada",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  fechamento: "Fechamento",
  perdido: "Perdido",
  lead_frio: "Lead Frio",
  em_contato: "Em Contato",
};

const temperatureLabels: Record<string, string> = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

export function LeadExportButton() {
  const { data: leads } = useLeads();
  const { data: teamMembers } = useTeamMembers();

  const handleExport = () => {
    if (!leads || leads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }

    const exportData = leads.map((lead) => {
      const responsible = teamMembers?.find(m => m.id === lead.responsible_id);
      
      return {
        "Nome": lead.name,
        "Empresa": lead.company || "",
        "Email": lead.email || "",
        "Telefone": lead.phone || "",
        "WhatsApp": (lead as any).whatsapp || "",
        "Instagram": (lead as any).instagram || "",
        "Cidade": (lead as any).city || "",
        "Estado": (lead as any).state || "",
        "Serviço de Interesse": lead.service_interest || "",
        "Valor Estimado": lead.estimated_value || 0,
        "Status": statusLabels[lead.status] || lead.status,
        "Temperatura": temperatureLabels[lead.temperature] || lead.temperature,
        "Origem": lead.origin || "",
        "Responsável": responsible?.name || "",
        "Próxima Ação": lead.next_action || "",
        "Data Próxima Ação": lead.next_action_date || "",
        "Probabilidade Fechamento (%)": (lead as any).closing_probability || 0,
        "Data Prevista Fechamento": (lead as any).expected_close_date || "",
        "Observações": lead.notes || "",
        "Data Criação": new Date(lead.created_at).toLocaleDateString("pt-BR"),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    // Auto-size columns
    const maxWidth = 50;
    const cols = Object.keys(exportData[0]).map((key) => ({
      wch: Math.min(maxWidth, Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row] || "").length)))
    }));
    worksheet["!cols"] = cols;

    const fileName = `leads_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Leads exportados com sucesso!");
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Exportar Excel
    </Button>
  );
}
