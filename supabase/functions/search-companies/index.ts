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
    return await response.json();
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
      situacao_cadastral: data.estabelecimento?.situacao_cadastral,
      capital_social: data.capital_social,
      data_inicio_atividade: data.estabelecimento?.data_inicio_atividade,
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const filters: SearchFilters = await req.json();
    console.log("Search filters:", filters);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (!FIRECRAWL_API_KEY) {
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
    console.log("Search queries:", searchQueries);

    // Run parallel searches
    const allCNPJs: Set<string> = new Set();
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
            limit: 20,
            lang: "pt-BR",
            country: "BR",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const results = data.data || [];
          
          for (const result of results) {
            const text = `${result.markdown || ""} ${result.title || ""} ${result.description || ""}`;
            const cnpjs = extractCNPJs(text);
            cnpjs.forEach(c => allCNPJs.add(c));
          }
        }
      } catch (e) {
        console.error("Search error:", e);
      }
    });

    await Promise.all(searchPromises);
    console.log("Found CNPJs:", allCNPJs.size);

    // Lookup CNPJs in parallel batches
    const pageSize = filters.pageSize || 10;
    const cnpjArray = [...allCNPJs].slice(0, pageSize * 3);
    
    const companies: any[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < cnpjArray.length && companies.length < pageSize; i += batchSize) {
      const batch = cnpjArray.slice(i, i + batchSize);
      
      const lookupPromises = batch.map(async (cnpj) => {
        let data = await quickLookupCNPJ(cnpj);
        
        if (!data) {
          await new Promise(r => setTimeout(r, 100));
          data = await fallbackLookupCNPJ(cnpj);
        }
        
        return { cnpj, data };
      });

      const results = await Promise.all(lookupPromises);
      
      for (const { cnpj, data } of results) {
        if (companies.length >= pageSize) break;
        
        if (!data) continue;
        
        // Check if active
        const isActive = data.situacao_cadastral === "ATIVA" || 
                         data.situacao_cadastral === "Ativa";
        if (!isActive) continue;
        
        // Apply location filters
        const matchesState = !filters.states?.length || filters.states.includes(data.uf);
        const matchesCity = !filters.cities?.length || filters.cities.some(c => 
          data.municipio?.toUpperCase().includes(c.toUpperCase())
        );
        
        if (!matchesState || !matchesCity) continue;

        // Get basic contact info
        const phones = [data.ddd_telefone_1, data.ddd_telefone_2].filter(Boolean);
        const emails = data.email ? [data.email.toLowerCase()] : [];

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
          // Flag to indicate data can be enriched
          enriched: false,
        });
      }
      
      // Small delay between batches
      if (companies.length < pageSize) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log("Returning companies:", companies.length);

    return new Response(
      JSON.stringify({
        companies: companies.slice(0, pageSize),
        total: allCNPJs.size,
        page: filters.page || 1,
        pageSize,
        source: "firecrawl+cnpj",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno",
        companies: [],
        total: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
