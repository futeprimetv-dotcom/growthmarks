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

// Build targeted search queries for better results
function buildSearchQueries(filters: SearchFilters): string[] {
  const queries: string[] = [];
  const segment = filters.segments?.[0] || "";
  const city = filters.cities?.[0] || "";
  const stateName = filters.states?.[0] ? (stateAbbreviations[filters.states[0]] || filters.states[0]) : "";
  const stateAbbr = filters.states?.[0] || "";

  // Query 1: Search for companies in specialized directories
  if (segment && city) {
    queries.push(`site:cnpj.biz ${segment} ${city} ${stateAbbr}`);
    queries.push(`site:empresascnpj.com ${segment} ${city} ${stateAbbr}`);
    queries.push(`${segment} ${city} ${stateName} telefone email contato CNPJ`);
  }

  // Query 2: Google Maps style search
  if (segment && city) {
    queries.push(`${segment} em ${city} ${stateName} telefone whatsapp`);
  }

  // Query 3: LinkedIn companies
  if (segment && city) {
    queries.push(`site:linkedin.com/company ${segment} ${city}`);
  }

  // Fallback query
  if (queries.length === 0) {
    queries.push(`empresas ${segment || "comercio"} ${city || ""} ${stateName || ""} CNPJ contato`);
  }

  return queries;
}

// Extract CNPJ from text using regex
function extractCNPJs(text: string): string[] {
  const cnpjRegex = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
  const matches = text.match(cnpjRegex) || [];
  return [...new Set(matches.map(cnpj => cnpj.replace(/\D/g, "")))];
}

// Extract phone numbers from text
function extractPhones(text: string): string[] {
  // Brazilian phone patterns: (11) 99999-9999, 11999999999, etc
  const phoneRegex = /(?:\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}/g;
  const matches = text.match(phoneRegex) || [];
  
  return [...new Set(matches
    .map(phone => phone.replace(/\D/g, ""))
    .filter(phone => phone.length >= 10 && phone.length <= 11)
  )];
}

// Extract emails from text
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return [...new Set(matches.map(e => e.toLowerCase()))];
}

// Extract website from URL
function extractWebsite(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Skip known aggregator sites
    const skipDomains = ['google.com', 'facebook.com', 'linkedin.com', 'instagram.com', 
                         'cnpj.biz', 'empresascnpj.com', 'cnpja.com', 'casadosdados.com.br'];
    if (skipDomains.some(d => parsedUrl.hostname.includes(d))) {
      return "";
    }
    return parsedUrl.origin;
  } catch {
    return "";
  }
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

