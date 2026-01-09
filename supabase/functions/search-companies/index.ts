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

// Map company sizes to Casa dos Dados format
function mapCompanySize(size: string): string | null {
  const mapping: Record<string, string> = {
    'MEI': 'MICRO EMPRESA',
    'ME': 'EMPRESA DE PEQUENO PORTE',
    'Micro': 'MICRO EMPRESA',
    'Pequeno': 'EMPRESA DE PEQUENO PORTE',
    'Pequena': 'EMPRESA DE PEQUENO PORTE',
    'Medio': 'DEMAIS',
    'Média Empresa': 'DEMAIS',
    'Grande': 'DEMAIS',
    'EPP': 'EMPRESA DE PEQUENO PORTE',
  };
  return mapping[size] || null;
}

// Map CNAE segments to codes (simplified - common segments)
function getSegmentCNAEs(segment: string): string[] {
  const segmentMap: Record<string, string[]> = {
    'Tecnologia': ['6201-5', '6202-3', '6203-1', '6204-0', '6209-1', '6311-9', '6319-4'],
    'Saúde': ['8610-1', '8630-5', '8650-0', '8660-7'],
    'Alimentação': ['5611-2', '5612-1', '5620-1'],
    'Varejo': ['4711-3', '4712-1', '4713-0', '4721-1', '4722-9', '4723-7', '4724-5'],
    'Educação': ['8511-2', '8512-1', '8513-9', '8520-1', '8531-7', '8532-5', '8533-3'],
    'Construção': ['4120-4', '4110-7', '4211-1', '4212-0', '4213-8'],
    'Transporte': ['4921-3', '4922-1', '4923-0', '4924-8', '4929-9'],
    'Beleza': ['9602-5', '4772-5'],
    'Serviços': ['6920-6', '6911-7', '7020-4', '7111-1', '7112-0'],
    'Indústria': ['1011-2', '1012-0', '1013-9', '2211-1', '2219-7'],
    'Agronegócio': ['0111-3', '0112-1', '0113-0', '0114-8', '0115-6'],
    'Financeiro': ['6421-2', '6422-1', '6423-9', '6424-7'],
    'Imobiliário': ['6810-2', '6821-8', '6822-6'],
    'Marketing': ['7311-4', '7312-2', '7319-0', '7320-3'],
    'Contabilidade': ['6920-6'],
    'Advocacia': ['6911-7'],
    'Consultoria': ['7020-4'],
  };
  return segmentMap[segment] || [];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const filters: SearchFilters = await req.json();
    console.log("Search filters:", filters);

    // Build Casa dos Dados query
    const query: any = {
      termo: [],
      atividade_principal: [],
      natureza_juridica: [],
      uf: filters.states || [],
      municipio: (filters.cities || []).map(c => c.toUpperCase()),
      situacao_cadastral: "ATIVA", // Only active companies
      cep: [],
      ddd: [],
    };

    // Add CNAE filters
    if (filters.cnae) {
      query.atividade_principal.push(filters.cnae);
    } else if (filters.segments?.length) {
      for (const segment of filters.segments) {
        const cnaes = getSegmentCNAEs(segment);
        query.atividade_principal.push(...cnaes);
      }
    }

    const extras: any = {
      somente_mei: false,
      excluir_mei: false,
      com_email: filters.hasEmail || false,
      incluir_atividade_secundaria: false,
      com_contato_telefonico: filters.hasPhone || false,
      somente_fixo: false,
      somente_celular: false,
      somente_matriz: false,
      somente_filial: false,
    };

    // Handle company size
    if (filters.companySizes?.length) {
      if (filters.companySizes.includes('MEI') || filters.companySizes.includes('Micro')) {
        extras.somente_mei = true;
      }
      if (filters.companySizes.includes('Grande') || filters.companySizes.includes('Medio')) {
        extras.excluir_mei = true;
      }
    }

    const payload = {
      query,
      range_query: {
        data_abertura: { lte: null, gte: null },
        capital_social: { lte: null, gte: null },
      },
      extras,
      page: filters.page || 1,
    };

    console.log("Casa dos Dados payload:", JSON.stringify(payload, null, 2));

    // Call Casa dos Dados API
    const response = await fetch("https://api.casadosdados.com.br/v2/public/cnpj/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Casa dos Dados error:", response.status, errorText);
      
      // If Casa dos Dados fails, return empty results (graceful degradation)
      return new Response(
        JSON.stringify({
          companies: [],
          total: 0,
          page: 1,
          pageSize: filters.pageSize || 10,
          source: "casadosdados",
          error: `API indisponível (${response.status})`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("Casa dos Dados response:", JSON.stringify(data, null, 2).slice(0, 500));

    // Transform results to our format
    const companies = (data.data?.cnpj || []).map((company: any) => ({
      id: company.cnpj,
      cnpj: company.cnpj,
      name: company.nome_fantasia || company.razao_social,
      razao_social: company.razao_social,
      segment: company.cnae?.descricao || "",
      cnae_code: company.cnae?.codigo || "",
      cnae_description: company.cnae?.descricao || "",
      company_size: company.porte?.descricao || "",
      city: company.municipio,
      state: company.uf,
      neighborhood: company.bairro,
      zip_code: company.cep,
      address: company.logradouro,
      number: company.numero,
      complement: company.complemento,
      has_phone: !!company.ddd_telefone_1,
      has_email: !!company.email,
      has_website: false,
      phones: [company.ddd_telefone_1, company.ddd_telefone_2].filter(Boolean),
      emails: company.email ? [company.email.toLowerCase()] : [],
      situacao: company.situacao_cadastral || "ATIVA",
      capital_social: company.capital_social,
      data_abertura: company.data_inicio_atividade,
    }));

    // Apply pageSize limit
    const pageSize = filters.pageSize || 10;
    const limitedCompanies = companies.slice(0, pageSize);

    return new Response(
      JSON.stringify({
        companies: limitedCompanies,
        total: data.data?.count || companies.length,
        page: filters.page || 1,
        pageSize,
        source: "casadosdados",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Search companies error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno",
        companies: [],
        total: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
