import { useState, useRef, useCallback } from "react";
import { Search, Download, Loader2, FileText, CheckCircle, XCircle, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityCombobox } from "./CityCombobox";
import { segments, companySizes, brazilianStates } from "@/data/mockProspects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CNPJResult {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  porte?: string;
  situacao?: string;
  municipio?: string;
  uf?: string;
  cnae_fiscal_descricao?: string;
}

interface SearchProgress {
  status: "idle" | "searching" | "processing" | "completed" | "error";
  statusMessage?: string;
  totalFound: number;
  processed: number;
  activeCount: number;
  inactiveCount: number;
  cacheHits: number;
  queriesCompleted: number;
  totalQueries: number;
}

export function CNPJPullTab() {
  const [segment, setSegment] = useState<string | undefined>();
  const [state, setState] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();
  const [companySize, setCompanySize] = useState<string | undefined>();
  const [limit, setLimit] = useState(100);
  
  const [results, setResults] = useState<CNPJResult[]>([]);
  const [progress, setProgress] = useState<SearchProgress>({
    status: "idle",
    totalFound: 0,
    processed: 0,
    activeCount: 0,
    inactiveCount: 0,
    cacheHits: 0,
    queriesCompleted: 0,
    totalQueries: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async () => {
    if (!segment || !state) {
      toast({
        title: "Filtros obrigatórios",
        description: "Selecione pelo menos o segmento e o estado.",
        variant: "destructive",
      });
      return;
    }

    // Cancel any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setResults([]);
    setProgress({
      status: "searching",
      statusMessage: "Iniciando busca...",
      totalFound: 0,
      processed: 0,
      activeCount: 0,
      inactiveCount: 0,
      cacheHits: 0,
      queriesCompleted: 0,
      totalQueries: 0,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/pull-cnpjs`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token || supabaseKey}`,
          "apikey": supabaseKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          segments: [segment],
          states: [state],
          cities: city ? [city] : undefined,
          companySizes: companySize ? [companySize] : undefined,
          limit,
          streaming: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case "status":
                  setProgress(prev => ({
                    ...prev,
                    statusMessage: data.message,
                  }));
                  break;

                case "search_progress":
                  setProgress(prev => ({
                    ...prev,
                    status: "searching",
                    queriesCompleted: data.queriesCompleted,
                    totalQueries: data.totalQueries,
                    totalFound: data.cnpjsFound,
                  }));
                  break;

                case "search_complete":
                  setProgress(prev => ({
                    ...prev,
                    status: "processing",
                    statusMessage: "Validando CNPJs...",
                    totalFound: data.totalCNPJsFound,
                  }));
                  break;

                case "cnpj":
                  setResults(prev => [...prev, data.cnpj]);
                  setProgress(prev => ({
                    ...prev,
                    processed: data.progress.processed,
                    activeCount: data.progress.found,
                    inactiveCount: data.progress.inactiveCount,
                  }));
                  break;
                  
                case "progress":
                  setProgress(prev => ({
                    ...prev,
                    processed: data.processed,
                    activeCount: data.found,
                    inactiveCount: data.inactiveCount,
                    cacheHits: data.cacheHits || 0,
                  }));
                  break;
                  
                case "complete":
                  setProgress(prev => ({
                    ...prev,
                    status: "completed",
                    statusMessage: undefined,
                  }));
                  toast({
                    title: "Busca concluída",
                    description: `${data.stats?.activeCount || 0} CNPJs ativos encontrados.`,
                  });
                  break;

                case "error":
                  setProgress(prev => ({
                    ...prev,
                    status: "error",
                    statusMessage: data.message,
                  }));
                  toast({
                    title: "Erro na busca",
                    description: data.message,
                    variant: "destructive",
                  });
                  break;
              }
            } catch (e) {
              console.error("Error parsing SSE message:", e, line);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setProgress(prev => ({
          ...prev,
          status: "completed",
          statusMessage: "Busca cancelada",
        }));
        return;
      }

      console.error("Error pulling CNPJs:", error);
      setProgress(prev => ({ ...prev, status: "error" }));
      toast({
        title: "Erro na busca",
        description: error instanceof Error ? error.message : "Erro ao buscar CNPJs",
        variant: "destructive",
      });
    }
  }, [segment, state, city, companySize, limit]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setProgress(prev => ({
      ...prev,
      status: "completed",
      statusMessage: "Busca cancelada",
    }));
  }, []);

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = ["CNPJ", "Razão Social", "Nome Fantasia", "Porte", "Situação", "Cidade", "UF", "Atividade"];
    const rows = results.map(r => [
      r.cnpj,
      r.razao_social || "",
      r.nome_fantasia || "",
      r.porte || "",
      r.situacao || "",
      r.municipio || "",
      r.uf || "",
      r.cnae_fiscal_descricao || "",
    ]);

    const csv = [headers.join(";"), ...rows.map(r => r.map(cell => `"${cell}"`).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cnpjs-ativos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `${results.length} CNPJs exportados para CSV.`,
    });
  };

  const handleExportTXT = () => {
    if (results.length === 0) return;

    const txt = results.map(r => r.cnpj).join("\n");
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cnpjs-ativos-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `${results.length} CNPJs exportados para TXT (apenas números).`,
    });
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSegment(undefined);
    setState(undefined);
    setCity(undefined);
    setCompanySize(undefined);
    setLimit(100);
    setResults([]);
    setProgress({
      status: "idle",
      totalFound: 0,
      processed: 0,
      activeCount: 0,
      inactiveCount: 0,
      cacheHits: 0,
      queriesCompleted: 0,
      totalQueries: 0,
    });
  };

  const limitOptions = [
    { value: 10, label: "10 CNPJs" },
    { value: 25, label: "25 CNPJs" },
    { value: 50, label: "50 CNPJs" },
    { value: 100, label: "100 CNPJs" },
    { value: 500, label: "500 CNPJs" },
    { value: 1000, label: "1000 CNPJs" },
  ];

  const isSearching = progress.status === "searching" || progress.status === "processing";
  const progressPercent = progress.totalFound > 0 
    ? Math.round((progress.processed / progress.totalFound) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <FileText className="h-4 w-4" />
        Busque apenas números de CNPJ ativos por segmento, localização e porte
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Segmento *</label>
          <Select value={segment || ""} onValueChange={(v) => setSegment(v || undefined)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o segmento" />
            </SelectTrigger>
            <SelectContent>
              {segments.slice(0, 20).map((seg) => (
                <SelectItem key={seg} value={seg}>
                  {seg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Estado *</label>
          <Select value={state || ""} onValueChange={(v) => { setState(v || undefined); setCity(undefined); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {brazilianStates.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Cidade (opcional)</label>
          <CityCombobox
            selectedState={state}
            selectedCity={city}
            onCityChange={(c) => setCity(c)}
            placeholder="Todas"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Porte (opcional)</label>
          <Select value={companySize || "_all"} onValueChange={(v) => setCompanySize(v === "_all" ? undefined : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os portes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os portes</SelectItem>
              {companySizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Limite</label>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Limite" />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isSearching ? (
          <Button variant="destructive" onClick={handleCancel}>
            <StopCircle className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        ) : (
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Puxar CNPJs
          </Button>
        )}

        <Button variant="ghost" onClick={handleClear} disabled={isSearching}>
          Limpar
        </Button>
      </div>

      {/* Progress */}
      {isSearching && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progress.statusMessage || "Processando..."}</span>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {progress.status === "processing" && (
                    <span className="text-muted-foreground">{progressPercent}%</span>
                  )}
                </div>
              </div>
              
              {progress.status === "searching" && progress.totalQueries > 0 && (
                <div className="text-xs text-muted-foreground">
                  Queries: {progress.queriesCompleted}/{progress.totalQueries} • 
                  CNPJs encontrados: {progress.totalFound}
                </div>
              )}

              {progress.status === "processing" && (
                <Progress value={progressPercent} className="h-2" />
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{progress.totalFound}</p>
                  <p className="text-xs text-muted-foreground">CNPJs encontrados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{progress.processed}</p>
                  <p className="text-xs text-muted-foreground">Processados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{progress.activeCount}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{progress.inactiveCount}</p>
                  <p className="text-xs text-muted-foreground">Inativos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">{progress.cacheHits}</p>
                  <p className="text-xs text-muted-foreground">Cache hits</p>
                </div>
              </div>

              {/* Live results preview during search */}
              {results.length > 0 && (
                <div className="border rounded-lg max-h-[200px] overflow-y-auto bg-background">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">CNPJ</th>
                        <th className="px-3 py-2 text-left font-medium">Empresa</th>
                        <th className="px-3 py-2 text-left font-medium">Cidade/UF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(-10).map((r, i) => (
                        <tr key={r.cnpj} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                          <td className="px-3 py-1.5 font-mono text-xs">{r.cnpj}</td>
                          <td className="px-3 py-1.5 text-xs truncate max-w-[200px]">
                            {r.nome_fantasia || r.razao_social || "-"}
                          </td>
                          <td className="px-3 py-1.5 text-xs">
                            {r.municipio && r.uf ? `${r.municipio}/${r.uf}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.length > 10 && (
                    <div className="text-center py-1 text-xs text-muted-foreground bg-muted">
                      Mostrando últimos 10 de {results.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {progress.status === "completed" && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{results.length} CNPJs ativos</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span>{progress.inactiveCount} inativos filtrados</span>
                  </div>
                  {progress.cacheHits > 0 && (
                    <div className="text-xs text-muted-foreground">
                      ({progress.cacheHits} do cache)
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={results.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportTXT} disabled={results.length === 0}>
                    <FileText className="h-4 w-4 mr-2" />
                    Apenas CNPJs (TXT)
                  </Button>
                </div>
              </div>

              {/* CNPJ List Preview */}
              {results.length > 0 && (
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">CNPJ</th>
                        <th className="px-3 py-2 text-left font-medium">Empresa</th>
                        <th className="px-3 py-2 text-left font-medium">Porte</th>
                        <th className="px-3 py-2 text-left font-medium">Cidade/UF</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.cnpj} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                          <td className="px-3 py-2 font-mono text-xs">{r.cnpj}</td>
                          <td className="px-3 py-2">{r.nome_fantasia || r.razao_social || "-"}</td>
                          <td className="px-3 py-2">{r.porte || "-"}</td>
                          <td className="px-3 py-2">{r.municipio && r.uf ? `${r.municipio}/${r.uf}` : "-"}</td>
                          <td className="px-3 py-2">
                            <Badge variant="default" className="bg-green-600">Ativo</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum CNPJ ativo encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}