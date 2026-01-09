import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Build search query for Firecrawl - FAST search in business directories
function buildSearchQueries(filters: SearchFilters): string[] {
  const queries: string[] = [];
  const segment = filters.segments?.[0] || "";
  const city = filters.cities?.[0] || "";
  const stateAbbr = filters.states?.[0] || "";
  const stateName = stateAbbreviations[stateAbbr] || stateAbbr;

  // Primary: Search business listing sites
  queries.push(`site:cnpj.biz "${segment}" "${city}" ${stateAbbr}`);
  
  // Secondary: General business search  
  queries.push(`empresas de ${segment} em ${city} ${stateName} CNPJ`);
  
  // Tertiary: Company listings
  queries.push(`${segment} ${city} ${stateAbbr} empresa lista CNPJ telefone`);

  return queries;
}

// Extract CNPJ from text using regex
function extractCNPJs(text: string): string[] {
  const cnpjRegex = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
  const matches = text.match(cnpjRegex) || [];
  return [...new Set(matches.map(cnpj => cnpj.replace(/\D/g, "")))];
}

// Quick CNPJ lookup - only basic data
async function quickLookupCNPJ(cnpj: string): Promise<any | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    if (!response.ok) return null;
    const data = await response.json();
    // BrasilAPI returns descricao_situacao_cadastral as text (e.g., "ATIVA", "BAIXADA")
    // and situacao_cadastral as numeric code
    return {
      ...data,
      situacao_cadastral: data.descricao_situacao_cadastral || data.situacao_cadastral
    };
  } catch {
    return null;
  }
}

