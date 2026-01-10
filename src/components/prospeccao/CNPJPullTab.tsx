import { useState, useEffect } from "react";
import { Search, Download, Loader2, FileText, CheckCircle, XCircle, StopCircle, Clock, Send, UserPlus, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityCombobox } from "./CityCombobox";
import { SendToFunnelDialog } from "./SendToFunnelDialog";
import { CNPJLeaveDialog } from "./CNPJLeaveDialog";
import { segments, companySizes, brazilianStates } from "@/data/mockProspects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCNPJPull, type CNPJResult } from "@/contexts/CNPJPullContext";
import { useLocation } from "react-router-dom";

export function CNPJPullTab() {
  const location = useLocation();
  const {
    activeSearch,
    isSearching,
    results,
    progress,
    startSearch,
    cancelSearch,
    moveToBackground,
    clearSearch,
    estimatedTimeRemaining,
  } = useCNPJPull();

  const [segment, setSegment] = useState<string | undefined>(activeSearch?.filters.segment);
  const [state, setState] = useState<string | undefined>(activeSearch?.filters.state);
  const [city, setCity] = useState<string | undefined>(activeSearch?.filters.city);
  const [companySize, setCompanySize] = useState<string | undefined>(activeSearch?.filters.companySize);
  const [limit, setLimit] = useState(activeSearch?.filters.limit || 100);
  
  const [selectedCNPJs, setSelectedCNPJs] = useState<string[]>([]);
  const [sendToFunnelOpen, setSendToFunnelOpen] = useState(false);
  const [isSendingToLeads, setIsSendingToLeads] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Track if user is trying to leave the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSearching) {
        e.preventDefault();
        e.returnValue = "Você tem uma busca em andamento. Deseja continuar em segundo plano?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSearching]);

  // Toggle selection for a single CNPJ
  const toggleSelect = (cnpj: string) => {
    setSelectedCNPJs(prev => 
      prev.includes(cnpj) 
        ? prev.filter(c => c !== cnpj)
        : [...prev, cnpj]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedCNPJs.length === results.length) {
      setSelectedCNPJs([]);
    } else {
      setSelectedCNPJs(results.map(r => r.cnpj));
    }
  };

  // Send selected CNPJs to leads base
  const handleSendToLeads = async () => {
    const selectedResults = results.filter(r => selectedCNPJs.includes(r.cnpj));
    if (selectedResults.length === 0) return;

    setIsSendingToLeads(true);
    let successCount = 0;
    let duplicateCount = 0;

    for (const company of selectedResults) {
      try {
        // Check if lead already exists with this company name
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .or(`company.ilike.%${company.nome_fantasia || company.razao_social}%,name.ilike.%${company.nome_fantasia || company.razao_social}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          duplicateCount++;
          continue;
        }

        const { error } = await supabase.from("leads").insert({
          name: company.nome_fantasia || company.razao_social || "Sem nome",
          company: company.razao_social,
          city: company.municipio,
          state: company.uf,
          segment: company.cnae_fiscal_descricao || segment,
          status: "novo",
          temperature: "cold",
          origin: "prospeccao-cnpj",
          tags: ["cnpj-pull"],
        });

        if (!error) {
          successCount++;
        }
      } catch (error) {
        console.error("Error sending to leads:", error);
      }
    }

    setIsSendingToLeads(false);
    setSelectedCNPJs([]);

    const message = duplicateCount > 0 
      ? `${successCount} lead(s) criados. ${duplicateCount} já existiam na base.`
      : `${successCount} lead(s) criados com sucesso.`;

    toast({
      title: "Leads criados",
      description: message,
    });
  };

  // Get prospects for funnel dialog
  const getSelectedProspects = () => {
    return results
      .filter(r => selectedCNPJs.includes(r.cnpj))
      .map(r => ({
        id: r.cnpj,
        name: r.nome_fantasia || r.razao_social || "Sem nome",
        cnpj: r.cnpj,
        segment: r.cnae_fiscal_descricao || segment || "",
        cnae_code: "",
        cnae_description: r.cnae_fiscal_descricao || "",
        company_size: r.porte || "",
        city: r.municipio || "",
        state: r.uf || "",
        emails: [] as string[],
        phones: [] as string[],
        tags: ["cnpj-pull"],
        status: "novo" as const,
        has_website: false,
        has_phone: false,
        has_email: false,
        emails_count: 0,
        phones_count: 0,
        data_revealed: false,
        source: "cnpj-pull",
      }));
  };

  const handleSearch = async () => {
    if (!segment || !state) {
      toast({
        title: "Filtros obrigatórios",
        description: "Selecione pelo menos o segmento e o estado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await startSearch({
        segment,
        state,
        city,
        companySize,
        limit,
      });
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: error instanceof Error ? error.message : "Erro ao buscar CNPJs",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    cancelSearch();
    toast({
      title: "Busca cancelada",
      description: "A busca foi interrompida.",
    });
  };

  const handleMoveToBackground = () => {
    moveToBackground();
    toast({
      title: "Busca em segundo plano",
      description: "A busca continuará em segundo plano. Você receberá uma notificação quando concluir.",
    });
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = ["CNPJ", "Empresa", "Cidade", "UF"];
    const rows = results.map(r => [
      r.cnpj,
      r.nome_fantasia || r.razao_social || "",
      r.municipio || "",
      r.uf || "",
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

    // Export with CNPJ | Empresa | Cidade format
    const txt = results.map(r => 
      `${r.cnpj} | ${r.nome_fantasia || r.razao_social || "-"} | ${r.municipio || "-"}/${r.uf || "-"}`
    ).join("\n");
    
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cnpjs-ativos-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `${results.length} CNPJs exportados para TXT.`,
    });
  };

  const handleClear = () => {
    clearSearch();
    setSegment(undefined);
    setState(undefined);
    setCity(undefined);
    setCompanySize(undefined);
    setLimit(100);
    setSelectedCNPJs([]);
  };

  const limitOptions = [
    { value: 10, label: "10 CNPJs" },
    { value: 25, label: "25 CNPJs" },
    { value: 50, label: "50 CNPJs" },
    { value: 100, label: "100 CNPJs" },
    { value: 250, label: "250 CNPJs" },
    { value: 500, label: "500 CNPJs" },
  ];

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
          <Select value={segment || ""} onValueChange={(v) => setSegment(v || undefined)} disabled={isSearching}>
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
          <Select value={state || ""} onValueChange={(v) => { setState(v || undefined); setCity(undefined); }} disabled={isSearching}>
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
            disabled={isSearching}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Porte (opcional)</label>
          <Select value={companySize || "_all"} onValueChange={(v) => setCompanySize(v === "_all" ? undefined : v)} disabled={isSearching}>
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
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))} disabled={isSearching}>
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
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={handleCancel}>
              <StopCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleMoveToBackground}>
              <MinusCircle className="h-4 w-4 mr-2" />
              Segundo plano
            </Button>
          </div>
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
                <div className="flex items-center gap-3">
                  {progress.status === "processing" && estimatedTimeRemaining && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{estimatedTimeRemaining} restantes
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {progress.status === "processing" && (
                      <span className="text-muted-foreground">{progressPercent}%</span>
                    )}
                  </div>
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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

              {/* Live results preview during search - Only show ACTIVE results */}
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
                      Mostrando últimos 10 de {results.length} ativos
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
              {/* Stats + Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  {selectedCNPJs.length > 0 && (
                    <span className="font-medium text-primary">
                      {selectedCNPJs.length} selecionado(s)
                    </span>
                  )}
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

                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSendToFunnelOpen(true)} 
                    disabled={selectedCNPJs.length === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para Funil
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSendToLeads} 
                    disabled={selectedCNPJs.length === 0 || isSendingToLeads}
                  >
                    {isSendingToLeads ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Enviar para Leads
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={results.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportTXT} disabled={results.length === 0}>
                    <FileText className="h-4 w-4 mr-2" />
                    TXT
                  </Button>
                </div>
              </div>

              {/* CNPJ List with Selection */}
              {results.length > 0 && (
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-10">
                          <Checkbox
                            checked={selectedCNPJs.length === results.length && results.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-3 py-2 text-left font-medium">CNPJ</th>
                        <th className="px-3 py-2 text-left font-medium">Empresa</th>
                        <th className="px-3 py-2 text-left font-medium">Cidade/UF</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr 
                          key={r.cnpj} 
                          className={`${i % 2 === 0 ? "bg-background" : "bg-muted/30"} ${selectedCNPJs.includes(r.cnpj) ? "ring-1 ring-primary/50 bg-primary/5" : ""}`}
                        >
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={selectedCNPJs.includes(r.cnpj)}
                              onCheckedChange={() => toggleSelect(r.cnpj)}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{r.cnpj}</td>
                          <td className="px-3 py-2">{r.nome_fantasia || r.razao_social || "-"}</td>
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

      {/* Send to Funnel Dialog */}
      <SendToFunnelDialog
        open={sendToFunnelOpen}
        onOpenChange={setSendToFunnelOpen}
        selectedProspects={selectedCNPJs}
        prospects={getSelectedProspects()}
        onSuccess={() => {
          setSelectedCNPJs([]);
          toast({
            title: "Enviado para funil",
            description: `${selectedCNPJs.length} empresa(s) enviada(s) para o funil.`,
          });
        }}
      />

      {/* Leave Dialog */}
      <CNPJLeaveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        onContinueBackground={() => {
          moveToBackground();
          setShowLeaveDialog(false);
        }}
        onCancel={() => {
          cancelSearch();
          setShowLeaveDialog(false);
        }}
        activeCount={progress.activeCount}
        processed={progress.processed}
        total={progress.totalFound}
      />
    </div>
  );
}
