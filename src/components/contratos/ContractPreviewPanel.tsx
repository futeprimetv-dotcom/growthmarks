import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ContractPreviewPanelProps {
  content: string;
  className?: string;
}

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = {
  cliente_nome: "Empresa Exemplo LTDA",
  cliente_cnpj: "12.345.678/0001-90",
  cliente_endereco: "Rua das Flores, 123 - Centro, São Paulo/SP",
  empresa_nome: "Growth Marks Agência Digital",
  empresa_cnpj: "98.765.432/0001-10",
  empresa_endereco: "Av. Paulista, 1000 - Bela Vista, São Paulo/SP",
  valor: "5.000,00",
  data_inicio: format(new Date(), "dd/MM/yyyy", { locale: ptBR }),
  data_fim: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "dd/MM/yyyy", { locale: ptBR }),
  cidade: "São Paulo",
  data_atual: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
};

export function ContractPreviewPanel({ content, className }: ContractPreviewPanelProps) {
  const renderedContent = useMemo(() => {
    let processedContent = content;
    
    // Replace all variables with sample data
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processedContent = processedContent.replace(regex, `<span class="bg-primary/10 text-primary px-1 rounded">${value}</span>`);
    });
    
    return processedContent;
  }, [content]);

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white dark:bg-zinc-900", className)}>
      <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">Preview</span>
        <span className="text-xs text-muted-foreground">Dados de exemplo</span>
      </div>
      <ScrollArea className="h-[500px]">
        <div 
          className="p-8 prose prose-sm max-w-none dark:prose-invert
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h2]:text-center
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2
            [&_p]:my-2 [&_p]:text-sm
            [&_ul]:list-disc [&_ul]:pl-6
            [&_ol]:list-decimal [&_ol]:pl-6
            [&_li]:my-1
            [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </ScrollArea>
    </div>
  );
}
