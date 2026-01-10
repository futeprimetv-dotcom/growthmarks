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
  limit?: number;
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
  "Educação - Escolas e Colégios": [
    "escola particular", "colégio particular", "escola privada", "colégio privado",
    "escola infantil", "educação infantil", "escola fundamental", "colégio ensino médio",
    "escola bilíngue", "colégio bilíngue", "escola integral", "creche particular"
  ],
  "Educação - Cursos Profissionalizantes": [
    "curso profissionalizante", "curso técnico", "escola técnica", "centro de formação",
    "curso de capacitação", "treinamento profissional", "formação técnica"
  ],
  "Educação - Idiomas": [
    "escola de idiomas", "curso de inglês", "curso de espanhol", "escola de línguas",
    "curso de idiomas", "centro de idiomas", "english school", "instituto de idiomas"
  ],
  "Veículos - Lojas de Carros": [
    "loja de carros", "revenda de veículos", "seminovos", "carros usados", "multimarcas",
    "veículos usados", "revenda de carros", "loja de automóveis", "carros seminovos"
  ],
  "Veículos - Concessionárias": [
    "concessionária", "concessionária autorizada", "revendedora autorizada",
    "concessionária de veículos", "agência de veículos", "dealer"
  ],
  "Veículos - Barcos e Lanchas": [
    "loja de barcos", "venda de lanchas", "náutica", "marina", "jet ski",
    "embarcações", "loja náutica", "revenda de barcos", "yachts"
  ],
  "Veículos - Motorhomes e Trailers": [
    "motorhome", "trailer", "camper", "veículo recreativo", "motor home",
    "food truck", "reboque", "carreta"
  ],
  "Imobiliárias": [
    "imobiliária", "corretor de imóveis", "imóveis", "venda de imóveis",
    "aluguel de imóveis", "corretora de imóveis", "administradora de imóveis",
    "construtora", "incorporadora", "empreendimentos imobiliários"
  ],
  "Comércio Automotivo": ["concessionária", "revenda veículos", "loja carros", "seminovos", "multimarcas"],
  "Restaurantes": ["restaurante", "pizzaria", "hamburgueria", "lanchonete", "churrascaria"],
  "Clínicas e Consultórios": ["clínica médica", "consultório", "dentista", "laboratório", "fisioterapia"],
  "Academias e Fitness": ["academia", "crossfit", "pilates", "fitness", "musculação"],
  "Salões de Beleza": ["salão beleza", "cabeleireiro", "barbearia", "estética"],
  "Serviços Contábeis": ["escritório contábil", "contabilidade", "contador"],
  "Advocacia": ["escritório advocacia", "advogado", "jurídico"],
  "Tecnologia": ["software", "TI", "informática", "startup", "sistemas"],
  "Construção Civil": ["construtora", "empreiteira", "engenharia", "obras"],
};

