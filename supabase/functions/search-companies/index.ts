import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchFilters {
  states?: string[];
  cities?: string[];
  segments?: string[];
  cnae?: string;
  companySizes?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
  page?: number;
  pageSize?: number;
}

// State name to abbreviation mapping
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
  "Comércio Automotivo": [
    "loja de carros", "revenda de veículos", "concessionária", "revendedora de automóveis",
    "venda de carros", "seminovos", "carros usados", "multimarcas", "veículos usados",
    "loja de veículos", "comércio de veículos", "auto comercial", "car shop"
  ],
  "Restaurantes": [
    "restaurante", "pizzaria", "hamburgueria", "lanchonete", "bar e restaurante",
    "churrascaria", "self service", "buffet", "cantina", "bistrô", "food"
  ],
  "Clínicas e Saúde": [
    "clínica médica", "consultório", "clínica odontológica", "dentista", "laboratório",
    "fisioterapia", "psicologia", "nutricionista", "clínica estética", "hospital"
  ],
  "Academias": [
    "academia", "crossfit", "pilates", "musculação", "fitness", "personal trainer",
    "estúdio fitness", "box de crossfit", "centro de treinamento"
  ],
  "Educação": [
    "escola", "colégio", "curso", "faculdade", "universidade", "ensino",
    "centro educacional", "escola de idiomas", "curso técnico", "treinamento"
  ],
  "Varejo": [
    "loja", "comércio", "mercado", "supermercado", "atacado", "distribuidora",
    "shopping", "outlet", "magazine", "boutique"
  ],
  "Imobiliárias": [
    "imobiliária", "corretor", "imóveis", "construtora", "incorporadora",
    "administradora de imóveis", "locação", "aluguel", "venda de imóveis"
  ],
  "Salões de Beleza": [
    "salão de beleza", "cabeleireiro", "barbearia", "manicure", "estética",
    "studio de beleza", "espaço de beleza", "hair", "beauty"
  ],
  "Contabilidade": [
    "escritório contábil", "contabilidade", "contador", "assessoria contábil",
    "serviços contábeis", "consultoria fiscal", "departamento pessoal"
  ],
  "Advocacia": [
    "escritório de advocacia", "advogado", "advocacia", "assessoria jurídica",
    "consultoria jurídica", "jurídico", "law firm"
  ],
  "Tecnologia": [
    "software", "desenvolvimento", "TI", "informática", "startup", "tech",
    "sistemas", "aplicativos", "digital", "soluções tecnológicas"
  ],
  "Construção Civil": [
    "construtora", "empreiteira", "engenharia", "obras", "reforma",
    "construção", "incorporação", "edificações"
  ],
};

// Build optimized search queries for Firecrawl
function buildSearchQueries(filters: SearchFilters): string[] {
  const queries: string[] = [];
  const segment = filters.segments?.[0] || "";
  const city = filters.cities?.[0] || "";
  const stateAbbr = filters.states?.[0] || "";
  const stateName = stateAbbreviations[stateAbbr] || stateAbbr;

  // Get synonyms for the segment
  const synonyms = segmentSynonyms[segment] || [];
  
  // Primary search terms - use segment and up to 3 synonyms
  const searchTerms = [segment, ...synonyms.slice(0, 3)];

  // Query 1: Site-specific with exact city match
  queries.push(`site:cnpj.biz "${city}" "${segment}" CNPJ`);
  
  // Query 2: Another site with state
  queries.push(`site:empresascnpj.com "${city}" ${stateAbbr} ${segment}`);
  
  // Query 3: General search with segment
  queries.push(`"${segment}" "${city}" ${stateAbbr} CNPJ contato telefone -franquia`);
  
  // Query 4: With state full name
  queries.push(`empresas ${segment} ${city} ${stateName} lista comercial CNPJ`);

  // Add synonym-based queries for better coverage (only if we have synonyms)
  if (synonyms.length > 0) {
    // Use top 2 synonyms for additional queries
    const topSynonym = synonyms[0];
    queries.push(`"${topSynonym}" "${city}" ${stateAbbr} CNPJ empresas`);
    
    if (synonyms.length > 1) {
      queries.push(`site:cnpj.biz "${city}" "${synonyms[1]}" CNPJ`);
    }
  }

  return queries;
}

