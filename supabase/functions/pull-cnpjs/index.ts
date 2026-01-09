import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PullFilters {
  segments?: string[];
  states?: string[];
  cities?: string[];
  companySizes?: string[];
}

// State name mapping
const stateAbbreviations: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

// Segment synonyms for better search coverage
const segmentSynonyms: Record<string, string[]> = {
  "Comércio Automotivo": ["concessionária", "revenda veículos", "loja carros", "seminovos", "multimarcas"],
  "Restaurantes": ["restaurante", "pizzaria", "hamburgueria", "lanchonete", "churrascaria"],
  "Clínicas e Saúde": ["clínica médica", "consultório", "dentista", "laboratório", "fisioterapia"],
  "Academias": ["academia", "crossfit", "pilates", "fitness", "musculação"],
  "Educação": ["escola", "colégio", "curso", "faculdade", "centro educacional"],
  "Varejo": ["loja", "comércio", "mercado", "supermercado", "boutique"],
  "Imobiliárias": ["imobiliária", "corretor", "imóveis", "construtora"],
  "Salões de Beleza": ["salão beleza", "cabeleireiro", "barbearia", "estética"],
  "Contabilidade": ["escritório contábil", "contabilidade", "contador"],
  "Advocacia": ["escritório advocacia", "advogado", "jurídico"],
  "Tecnologia": ["software", "TI", "informática", "startup", "sistemas"],
  "Construção Civil": ["construtora", "empreiteira", "engenharia", "obras"],
};

// Build search queries for CNPJs
function buildSearchQueries(filters: PullFilters): string[] {
  const queries: string[] = [];
  const segment = filters.segments?.[0] || "";
  const city = filters.cities?.[0] || "";
  const stateAbbr = filters.states?.[0] || "";
  const stateName = stateAbbreviations[stateAbbr] || stateAbbr;

  const synonyms = segmentSynonyms[segment] || [];

  // CNPJ-focused queries
  queries.push(`site:cnpj.biz "${city || stateName}" "${segment}" lista CNPJ`);
  queries.push(`site:empresascnpj.com "${city}" ${stateAbbr} ${segment} CNPJ ativo`);
  queries.push(`"${segment}" "${city || stateName}" ${stateAbbr} CNPJ lista empresas ativas`);
  queries.push(`empresas ${segment} ${city || stateName} cadastro CNPJ ativas`);
  
  // Add synonym-based queries
  if (synonyms.length > 0) {
    queries.push(`site:cnpj.biz "${city || stateName}" "${synonyms[0]}" CNPJ`);
    if (synonyms.length > 1) {
      queries.push(`"${synonyms[1]}" "${city}" ${stateAbbr} CNPJ empresas`);
    }
  }

  return queries;
}

// Extract CNPJs from text
function extractCNPJs(text: string): string[] {
  const cnpjRegex = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
  const matches = text.match(cnpjRegex) || [];
  return [...new Set(matches.map(cnpj => cnpj.replace(/\D/g, "")))];
}

// Quick CNPJ lookup
async function lookupCNPJ(cnpj: string): Promise<any | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      ...data,
      situacao_cadastral: data.descricao_situacao_cadastral || data.situacao_cadastral
    };
  } catch {
    // Fallback to CNPJ.ws
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(4000)
      });
      if (!response.ok) return null;
      const data = await response.json();
      const situacao = data.estabelecimento?.situacao_cadastral;
      return {
        razao_social: data.razao_social,
        nome_fantasia: data.estabelecimento?.nome_fantasia,
        cnae_fiscal_descricao: data.estabelecimento?.atividade_principal?.descricao,
        porte: data.porte?.descricao,
        municipio: data.estabelecimento?.cidade?.nome,
        uf: data.estabelecimento?.estado?.sigla,
        situacao_cadastral: situacao || "Ativa",
      };
    } catch {
      return null;
    }
  }
}

// Check cache
async function getCachedCNPJ(supabase: any, cnpj: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('cnpj_cache')
      .select('data, situacao')
      .eq('cnpj', cnpj)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (data && !error) {
      supabase.rpc('touch_cnpj_cache', { p_cnpj: cnpj }).then(() => {});
      return data.data;
    }
    return null;
  } catch {
    return null;
  }
}

// Save to cache
async function saveToCache(supabase: any, cnpj: string, data: any, situacao: string): Promise<void> {
  try {
    const isActive = situacao?.toLowerCase().includes('ativ');
    const expiryDays = isActive ? 7 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await supabase.from('cnpj_cache').upsert({
      cnpj,
      data,
      situacao,
      source: "pull-cnpjs",
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
      last_accessed_at: new Date().toISOString(),
    }, { onConflict: 'cnpj' });
  } catch (e) {
    console.log("Cache save error:", e);
  }
}