// Build search queries for CNPJs - OPTIMIZED for active companies
function buildSearchQueries(filters: PullFilters): string[] {
  const queries: string[] = [];
  const segment = filters.segments?.[0] || "";
  const city = filters.cities?.[0] || "";
  const stateAbbr = filters.states?.[0] || "";
  const stateName = stateAbbreviations[stateAbbr] || stateAbbr;
  const synonyms = segmentSynonyms[segment] || [];

  // Focus on sites that typically list ACTIVE companies
  queries.push(`site:cnpj.biz "${city || stateName}" "${segment}" CNPJ ativa situacao cadastral`);
  queries.push(`site:empresascnpj.com "${city}" ${stateAbbr} ${segment} CNPJ ativa`);
  queries.push(`site:casadosdados.com.br "${segment}" "${city || stateName}" empresa ativa`);
  queries.push(`"${segment}" "${city || stateName}" CNPJ empresas ativas funcionando`);
  
  // Add synonym-based queries
  if (synonyms.length > 0) {
    queries.push(`site:cnpj.biz "${city || stateName}" "${synonyms[0]}" ativa`);
    if (synonyms.length > 1) {
      queries.push(`"${synonyms[1]}" "${city}" ${stateAbbr} CNPJ empresa ativa`);
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

// Validate CNPJ format
function isValidCNPJFormat(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // All same digit
  return true;
}

// Quick CNPJ lookup using Brasil API with fallbacks - OPTIMIZED with timeout
async function lookupCNPJ(cnpj: string): Promise<any | null> {
  const timeout = 3000; // 3 seconds max per request
  
  // Try Brasil API first (fastest)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const situacao = data.descricao_situacao_cadastral || data.situacao_cadastral || "";
      return {
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnae_fiscal_descricao: data.cnae_fiscal_descricao,
        porte: data.porte,
        municipio: data.municipio,
        uf: data.uf,
        situacao_cadastral: situacao,
        is_ativa: situacao.toLowerCase().includes("ativ"),
      };
    }
  } catch (e) {
    // Fallback to Minha Receita
  }
  
  // Fallback: Minha Receita (open-source, reliable)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`https://minhareceita.org/${cnpj}`, {
      headers: { "Accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const situacao = data.descricao_situacao_cadastral || "";
      return {
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnae_fiscal_descricao: data.cnae_fiscal_descricao,
        porte: data.porte,
        municipio: data.municipio,
        uf: data.uf,
        situacao_cadastral: situacao,
        is_ativa: situacao.toLowerCase().includes("ativ"),
      };
    }
  } catch (e) {
    // Continue to next fallback
  }

  // Last fallback: CNPJ.ws (public)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
      headers: { "Accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const situacao = data.estabelecimento?.situacao_cadastral || "Ativa";
      return {
        razao_social: data.razao_social,
        nome_fantasia: data.estabelecimento?.nome_fantasia,
        cnae_fiscal_descricao: data.estabelecimento?.atividade_principal?.descricao,
        porte: data.porte?.descricao,
        municipio: data.estabelecimento?.cidade?.nome,
        uf: data.estabelecimento?.estado?.sigla,
        situacao_cadastral: situacao,
        is_ativa: String(situacao).toLowerCase().includes("ativ"),
      };
    }
  } catch (e) {
    // All APIs failed
  }

  return null;
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
    const expiryDays = isActive ? 7 : 30; // Cache inactive longer
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
  if (!porte) return true; // Allow if no porte info

  const porteNormalized = porte.toLowerCase();
  
  for (const size of sizesFilter) {
    const sizeNorm = size.toLowerCase();
    if (sizeNorm === "mei" && porteNormalized.includes("mei")) return true;
    if (sizeNorm === "me" && (porteNormalized.includes("micro") || porteNormalized.includes("me "))) return true;
    if (sizeNorm === "epp" && (porteNormalized.includes("pequeno") || porteNormalized.includes("epp"))) return true;
    if (sizeNorm === "medio" && (porteNormalized.includes("médio") || porteNormalized.includes("medio"))) return true;
    if (sizeNorm === "grande" && porteNormalized.includes("grande")) return true;
  }
  
  return false;
}

