import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrichRequest {
  cnpj?: string;
  companyName: string;
  city?: string;
  state?: string;
}

// Extract phone numbers from text
function extractPhones(text: string): string[] {
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
  
  // File extensions and patterns to exclude
  const invalidPatterns = [
    /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|tiff)$/i,
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar)$/i,
    /\.(js|ts|css|html|json|xml|txt|md|csv)$/i,
    /example|teste|test|sample|placeholder|noreply|no-reply/i,
    /\d{8,}/,  // Long numeric strings (likely hashes)
    /@\dx\./,  // Patterns like @1x. or @2x. (image variants)
    /[a-f0-9]{8,}\./i,  // Hash-like patterns
  ];
  
  return [...new Set(matches
    .map(e => e.toLowerCase())
    .filter(email => {
      // Check if email matches any invalid pattern
      for (const pattern of invalidPatterns) {
        if (pattern.test(email)) return false;
      }
      // Must have valid TLD
      const parts = email.split("@");
      if (parts.length !== 2) return false;
      const domain = parts[1];
      if (!domain.includes(".")) return false;
      const tld = domain.split(".").pop();
      // Valid email TLDs should be reasonable length
      if (!tld || tld.length < 2 || tld.length > 10) return false;
      return true;
    })
  )];
}

// Extract Instagram handles
function extractInstagram(text: string): string[] {
  const patterns = [
    /instagram\.com\/([a-zA-Z0-9._]{1,30})/gi,
    /instagram:\s*@?([a-zA-Z0-9._]{1,30})/gi,
    /insta:\s*@?([a-zA-Z0-9._]{1,30})/gi,
  ];
  
  // Invalid handle patterns
  const invalidHandles = [
    "com", "br", "p", "reel", "stories", "explore", "accounts", 
    "direct", "help", "about", "privacy", "terms", "api",
    "png", "jpg", "jpeg", "gif", "svg", "webp", "ico"
  ];
  
  const handles: string[] = [];
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const handle = match[1].toLowerCase();
        // Skip if it's an invalid handle or looks like a file extension
        if (invalidHandles.includes(handle)) continue;
        if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(handle)) continue;
        if (/[a-f0-9]{8,}/i.test(handle)) continue;  // Hash-like
        if (/^\d+$/.test(handle)) continue;  // Pure numbers
        if (handle.length < 3) continue;  // Too short
        handles.push(match[1]);
      }
    }
  }
  
  return [...new Set(handles)];
}

// Extract website URL
function extractWebsite(text: string, urls: string[]): string {
  // First, check scraped URLs
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const skipDomains = ['google.com', 'facebook.com', 'linkedin.com', 'instagram.com', 
                           'cnpj.biz', 'empresascnpj.com', 'cnpja.com', 'casadosdados.com.br',
                           'econodata.com.br', 'speedio.com.br', 'consultasocio.com'];
      if (!skipDomains.some(d => parsed.hostname.includes(d))) {
        return parsed.origin;
      }
    } catch {}
  }
  
  // Try to find website in text
  const websiteRegex = /(?:www\.)?([a-zA-Z0-9-]+\.com\.br|[a-zA-Z0-9-]+\.com)/gi;
  const matches = text.matchAll(websiteRegex);
  for (const match of matches) {
    const domain = match[0];
    if (!domain.includes("google") && !domain.includes("facebook")) {
      return domain.startsWith("www.") ? `https://${domain}` : `https://www.${domain}`;
    }
  }
  
  return "";
}

// Extract WhatsApp numbers (usually mobile numbers)
function extractWhatsApp(phones: string[]): string[] {
  return phones.filter(p => {
    const clean = p.replace(/\D/g, "");
    // Brazilian mobile numbers: start with 9 after DDD (11-99999-9999)
    return clean.length === 11 && clean[2] === "9";
  });
}