// Alternative: CNPJ.ws API
async function lookupCNPJWS(cnpj: string): Promise<any | null> {
  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) return null;
    const data = await response.json();
    
    // Map to standard format
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
      complemento: data.estabelecimento?.complemento,
      ddd_telefone_1: data.estabelecimento?.ddd1 && data.estabelecimento?.telefone1 
        ? `${data.estabelecimento.ddd1}${data.estabelecimento.telefone1}` : null,
      ddd_telefone_2: data.estabelecimento?.ddd2 && data.estabelecimento?.telefone2 
        ? `${data.estabelecimento.ddd2}${data.estabelecimento.telefone2}` : null,
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
          error: "Conector Firecrawl não configurado. Configure nas configurações do projeto.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build multiple search queries for better coverage
    const searchQueries = buildSearchQueries(filters);
    console.log("Search queries:", searchQueries);

    // Run searches in parallel (up to 3)
    const allResults: any[] = [];
    const searchPromises = searchQueries.slice(0, 3).map(async (query) => {
      try {
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 15,
            lang: "pt-BR",
            country: "BR",
            scrapeOptions: {
              formats: ["markdown"],
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.data || [];
        }
        return [];
      } catch (e) {
        console.error("Search error for query:", query, e);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    searchResults.forEach(results => allResults.push(...results));
    
    console.log("Total Firecrawl results:", allResults.length);

    // Extract all data from search results
    const extractedData: Map<string, {
      cnpj: string;
      name: string;
      phones: string[];
      emails: string[];
      website: string;
      sourceText: string;
    }> = new Map();

    for (const result of allResults) {
      const text = `${result.markdown || ""} ${result.title || ""} ${result.description || ""}`;
      const cnpjs = extractCNPJs(text);
      const phones = extractPhones(text);
      const emails = extractEmails(text);
      const website = extractWebsite(result.url || "");
      const name = result.title?.split(" - ")[0]?.trim() || "";

      // Store data indexed by CNPJ or by name if no CNPJ
      for (const cnpj of cnpjs) {
        const existing = extractedData.get(cnpj) || {
          cnpj,
          name: "",
          phones: [],
          emails: [],
          website: "",
          sourceText: "",
        };
        
        if (name && !existing.name) existing.name = name;
        existing.phones.push(...phones);
        existing.emails.push(...emails);
        if (website && !existing.website) existing.website = website;
        existing.sourceText += " " + text;
        
        extractedData.set(cnpj, existing);
      }

      // Also store by URL if it looks like a company website
      if (website && cnpjs.length === 0) {
        const key = `url:${website}`;
        if (!extractedData.has(key)) {
          extractedData.set(key, {
            cnpj: "",
            name,
            phones,
            emails,
            website,
            sourceText: text,
          });
        }
      }
    }

    // Get unique CNPJs for lookup
    const cnpjsToLookup = [...extractedData.keys()]
      .filter(k => !k.startsWith("url:"))
      .slice(0, 30);
    
    console.log("CNPJs to lookup:", cnpjsToLookup.length);

    // Lookup CNPJs with multiple API fallbacks
    const companies: any[] = [];
    const pageSize = filters.pageSize || 10;

    for (let i = 0; i < cnpjsToLookup.length && companies.length < pageSize; i++) {
      const cnpj = cnpjsToLookup[i];
      const extracted = extractedData.get(cnpj);
      
      // Add delay to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      // Try multiple APIs
      let data = await lookupCNPJ(cnpj);
      
      if (!data) {
        await new Promise(resolve => setTimeout(resolve, 300));
        data = await lookupCNPJWS(cnpj);
      }
      
      if (!data) {
        await new Promise(resolve => setTimeout(resolve, 300));
        data = await lookupCNPJReceitaWS(cnpj);
      }

      // Check if company is active
      const isActive = data?.situacao_cadastral === "ATIVA" || 
                       data?.situacao_cadastral === "Ativa" ||
                       !data?.situacao_cadastral; // Accept if status unknown

      if (data && isActive) {
        // Apply location filters
        const matchesState = !filters.states?.length || filters.states.includes(data.uf);
        const matchesCity = !filters.cities?.length || filters.cities.some(c => 
          data.municipio?.toUpperCase().includes(c.toUpperCase())
        );

        if (matchesState && matchesCity) {
          // Merge API data with extracted data
          const apiPhones = [data.ddd_telefone_1, data.ddd_telefone_2].filter(Boolean);
          const allPhones = [...new Set([...apiPhones, ...(extracted?.phones || [])])];
          
          const apiEmails = data.email ? [data.email.toLowerCase()] : [];
          const allEmails = [...new Set([...apiEmails, ...(extracted?.emails || [])])];

          // Apply contact filters
          if (filters.hasPhone && allPhones.length === 0) continue;
          if (filters.hasEmail && allEmails.length === 0) continue;

          companies.push({
            id: cnpj,
            cnpj: cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"),
            name: data.nome_fantasia || data.razao_social,
            razao_social: data.razao_social,
            segment: filters.segments?.[0] || data.cnae_fiscal_descricao || "",
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
            has_phone: allPhones.length > 0,
            has_email: allEmails.length > 0,
            has_website: !!(extracted?.website),
            website_url: extracted?.website || "",
            phones: allPhones.map(p => p.replace(/\D/g, "")),
            emails: allEmails,
            situacao: data.situacao_cadastral || "ATIVA",
            capital_social: data.capital_social,
            data_abertura: data.data_inicio_atividade,
          });
        }
      }
    }

    // If we don't have enough results from CNPJ lookups, add extracted website data
    if (companies.length < pageSize) {
      const websiteEntries = [...extractedData.entries()]
        .filter(([key, data]) => key.startsWith("url:") && data.name);

      for (const [, data] of websiteEntries) {
        if (companies.length >= pageSize) break;
        
        // Skip if already have this company by name
        if (companies.some(c => c.name.toLowerCase() === data.name.toLowerCase())) continue;

        // Apply contact filters
        if (filters.hasPhone && data.phones.length === 0) continue;
        if (filters.hasEmail && data.emails.length === 0) continue;

        companies.push({
          id: `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          cnpj: "",
          name: data.name,
          razao_social: data.name,
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
          has_phone: data.phones.length > 0,
          has_email: data.emails.length > 0,
          has_website: !!data.website,
          website_url: data.website,
          phones: [...new Set(data.phones)].slice(0, 3),
          emails: [...new Set(data.emails)].slice(0, 3),
          situacao: "WEB",
          capital_social: null,
          data_abertura: null,
        });
      }
    }

    console.log("Returning companies:", companies.length);

    return new Response(
      JSON.stringify({
        companies: companies.slice(0, pageSize),
        total: Math.max(cnpjsToLookup.length, companies.length),
        page: filters.page || 1,
        pageSize,
        source: "firecrawl+apis",
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
