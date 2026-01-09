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

// Build search query for Firecrawl
function buildSearchQuery(filters: SearchFilters): string {
  const parts: string[] = [];
  
  // Add segment/activity
  if (filters.segments?.length) {
    parts.push(filters.segments.join(" OR "));
  }
  
  // Add city
  if (filters.cities?.length) {
    parts.push(filters.cities[0]);
  }
  
  // Add state (full name)
  if (filters.states?.length) {
    const stateName = stateAbbreviations[filters.states[0]] || filters.states[0];
    parts.push(stateName);
  }
  
  // Add size keywords
  if (filters.companySizes?.length) {
    const sizeMap: Record<string, string> = {
      'MEI': 'microempreendedor',
      'ME': 'microempresa',
      'Micro': 'microempresa',
      'Pequeno': 'pequena empresa',
      'Medio': 'média empresa',
      'Grande': 'grande empresa',
    };
    const sizeTerms = filters.companySizes.map(s => sizeMap[s] || s).filter(Boolean);
    if (sizeTerms.length) {
      parts.push(sizeTerms[0]);
    }
  }
  
  // Add Brazil and business keywords
  parts.push("empresa CNPJ");
  
  return parts.join(" ");
}

// Extract CNPJ from text using regex
function extractCNPJs(text: string): string[] {
  const cnpjRegex = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
  const matches = text.match(cnpjRegex) || [];
  return [...new Set(matches.map(cnpj => cnpj.replace(/\D/g, "")))];
}

// Lookup CNPJ using BrasilAPI (free)
async function lookupCNPJ(cnpj: string): Promise<any | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Alternative: ReceitaWS (free with limits)
async function lookupCNPJReceitaWS(cnpj: string): Promise<any | null> {
  try {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status === "ERROR") return null;
    return data;
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
          error: "Conector Firecrawl não configurado. Configure nas configurações do projeto.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search query
    const searchQuery = buildSearchQuery(filters);
    console.log("Firecrawl search query:", searchQuery);

    // Search using Firecrawl
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 20,
        lang: "pt-BR",
        country: "BR",
        scrapeOptions: {
          formats: ["markdown"],
        },
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error("Firecrawl error:", firecrawlResponse.status, errorText);
      return new Response(
        JSON.stringify({
          companies: [],
          total: 0,
          page: 1,
          pageSize: filters.pageSize || 10,
          source: "firecrawl",
          error: `Erro na busca web (${firecrawlResponse.status})`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log("Firecrawl results:", firecrawlData.data?.length || 0);

    // Extract CNPJs from search results
    const allCNPJs: string[] = [];
    const results = firecrawlData.data || [];
    
    for (const result of results) {
      const text = `${result.markdown || ""} ${result.title || ""} ${result.description || ""}`;
      const cnpjs = extractCNPJs(text);
      allCNPJs.push(...cnpjs);
    }

    // Deduplicate CNPJs
    const uniqueCNPJs = [...new Set(allCNPJs)];
    console.log("Found CNPJs:", uniqueCNPJs.length);

    // Lookup each CNPJ with rate limiting
    const companies: any[] = [];
    const pageSize = filters.pageSize || 10;
    const cnpjsToLookup = uniqueCNPJs.slice(0, Math.min(pageSize * 2, 20)); // Limit lookups

    for (let i = 0; i < cnpjsToLookup.length && companies.length < pageSize; i++) {
      const cnpj = cnpjsToLookup[i];
      
      // Add delay to avoid rate limiting (BrasilAPI is free)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      let data = await lookupCNPJ(cnpj);
      
      // Fallback to ReceitaWS if BrasilAPI fails
      if (!data) {
        await new Promise(resolve => setTimeout(resolve, 500));
        data = await lookupCNPJReceitaWS(cnpj);
      }

      if (data && data.situacao_cadastral === "ATIVA") {
        // Apply filters
        const matchesState = !filters.states?.length || filters.states.includes(data.uf);
        const matchesCity = !filters.cities?.length || filters.cities.some(c => 
          data.municipio?.toUpperCase().includes(c.toUpperCase())
        );

        if (matchesState && matchesCity) {
          companies.push({
            id: cnpj,
            cnpj: cnpj,
            name: data.nome_fantasia || data.razao_social,
            razao_social: data.razao_social,
            segment: data.cnae_fiscal_descricao || "",
            cnae_code: data.cnae_fiscal?.toString() || "",
            cnae_description: data.cnae_fiscal_descricao || "",
            company_size: data.porte || "",
            city: data.municipio,
            state: data.uf,
            neighborhood: data.bairro,
            zip_code: data.cep,
            address: `${data.descricao_tipo_de_logradouro || ""} ${data.logradouro || ""}`.trim(),
            number: data.numero,
            complement: data.complemento,
            has_phone: !!data.ddd_telefone_1,
            has_email: !!data.email,
            has_website: false,
            phones: [data.ddd_telefone_1, data.ddd_telefone_2].filter(Boolean),
            emails: data.email ? [data.email.toLowerCase()] : [],
            situacao: data.situacao_cadastral || "ATIVA",
            capital_social: data.capital_social,
            data_abertura: data.data_inicio_atividade,
          });
        }
      }
    }

    // If no CNPJs found in search, return search results as basic info
    if (companies.length === 0 && results.length > 0) {
      // Extract company info from search results without CNPJ lookup
      for (const result of results.slice(0, pageSize)) {
        const title = result.title || "";
        const url = result.url || "";
        
        // Skip if it's not a business listing
        if (!title || url.includes("google.com") || url.includes("facebook.com")) continue;

        companies.push({
          id: `search-${Date.now()}-${Math.random()}`,
          cnpj: "",
          name: title.split(" - ")[0].trim(),
          razao_social: title,
          segment: filters.segments?.[0] || "",
          cnae_code: "",
          cnae_description: "",
          company_size: "",
          city: filters.cities?.[0] || "",
          state: filters.states?.[0] || "",
          neighborhood: "",
          zip_code: "",
          address: "",
          number: "",
          complement: "",
          has_phone: false,
          has_email: false,
          has_website: !!url,
          website_url: url,
          phones: [],
          emails: [],
          situacao: "DESCONHECIDA",
          capital_social: null,
          data_abertura: null,
          source_url: url,
        });
      }
    }

    console.log("Returning companies:", companies.length);

    return new Response(
      JSON.stringify({
        companies: companies.slice(0, pageSize),
        total: uniqueCNPJs.length || results.length,
        page: filters.page || 1,
        pageSize,
        source: "firecrawl+brasilapi",
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