// Fallback to CNPJ.ws
async function fallbackLookupCNPJ(cnpj: string): Promise<any | null> {
  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    
    // situacao_cadastral from cnpj.ws: "Ativa", "Baixada", "Inapta", etc.
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
  skippedNoData: number;
  skippedInactive: number;
  skippedLocation: number;
  companiesReturned: number;
  apiErrors: { brasilapi: number; cnpjws: number };
  processingTimeMs: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SearchStats = {
    totalCNPJsFound: 0,
    cnpjsProcessed: 0,
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
    console.log("🔍 NOVA BUSCA DE EMPRESAS");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 Filtros recebidos:", JSON.stringify(filters, null, 2));

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
    console.log("🔎 Queries de busca:", searchQueries);

    // Run parallel searches
    const allCNPJs: Set<string> = new Set();
    const searchPromises = searchQueries.map(async (query, index) => {
      try {
        console.log(`  → Executando query ${index + 1}: "${query.substring(0, 50)}..."`);
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 20,
            lang: "pt-BR",
            country: "BR",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const results = data.data || [];
          console.log(`  ✓ Query ${index + 1}: ${results.length} resultados do Firecrawl`);
          
          let cnpjsFromQuery = 0;
          for (const result of results) {
            const text = `${result.markdown || ""} ${result.title || ""} ${result.description || ""}`;
            const cnpjs = extractCNPJs(text);
            cnpjs.forEach(c => allCNPJs.add(c));
            cnpjsFromQuery += cnpjs.length;
          }
          console.log(`  ✓ Query ${index + 1}: ${cnpjsFromQuery} CNPJs extraídos`);
        } else {
          console.log(`  ✗ Query ${index + 1}: Firecrawl retornou status ${response.status}`);
        }
      } catch (e) {
        console.error(`  ✗ Query ${index + 1} erro:`, e);
      }
    });

    await Promise.all(searchPromises);
    stats.totalCNPJsFound = allCNPJs.size;
    console.log("───────────────────────────────────────────────────────────");
    console.log(`📊 Total de CNPJs únicos encontrados: ${allCNPJs.size}`);

    if (allCNPJs.size === 0) {
      console.log("⚠️ Nenhum CNPJ encontrado nas buscas do Firecrawl");
      console.log("   Possíveis causas:");
      console.log("   - Termo de busca muito específico");
      console.log("   - Cidade/segmento com poucos resultados indexados");
      console.log("   - Limite de API do Firecrawl atingido");
    }

    // Lookup CNPJs in parallel batches - process more to find active ones
    const pageSize = filters.pageSize || 10;
    // Process up to 10x more CNPJs since many will be inactive
    const cnpjArray = [...allCNPJs].slice(0, Math.min(pageSize * 10, 200));
    console.log(`🔄 Processando ${cnpjArray.length} CNPJs (limite: ${Math.min(pageSize * 10, 200)})`);
    
    
    const companies: any[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < cnpjArray.length && companies.length < pageSize; i += batchSize) {
      const batch = cnpjArray.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      console.log(`  📦 Batch ${batchNum}: processando ${batch.length} CNPJs...`);
      
      const lookupPromises = batch.map(async (cnpj) => {
        let data = await quickLookupCNPJ(cnpj);
        let source = "brasilapi";
        
        if (!data) {
          stats.apiErrors.brasilapi++;
          await new Promise(r => setTimeout(r, 100));
          data = await fallbackLookupCNPJ(cnpj);
          source = "cnpjws";
          if (!data) {
            stats.apiErrors.cnpjws++;
          }
        }
        
        return { cnpj, data, source };
      });

      const results = await Promise.all(lookupPromises);
      
      for (const { cnpj, data, source } of results) {
        stats.cnpjsProcessed++;
        
        if (companies.length >= pageSize) break;
        
        if (!data) {
          stats.skippedNoData++;
          console.log(`    ✗ ${cnpj}: Sem dados (APIs não retornaram)`);
          continue;
        }
        
        // Check if active - handle various API response formats
        const situacao = String(data.situacao_cadastral || "").toLowerCase();
        const isActive = situacao === "ativa" || 
                         situacao === "02" || // CNPJ.ws code for active
                         situacao.includes("ativ");
        if (!isActive) {
          stats.skippedInactive++;
          console.log(`    ✗ ${cnpj}: Inativo (situacao: "${data.situacao_cadastral}")`);
          continue;
        }
        
        // Apply location filters - more flexible matching
        const dataUF = data.uf?.toUpperCase();
        const dataMunicipio = data.municipio?.toUpperCase() || "";
        
        const matchesState = !filters.states?.length || 
          filters.states.some(s => s.toUpperCase() === dataUF);
        const matchesCity = !filters.cities?.length || 
          filters.cities.some(c => dataMunicipio.includes(c.toUpperCase()) || c.toUpperCase().includes(dataMunicipio));
        
        if (!matchesState || !matchesCity) {
          stats.skippedLocation++;
          console.log(`    ✗ ${cnpj}: Local não corresponde (${data.municipio}/${data.uf} vs ${filters.cities?.join(",")}/${filters.states?.join(",")})`);
          continue;
        }

        // Get basic contact info
        const phones = [data.ddd_telefone_1, data.ddd_telefone_2].filter(Boolean);
        const emails = data.email ? [data.email.toLowerCase()] : [];

        console.log(`    ✓ ${cnpj}: ${data.nome_fantasia || data.razao_social} (${source})`);

        companies.push({
          id: cnpj,
          cnpj: cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"),
          name: data.nome_fantasia || data.razao_social,
          razao_social: data.razao_social,
          segment: filters.segments?.[0] || "",
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
      
      // Small delay between batches
      if (companies.length < pageSize) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    stats.companiesReturned = companies.length;
    stats.processingTimeMs = Date.now() - startTime;

    console.log("───────────────────────────────────────────────────────────");
    console.log("📈 ESTATÍSTICAS DA BUSCA:");
    console.log(`   • CNPJs encontrados (Firecrawl): ${stats.totalCNPJsFound}`);
    console.log(`   • CNPJs processados: ${stats.cnpjsProcessed}`);
    console.log(`   • Ignorados (sem dados): ${stats.skippedNoData}`);
    console.log(`   • Ignorados (inativos): ${stats.skippedInactive}`);
    console.log(`   • Ignorados (local errado): ${stats.skippedLocation}`);
    console.log(`   • Empresas retornadas: ${stats.companiesReturned}`);
    console.log(`   • Erros BrasilAPI: ${stats.apiErrors.brasilapi}`);
    console.log(`   • Erros CNPJ.ws: ${stats.apiErrors.cnpjws}`);
    console.log(`   • Tempo total: ${stats.processingTimeMs}ms`);
    console.log("═══════════════════════════════════════════════════════════");

    if (stats.companiesReturned === 0) {
      console.log("⚠️ DIAGNÓSTICO: Nenhuma empresa retornada");
      if (stats.totalCNPJsFound === 0) {
        console.log("   → Problema: Firecrawl não encontrou CNPJs");
        console.log("   → Solução: Verificar queries ou usar segmento mais amplo");
      } else if (stats.skippedNoData === stats.cnpjsProcessed) {
        console.log("   → Problema: APIs de CNPJ não retornaram dados");
        console.log("   → Solução: Pode ser rate limit das APIs públicas");
      } else if (stats.skippedInactive > 0) {
        console.log(`   → ${stats.skippedInactive} empresas estavam inativas`);
      } else if (stats.skippedLocation > 0) {
        console.log(`   → ${stats.skippedLocation} empresas não corresponderam ao local`);
        console.log("   → Solução: Firecrawl encontrou CNPJs de outras cidades");
      }
    }

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
    console.error("❌ ERRO CRÍTICO:", error);
    console.log("📈 Stats até o erro:", stats);
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