// Extract CNPJ from text using regex
function extractCNPJs(text: string): string[] {
  const cnpjRegex = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
  const matches = text.match(cnpjRegex) || [];
  return [...new Set(matches.map(cnpj => cnpj.replace(/\D/g, "")))];
}

// Quick CNPJ lookup with shorter timeout
async function quickLookupCNPJ(cnpj: string): Promise<any | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: AbortSignal.timeout(3000) // Reduced to 3 seconds
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      ...data,
      situacao_cadastral: data.descricao_situacao_cadastral || data.situacao_cadastral
    };
  } catch {
    return null;
  }
}

// Fallback to CNPJ.ws with shorter timeout
async function fallbackLookupCNPJ(cnpj: string): Promise<any | null> {
  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(3000) // Reduced to 3 seconds
    });
    if (!response.ok) return null;
    const data = await response.json();
    
    const situacao = data.estabelecimento?.situacao_cadastral;
    return {
      razao_social: data.razao_social,
      nome_fantasia: data.estabelecimento?.nome_fantasia,
      cnae_fiscal: data.estabelecimento?.atividade_principal?.id,
      cnae_fiscal_descricao: data.estabelecimento?.atividade_principal?.descricao,
      porte: data.porte?.descricao,
      municipio: data.estabelecimento?.cidade?.nome,
      uf: data.estabelecimento?.estado?.sigla,
      bairro: data.estabelecimento?.bairro,
      cep: data.estabelecimento?.cep,
      logradouro: data.estabelecimento?.logradouro,
      numero: data.estabelecimento?.numero,
      ddd_telefone_1: data.estabelecimento?.ddd1 && data.estabelecimento?.telefone1 
        ? `${data.estabelecimento.ddd1}${data.estabelecimento.telefone1}` : null,
      email: data.estabelecimento?.email,
      situacao_cadastral: situacao || "Ativa",
      capital_social: data.capital_social,
      data_inicio_atividade: data.estabelecimento?.data_inicio_atividade,
    };
  } catch {
    return null;
  }
}

// Debug statistics interface
interface SearchStats {
  totalCNPJsFound: number;
  cnpjsProcessed: number;
  cacheHits: number;
  skippedNoData: number;
  skippedInactive: number;
  skippedLocation: number;
  companiesReturned: number;
  apiErrors: { brasilapi: number; cnpjws: number };
  processingTimeMs: number;
}

// Check cache for CNPJ data
async function getCachedCNPJ(supabase: any, cnpj: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('cnpj_cache')
      .select('data, situacao')
      .eq('cnpj', cnpj)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (data && !error) {
      // Update hit count in background (fire and forget)
      supabase.rpc('touch_cnpj_cache', { p_cnpj: cnpj }).then(() => {});
      return data.data;
    }
    return null;
  } catch {
    return null;
  }
}