// Process batch of CNPJs in parallel - OPTIMIZED
async function processBatch(
  batch: string[],
  supabase: any,
  filters: PullFilters,
  stats: any,
  onResult: (result: any) => void
): Promise<void> {
  const results = await Promise.allSettled(
    batch.map(async (cnpj) => {
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
    })
  );

  for (const result of results) {
    stats.cnpjsProcessed++;
    
    if (result.status !== "fulfilled" || !result.value.data) continue;

    const { cnpj, data } = result.value;

    // Check if ACTIVE - early filter
    const situacao = String(data.situacao_cadastral || "").toLowerCase();
    const isActive = situacao === "ativa" || situacao === "02" || situacao.includes("ativ") || data.is_ativa;

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

    stats.activeCount++;
    onResult({
      cnpj: formattedCNPJ,
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia,
      porte: data.porte,
      situacao: data.situacao_cadastral,
      municipio: data.municipio,
      uf: data.uf,
      cnae_fiscal_descricao: data.cnae_fiscal_descricao,
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const filters: PullFilters = body;
    const streaming = body.streaming === true;
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔍 PUXAR CNPJs ATIVOS (OTIMIZADO)" + (streaming ? " [STREAMING]" : ""));
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
      const errorResponse = { error: "Conector Firecrawl não configurado.", cnpjs: [], stats: {} };
      return new Response(
        JSON.stringify(errorResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For streaming responses
    if (streaming) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            const searchQueries = buildSearchQueries(filters);
            console.log("🔎 Queries:", searchQueries);

            send({ type: "status", message: "Buscando CNPJs ativos na web..." });

            // Collect CNPJs from search - PARALLEL
            const allCNPJs: Set<string> = new Set();
            let queryCount = 0;
            
            const searchPromises = searchQueries.map(async (query) => {
              try {
                const response = await fetch("https://api.firecrawl.dev/v1/search", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    query,
                    limit: 25, // Reduced for speed
                    lang: "pt-BR",
                    country: "BR",
                    scrapeOptions: { formats: ["markdown"] },
                  }),
                });

                if (response.ok) {
                  const data = await response.json();
                  const results = data.data || [];
                  queryCount++;
                  console.log(`  ✓ Query ${queryCount}: ${results.length} resultados`);
                  
                  for (const result of results) {
                    const text = `${result.markdown || ""} ${result.title || ""} ${result.description || ""}`;
                    extractCNPJs(text).filter(isValidCNPJFormat).forEach(c => allCNPJs.add(c));
                  }
                }
              } catch (e) {
                console.error(`  ✗ Query erro:`, e);
              }
            });

            await Promise.all(searchPromises);
            
            // Send progress updates after all queries complete
            send({ 
              type: "search_progress", 
              queriesCompleted: searchQueries.length, 
              totalQueries: searchQueries.length,
              cnpjsFound: allCNPJs.size 
            });

            console.log(`📊 CNPJs únicos encontrados: ${allCNPJs.size}`);
            send({ type: "status", message: "Validando CNPJs com Brasil API..." });
            send({ type: "search_complete", totalCNPJsFound: allCNPJs.size });

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
              send({ type: "complete", stats });
              controller.close();
              return;
            }

            // Process CNPJs - OPTIMIZED batch size for speed with CPU timeout protection
            const cnpjArray = Array.from(allCNPJs);
            const batchSize = 5; // Smaller batches to prevent CPU timeout
            const maxResults = filters.limit || 100;
            const maxCNPJsToProcess = Math.min(cnpjArray.length, maxResults * 5); // Process at most 5x the limit

            console.log(`🌊 Iniciando modo streaming...`);
            console.log(`   Processando até ${maxCNPJsToProcess} CNPJs para encontrar ${maxResults} ativos`);

            for (let i = 0; i < maxCNPJsToProcess && stats.activeCount < maxResults; i += batchSize) {
              const batch = cnpjArray.slice(i, i + batchSize);
              
              await processBatch(batch, supabase, filters, stats, (result) => {
                send({
                  type: "cnpj",
                  cnpj: result,
                  progress: {
                    processed: stats.cnpjsProcessed,
                    total: maxCNPJsToProcess,
                    found: stats.activeCount,
                    inactiveCount: stats.skippedInactive,
                  }
                });
              });

              // Send progress update
              send({
                type: "progress",
                processed: stats.cnpjsProcessed,
                total: maxCNPJsToProcess,
                found: stats.activeCount,
                inactiveCount: stats.skippedInactive,
                cacheHits: stats.cacheHits,
              });

              // Stop if we have enough results
              if (stats.activeCount >= maxResults) {
                break;
              }
            }

            stats.processingTimeMs = Date.now() - startTime;

            console.log("═══════════════════════════════════════════════════════════");
            console.log(`✅ BUSCA CONCLUÍDA em ${stats.processingTimeMs}ms`);
            console.log(`   CNPJs ativos: ${stats.activeCount}`);
            console.log(`   Inativos filtrados: ${stats.skippedInactive}`);
            console.log(`   Cache hits: ${stats.cacheHits}`);
            console.log("═══════════════════════════════════════════════════════════");

            send({ type: "complete", stats });
            controller.close();
          } catch (error) {
            console.error("❌ Erro no streaming:", error);
            send({ type: "error", message: error instanceof Error ? error.message : "Erro desconhecido" });
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming response
    const searchQueries = buildSearchQueries(filters);
    console.log("🔎 Queries:", searchQueries);

    // Collect CNPJs from search - PARALLEL
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
            limit: 25,
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
            extractCNPJs(text).filter(isValidCNPJFormat).forEach(c => allCNPJs.add(c));
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

    // Process CNPJs - Limited to prevent CPU timeout
    const activeCNPJs: any[] = [];
    const cnpjArray = Array.from(allCNPJs);
    const batchSize = 5;
    const maxResults = filters.limit || 100;
    const maxCNPJsToProcess = Math.min(cnpjArray.length, maxResults * 5);

    console.log(`🔄 Processando ${maxCNPJsToProcess} CNPJs (modo normal)...`);

    for (let i = 0; i < maxCNPJsToProcess && activeCNPJs.length < maxResults; i += batchSize) {
      const batch = cnpjArray.slice(i, i + batchSize);
      
      await processBatch(batch, supabase, filters, stats, (result) => {
        activeCNPJs.push(result);
      });

      if (activeCNPJs.length >= maxResults) {
        break;
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