// Check if CNPJ matches size filter
function matchesSize(porte: string | undefined, sizesFilter: string[] | undefined): boolean {
  if (!sizesFilter || sizesFilter.length === 0) return true;
  if (!porte) return false;

  const porteNormalized = porte.toLowerCase();
  
  for (const size of sizesFilter) {
    const sizeNorm = size.toLowerCase();
    if (sizeNorm === "mei" && porteNormalized.includes("mei")) return true;
    if (sizeNorm === "me" && (porteNormalized.includes("micro") || porteNormalized.includes("me "))) return true;
    if (sizeNorm === "epp" && (porteNormalized.includes("pequeno") || porteNormalized.includes("epp"))) return true;
    if (sizeNorm === "medio" && porteNormalized.includes("médio")) return true;
    if (sizeNorm === "grande" && porteNormalized.includes("grande")) return true;
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const filters: PullFilters = await req.json();
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔍 PUXAR CNPJs ATIVOS");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 Filtros:", JSON.stringify(filters, null, 2));

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = supabaseUrl && supabaseKey 
      ? createClient(supabaseUrl, supabaseKey) 
      : null;

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Conector Firecrawl não configurado.", cnpjs: [], stats: {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchQueries = buildSearchQueries(filters);
    console.log("🔎 Queries:", searchQueries);

    // Collect CNPJs from search
    const allCNPJs: Set<string> = new Set();
    
    const searchPromises = searchQueries.map(async (query, index) => {
      try {
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 30,
            lang: "pt-BR",
            country: "BR",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const results = data.data || [];
          console.log(`  ✓ Query ${index + 1}: ${results.length} resultados`);
          
          for (const result of results) {
            const text = `${result.markdown || ""} ${result.title || ""} ${result.description || ""}`;
            extractCNPJs(text).forEach(c => allCNPJs.add(c));
          }
        }
      } catch (e) {
        console.error(`  ✗ Query ${index + 1} erro:`, e);
      }
    });

    await Promise.all(searchPromises);
    console.log(`📊 CNPJs únicos encontrados: ${allCNPJs.size}`);

    const stats = {
      totalCNPJsFound: allCNPJs.size,
      cnpjsProcessed: 0,
      cacheHits: 0,
      skippedInactive: 0,
      skippedLocation: 0,
      skippedSize: 0,
      activeCount: 0,
      processingTimeMs: 0,
    };

    if (allCNPJs.size === 0) {
      stats.processingTimeMs = Date.now() - startTime;
      return new Response(
        JSON.stringify({ cnpjs: [], stats }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process CNPJs
    const activeCNPJs: any[] = [];
    const cnpjArray = Array.from(allCNPJs);
    const batchSize = 5;

    for (let i = 0; i < cnpjArray.length; i += batchSize) {
      const batch = cnpjArray.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(batch.map(async (cnpj) => {
        stats.cnpjsProcessed++;

        // Check cache first
        if (supabase) {
          const cached = await getCachedCNPJ(supabase, cnpj);
          if (cached) {
            stats.cacheHits++;
            return { cnpj, data: cached, fromCache: true };
          }
        }

        // Lookup CNPJ
        const data = await lookupCNPJ(cnpj);
        if (data && supabase) {
          await saveToCache(supabase, cnpj, data, data.situacao_cadastral || "");
        }
        return { cnpj, data, fromCache: false };
      }));

      for (const result of batchResults) {
        if (!result.data) continue;

        const { cnpj, data } = result;

        // Check if ACTIVE
        const situacao = String(data.situacao_cadastral || "").toLowerCase();
        const isActive = situacao === "ativa" || situacao === "02" || situacao.includes("ativ");

        if (!isActive) {
          stats.skippedInactive++;
          continue;
        }

        // Check location filter
        if (filters.states?.length) {
          const dataUF = data.uf?.toUpperCase();
          if (!filters.states.some(s => s.toUpperCase() === dataUF)) {
            stats.skippedLocation++;
            continue;
          }
        }

        if (filters.cities?.length) {
          const dataMunicipio = (data.municipio || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const matchesCity = filters.cities.some(c => {
            const normalizedFilter = c.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return dataMunicipio.includes(normalizedFilter) || normalizedFilter.includes(dataMunicipio);
          });
          if (!matchesCity) {
            stats.skippedLocation++;
            continue;
          }
        }

        // Check size filter
        if (!matchesSize(data.porte, filters.companySizes)) {
          stats.skippedSize++;
          continue;
        }

        // Format CNPJ
        const formattedCNPJ = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

        activeCNPJs.push({
          cnpj: formattedCNPJ,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          porte: data.porte,
          situacao: data.situacao_cadastral,
          municipio: data.municipio,
          uf: data.uf,
          cnae_fiscal_descricao: data.cnae_fiscal_descricao,
        });

        stats.activeCount++;
      }
    }

    stats.processingTimeMs = Date.now() - startTime;

    console.log("═══════════════════════════════════════════════════════════");
    console.log(`✅ BUSCA CONCLUÍDA em ${stats.processingTimeMs}ms`);
    console.log(`   CNPJs ativos: ${stats.activeCount}`);
    console.log(`   Inativos filtrados: ${stats.skippedInactive}`);
    console.log(`   Cache hits: ${stats.cacheHits}`);
    console.log("═══════════════════════════════════════════════════════════");

    return new Response(
      JSON.stringify({ cnpjs: activeCNPJs, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage, cnpjs: [], stats: {} }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
