import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Loader2, X, Check, AlertTriangle, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { cleanCNPJ, formatCNPJ, validateCNPJ } from "@/lib/cnpjUtils";
import type { CNPJLookupResult } from "@/hooks/useCNPJLookup";

interface BatchResult {
  cnpj: string;
  status: "pending" | "loading" | "success" | "error";
  data?: CNPJLookupResult;
  error?: string;
  selected?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToProspects: (results: CNPJLookupResult[]) => void;
  onSendToLeads: (results: CNPJLookupResult[]) => void;
  isAdding?: boolean;
}

async function fetchCNPJ(cnpj: string): Promise<CNPJLookupResult> {
  const cleaned = cleanCNPJ(cnpj);
  
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("CNPJ não encontrado");
    }
    if (response.status === 429) {
      throw new Error("Limite de consultas excedido");
    }
    throw new Error("Erro na consulta");
  }
  
  const data = await response.json();
  
  const formatPhone = (dddPhone: string | null) => {
    if (!dddPhone) return null;
    const cleaned = dddPhone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return dddPhone;
  };
  
  const endereco = [
    data.descricao_tipo_de_logradouro,
    data.logradouro,
    data.numero,
    data.complemento
  ].filter(Boolean).join(" ");
  
  return {
    cnpj: data.cnpj,
    razaoSocial: data.razao_social,
    nomeFantasia: data.nome_fantasia,
    uf: data.uf,
    cidade: data.municipio,
    bairro: data.bairro,
    cep: data.cep,
    endereco,
    cnaeFiscal: data.cnae_fiscal,
    cnaeFiscalDescricao: data.cnae_fiscal_descricao,
    porte: data.porte,
    naturezaJuridica: data.natureza_juridica,
    capitalSocial: data.capital_social,
    situacaoCadastral: data.situacao_cadastral,
    dataSituacaoCadastral: data.data_situacao_cadastral,
    dataInicioAtividade: data.data_inicio_atividade,
    telefone1: formatPhone(data.ddd_telefone_1),
    telefone2: formatPhone(data.ddd_telefone_2),
    email: data.email,
    socios: data.qsa?.map((s: any) => ({
      nome: s.nome_socio,
      qualificacao: s.qualificacao_socio
    })) || []
  };
}