// Lookup CNPJ using multiple APIs
async function lookupCNPJ(cnpj: string): Promise<any | null> {
  // Try BrasilAPI
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (response.ok) {
      return await response.json();
    }
  } catch {}

  // Try CNPJ.ws
  try {
    await new Promise(r => setTimeout(r, 300));
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
      headers: { "Accept": "application/json" }
    });
    if (response.ok) {
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
        ddd_telefone_2: data.estabelecimento?.ddd2 && data.estabelecimento?.telefone2 
          ? `${data.estabelecimento.ddd2}${data.estabelecimento.telefone2}` : null,
        email: data.estabelecimento?.email,
        situacao_cadastral: data.estabelecimento?.situacao_cadastral,
        capital_social: data.capital_social,
        data_inicio_atividade: data.estabelecimento?.data_inicio_atividade,
      };
    }
  } catch {}

  // Try ReceitaWS
  try {
    await new Promise(r => setTimeout(r, 300));
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj.replace(/\D/g, "")}`);
    if (response.ok) {
      const data = await response.json();
      if (data.status !== "ERROR") {
        return data;
      }
    }
  } catch {}

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: EnrichRequest = await req.json();
    console.log("Enrich request:", request);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl não configurado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const enrichedData: any = {
      phones: [],
      emails: [],
      website: "",
      instagram: [],
      whatsapp: [],
      linkedin: "",
      address: "",
      cnpjData: null,
    };

    // Step 1: If we have CNPJ, lookup official data
    if (request.cnpj) {
      const cnpjClean = request.cnpj.replace(/\D/g, "");
      console.log("Looking up CNPJ:", cnpjClean);
      
      const cnpjData = await lookupCNPJ(cnpjClean);
      if (cnpjData) {
        enrichedData.cnpjData = cnpjData;
        
        // Add phones from CNPJ data
        if (cnpjData.ddd_telefone_1) {
          enrichedData.phones.push(cnpjData.ddd_telefone_1.replace(/\D/g, ""));
        }
        if (cnpjData.ddd_telefone_2) {
          enrichedData.phones.push(cnpjData.ddd_telefone_2.replace(/\D/g, ""));
        }
        
        // Add email
        if (cnpjData.email) {
          enrichedData.emails.push(cnpjData.email.toLowerCase());
        }
        
        // Build address
        const parts = [
          cnpjData.logradouro,
          cnpjData.numero,
          cnpjData.bairro,
          cnpjData.municipio,
          cnpjData.uf,
          cnpjData.cep
        ].filter(Boolean);
        enrichedData.address = parts.join(", ");
      }
    }

    // Step 2: Search for company online to find social media and contacts
    const searchQueries = [
      `"${request.companyName}" ${request.city || ""} telefone contato`,
      `"${request.companyName}" instagram site`,
      `"${request.companyName}" whatsapp`,
    ];

    const allText: string[] = [];
    const allUrls: string[] = [];

    for (const query of searchQueries.slice(0, 2)) {
      try {
        console.log("Searching:", query);
        
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 10,
            lang: "pt-BR",
            country: "BR",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          for (const result of data.data || []) {
            allText.push(`${result.markdown || ""} ${result.title || ""} ${result.description || ""}`);
            if (result.url) allUrls.push(result.url);
          }
        }
        
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.error("Search error:", e);
      }
    }

    const combinedText = allText.join(" ");
    
    // Extract contact info from search results
    const foundPhones = extractPhones(combinedText);
    const foundEmails = extractEmails(combinedText);
    const foundInstagram = extractInstagram(combinedText);
    const foundWebsite = extractWebsite(combinedText, allUrls);

    // Merge with existing data
    enrichedData.phones = [...new Set([...enrichedData.phones, ...foundPhones])].slice(0, 5);
    enrichedData.emails = [...new Set([...enrichedData.emails, ...foundEmails])].slice(0, 5);
    enrichedData.instagram = foundInstagram.slice(0, 3);
    enrichedData.website = enrichedData.website || foundWebsite;
    enrichedData.whatsapp = extractWhatsApp(enrichedData.phones);

    // Find LinkedIn company page
    const linkedinUrl = allUrls.find(u => u.includes("linkedin.com/company"));
    if (linkedinUrl) {
      enrichedData.linkedin = linkedinUrl;
    }

    console.log("Enriched data:", {
      phones: enrichedData.phones.length,
      emails: enrichedData.emails.length,
      instagram: enrichedData.instagram.length,
      whatsapp: enrichedData.whatsapp.length,
      website: !!enrichedData.website,
      linkedin: !!enrichedData.linkedin,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: enrichedData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Enrich error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