// Save CNPJ data to cache
async function saveToCacheBatch(supabase: any, entries: { cnpj: string; data: any; situacao: string; source: string }[]): Promise<void> {
  if (entries.length === 0) return;
  
  try {
    const cacheEntries = entries.map(({ cnpj, data, situacao, source }) => {
      // Inactive companies cache for 30 days, active for 7 days
      const isActive = situacao?.toLowerCase().includes('ativ');
      const expiryDays = isActive ? 7 : 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      
      return {
        cnpj,
        data,
        situacao,
        source,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        hit_count: 0,
        last_accessed_at: new Date().toISOString(),
      };
    });

    await supabase
      .from('cnpj_cache')
      .upsert(cacheEntries, { onConflict: 'cnpj' });
  } catch (e) {
    console.log("Cache save error (non-critical):", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SearchStats = {
    totalCNPJsFound: 0,
    cnpjsProcessed: 0,
    cacheHits: 0,
    skippedNoData: 0,
    skippedInactive: 0,
    skippedLocation: 0,
    companiesReturned: 0,
    apiErrors: { brasilapi: 0, cnpjws: 0 },
    processingTimeMs: 0,
  };

  try {
    const filters: SearchFilters = await req.json();
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔍 NOVA BUSCA DE EMPRESAS (OTIMIZADA)");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 Filtros:", JSON.stringify(filters, null, 2));

    // Initialize Supabase client for cache
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = supabaseUrl && supabaseKey 
      ? createClient(supabaseUrl, supabaseKey)
      : null;

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (!FIRECRAWL_API_KEY) {
      console.log("❌ ERRO: Firecrawl API Key não configurada");
      return new Response(
        JSON.stringify({
          companies: [],
          total: 0,
          page: 1,
          pageSize: filters.pageSize || 10,
          source: "none",
          error: "Conector Firecrawl não configurado.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchQueries = buildSearchQueries(filters);
    console.log("🔎 Queries otimizadas:", searchQueries);

    // Run ALL searches in parallel (no sequential waiting)
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
            limit: 25, // Increased from 20
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
    stats.totalCNPJsFound = allCNPJs.size;
    console.log(`📊 CNPJs únicos encontrados: ${allCNPJs.size}`);

    if (allCNPJs.size === 0) {
      stats.processingTimeMs = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          companies: [],
          total: 0,
          page: filters.page || 1,
          pageSize: filters.pageSize || 10,
          source: "firecrawl",
          debug: stats,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process CNPJs with cache-first approach
    const pageSize = filters.pageSize || 10;
    const cnpjArray = [...allCNPJs].slice(0, Math.min(pageSize * 15, 300)); // Process more CNPJs
    console.log(`🔄 Processando ${cnpjArray.length} CNPJs...`);
    
    const companies: any[] = [];
    const cacheEntriesToSave: { cnpj: string; data: any; situacao: string; source: string }[] = [];
    
    // AGGRESSIVE PARALLEL PROCESSING - batch size increased to 15
    const batchSize = 15;
    
    for (let i = 0; i < cnpjArray.length && companies.length < pageSize; i += batchSize) {
      const batch = cnpjArray.slice(i, i + batchSize);
      
      // Process entire batch in parallel using Promise.allSettled (doesn't fail on errors)
      const lookupPromises = batch.map(async (cnpj) => {
        // Check cache first
        if (supabase) {
          const cached = await getCachedCNPJ(supabase, cnpj);
          if (cached) {
            stats.cacheHits++;
            return { cnpj, data: cached, source: "cache", fromCache: true };
          }
        }
        
        // Try both APIs in parallel, use first successful response
        const [brasilResult, cnpjwsResult] = await Promise.allSettled([
          quickLookupCNPJ(cnpj),
          new Promise<any>(async (resolve) => {
            await new Promise(r => setTimeout(r, 100)); // Slight delay for fallback
            resolve(await fallbackLookupCNPJ(cnpj));
          })
        ]);
        
        let data = null;
        let source = "";
        
        if (brasilResult.status === "fulfilled" && brasilResult.value) {
          data = brasilResult.value;
          source = "brasilapi";
        } else if (cnpjwsResult.status === "fulfilled" && cnpjwsResult.value) {
          data = cnpjwsResult.value;
          source = "cnpjws";
        } else {
          if (brasilResult.status === "rejected" || !brasilResult.value) stats.apiErrors.brasilapi++;
          if (cnpjwsResult.status === "rejected" || !cnpjwsResult.value) stats.apiErrors.cnpjws++;
        }
        
        return { cnpj, data, source, fromCache: false };
      });

      const results = await Promise.allSettled(lookupPromises);
      
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        
        const { cnpj, data, source, fromCache } = result.value;
        stats.cnpjsProcessed++;
        
        if (companies.length >= pageSize) break;
        
        if (!data) {
          stats.skippedNoData++;
          continue;
        }
        
        // Check if active
        const situacao = String(data.situacao_cadastral || "").toLowerCase();
        const isActive = situacao === "ativa" || situacao === "02" || situacao.includes("ativ");
        
        // Save to cache (even inactive ones for faster future filtering)
        if (!fromCache && source) {
          cacheEntriesToSave.push({
            cnpj,
            data,
            situacao: data.situacao_cadastral || "",
            source
          });
        }
        
        if (!isActive) {
          stats.skippedInactive++;
          continue;
        }
        
        // Apply location filters
        const dataUF = data.uf?.toUpperCase();
        const dataMunicipio = (data.municipio || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const matchesState = !filters.states?.length || 
          filters.states.some(s => s.toUpperCase() === dataUF);
        
        const matchesCity = !filters.cities?.length || 
          filters.cities.some(c => {
            const normalizedFilter = c.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return dataMunicipio.includes(normalizedFilter) || normalizedFilter.includes(dataMunicipio);
          });
        
        if (!matchesState || !matchesCity) {
          stats.skippedLocation++;
          continue;
        }

        const phones = [data.ddd_telefone_1, data.ddd_telefone_2].filter(Boolean);
        const emails = data.email ? [data.email.toLowerCase()] : [];

        // Use CNAE description as segment instead of filter segment
        const cnaeDesc = data.cnae_fiscal_descricao || "";
        const derivedSegment = cnaeDesc || filters.segments?.[0] || "";

        companies.push({
          id: cnpj,
          cnpj: cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"),
          name: data.nome_fantasia || data.razao_social,
          razao_social: data.razao_social,
          segment: derivedSegment,
          cnae_code: data.cnae_fiscal?.toString() || "",
          cnae_description: data.cnae_fiscal_descricao || "",
          company_size: data.porte || "",
          city: data.municipio,
          state: data.uf,
          neighborhood: data.bairro || "",
          zip_code: data.cep || "",
          address: data.logradouro || "",
          number: data.numero || "",
          complement: data.complemento || "",
          has_phone: phones.length > 0,
          has_email: emails.length > 0,
          has_website: false,
          website_url: "",
          phones: phones.map(p => String(p).replace(/\D/g, "")),
          emails,
          situacao: data.situacao_cadastral || "ATIVA",
          capital_social: data.capital_social,
          data_abertura: data.data_inicio_atividade,
          enriched: false,
        });
      }
      
      // NO DELAY between batches - maximum speed
    }

    // Save cache entries in background (fire and forget)
    if (supabase && cacheEntriesToSave.length > 0) {
      saveToCacheBatch(supabase, cacheEntriesToSave).then(() => {
        console.log(`💾 ${cacheEntriesToSave.length} CNPJs salvos no cache`);
      });
    }

    stats.companiesReturned = companies.length;
    stats.processingTimeMs = Date.now() - startTime;

    console.log("───────────────────────────────────────────────────────────");
    console.log("📈 ESTATÍSTICAS:");
    console.log(`   • CNPJs encontrados: ${stats.totalCNPJsFound}`);
    console.log(`   • CNPJs processados: ${stats.cnpjsProcessed}`);
    console.log(`   • Cache hits: ${stats.cacheHits}`);
    console.log(`   • Sem dados: ${stats.skippedNoData}`);
    console.log(`   • Inativos: ${stats.skippedInactive}`);
    console.log(`   • Local errado: ${stats.skippedLocation}`);
    console.log(`   • Retornadas: ${stats.companiesReturned}`);
    console.log(`   • Tempo: ${stats.processingTimeMs}ms`);
    console.log("═══════════════════════════════════════════════════════════");

    return new Response(
      JSON.stringify({
        companies: companies.slice(0, pageSize),
        total: allCNPJs.size,
        page: filters.page || 1,
        pageSize,
        source: "firecrawl+cnpj",
        debug: stats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    stats.processingTimeMs = Date.now() - startTime;
    console.error("❌ ERRO:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno",
        companies: [],
        total: 0,
        debug: stats,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