export function CNPJBatchDialog({ open, onOpenChange, onAddToProspects, onSendToLeads, isAdding }: Props) {
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const extractCNPJsFromFile = async (file: File): Promise<string[]> => {
    const cnpjs: string[] = [];
    
    if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      
      for (const line of lines) {
        // Try to extract CNPJ from each line/cell
        const cells = line.split(/[,;\t]/);
        for (const cell of cells) {
          const cleaned = cleanCNPJ(cell);
          if (cleaned.length === 14 && validateCNPJ(cleaned)) {
            cnpjs.push(cleaned);
          }
        }
      }
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });
        
        for (const row of data) {
          if (Array.isArray(row)) {
            for (const cell of row) {
              if (cell) {
                const cleaned = cleanCNPJ(String(cell));
                if (cleaned.length === 14 && validateCNPJ(cleaned)) {
                  cnpjs.push(cleaned);
                }
              }
            }
          }
        }
      }
    }
    
    // Remove duplicates
    return [...new Set(cnpjs)];
  };

  const processFile = async (file: File) => {
    try {
      const cnpjs = await extractCNPJsFromFile(file);
      
      if (cnpjs.length === 0) {
        toast({
          title: "Nenhum CNPJ encontrado",
          description: "O arquivo não contém CNPJs válidos.",
          variant: "destructive"
        });
        return;
      }
      
      if (cnpjs.length > 100) {
        toast({
          title: "Limite excedido",
          description: "O máximo permitido é 100 CNPJs por vez. Apenas os primeiros 100 serão processados.",
          variant: "destructive"
        });
      }
      
      const limitedCnpjs = cnpjs.slice(0, 100);
      
      setResults(limitedCnpjs.map(cnpj => ({
        cnpj,
        status: "pending",
        selected: true
      })));
      
      setIsProcessing(true);
      setProgress(0);
      
      // Process CNPJs with delay to respect API rate limits
      for (let i = 0; i < limitedCnpjs.length; i++) {
        const cnpj = limitedCnpjs[i];
        
        setResults(prev => prev.map(r => 
          r.cnpj === cnpj ? { ...r, status: "loading" } : r
        ));
        
        try {
          const data = await fetchCNPJ(cnpj);

          // Regra do sistema: SOMENTE CNPJs ATIVOS
          if ((data.situacaoCadastral || "").toUpperCase() !== "ATIVA") {
            throw new Error(`CNPJ não ativo (${data.situacaoCadastral || "N/D"})`);
          }

          setResults(prev => prev.map(r => 
            r.cnpj === cnpj ? { ...r, status: "success", data, selected: true } : r
          ));
        } catch (error) {
          setResults(prev => prev.map(r => 
            r.cnpj === cnpj ? { 
              ...r, 
              status: "error", 
              error: error instanceof Error ? error.message : "Erro desconhecido",
              selected: false
            } : r
          ));
        }
        
        setProgress(((i + 1) / limitedCnpjs.length) * 100);
        
        // Add delay between requests to avoid rate limiting
        if (i < limitedCnpjs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setIsProcessing(false);
      
      const successCount = results.filter(r => r.status === "success").length;
      toast({
        title: "Consulta concluída",
        description: `${successCount} de ${limitedCnpjs.length} CNPJs consultados com sucesso.`
      });
      
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = "";
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".txt"))) {
      processFile(file);
    } else {
      toast({
        title: "Formato inválido",
        description: "Envie um arquivo CSV, TXT ou Excel (.xlsx, .xls)",
        variant: "destructive"
      });
    }
  }, []);

  const toggleSelect = (cnpj: string) => {
    setResults(prev => prev.map(r => 
      r.cnpj === cnpj ? { ...r, selected: !r.selected } : r
    ));
  };

  const toggleSelectAll = () => {
    const successResults = results.filter(r => r.status === "success");
    const allSelected = successResults.every(r => r.selected);
    
    setResults(prev => prev.map(r => 
      r.status === "success" ? { ...r, selected: !allSelected } : r
    ));
  };

  const selectedResults = results.filter(r => r.status === "success" && r.selected && r.data);
  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;

  const handleAddToProspects = () => {
    const data = selectedResults.map(r => r.data!);
    onAddToProspects(data);
  };

  const handleSendToLeads = () => {
    const data = selectedResults.map(r => r.data!);
    onSendToLeads(data);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setResults([]);
      setProgress(0);
      onOpenChange(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "CNPJ\n00.000.000/0001-00\n11.111.111/0001-11\n22.222.222/0001-22";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-cnpjs.csv";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Consulta em Lote de CNPJs
          </DialogTitle>
          <DialogDescription>
            Envie um arquivo Excel ou CSV contendo CNPJs para consultar múltiplas empresas de uma vez.
          </DialogDescription>
        </DialogHeader>

        {results.length === 0 ? (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">
                Arraste um arquivo aqui ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Formatos aceitos: CSV, TXT, XLSX, XLS (máx. 100 CNPJs)
              </p>
              <input
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="cnpj-file-input"
              />
              <label htmlFor="cnpj-file-input">
                <Button variant="outline" asChild>
                  <span>Selecionar arquivo</span>
                </Button>
              </label>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Não tem um modelo? 
              </span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={downloadTemplate}>
                <Download className="h-3 w-3 mr-1" />
                Baixar modelo CSV
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Consultando CNPJs...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{results.length} CNPJ(s)</span>
                {successCount > 0 && (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    {successCount} encontrado(s)
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errorCount} erro(s)
                  </Badge>
                )}
              </div>
              
              {successCount > 0 && !isProcessing && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedResults.length === successCount}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Selecionar todos ({selectedResults.length}/{successCount})
                  </span>
                </div>
              )}
            </div>
            
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="divide-y">
                {results.map((result) => (
                  <div
                    key={result.cnpj}
                    className={`flex items-center gap-3 p-3 ${
                      result.status === "success" ? "hover:bg-muted/50" : ""
                    }`}
                  >
                    {result.status === "success" && (
                      <Checkbox
                        checked={result.selected}
                        onCheckedChange={() => toggleSelect(result.cnpj)}
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {formatCNPJ(result.cnpj)}
                        </span>
                        
                        {result.status === "loading" && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {result.status === "success" && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {result.status === "error" && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      
                      {result.data && (
                        <div className="mt-1">
                          <p className="text-sm font-medium truncate">
                            {result.data.nomeFantasia || result.data.razaoSocial}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.data.cidade} - {result.data.uf} • {result.data.situacaoCadastral}
                          </p>
                        </div>
                      )}
                      
                      {result.error && (
                        <p className="text-xs text-destructive mt-1">
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {results.length > 0 && !isProcessing && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setResults([]);
                  setProgress(0);
                }}
              >
                Nova consulta
              </Button>
              <div className="flex-1" />
            </>
          )}
          
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {results.length === 0 ? "Cancelar" : "Fechar"}
          </Button>
          
          {selectedResults.length > 0 && !isProcessing && (
            <>
              <Button
                variant="outline"
                onClick={handleAddToProspects}
                disabled={isAdding}
              >
                Adicionar à Lista ({selectedResults.length})
              </Button>
              <Button
                onClick={handleSendToLeads}
                disabled={isAdding}
              >
                {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar p/ Leads ({selectedResults.length})
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
