import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cleanCNPJ, validateCNPJ } from "@/lib/cnpjUtils";

export interface BrasilAPICNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  uf: string;
  municipio: string;
  bairro: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  porte: string;
  natureza_juridica: string;
  capital_social: number;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  data_inicio_atividade: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string | null;
  email: string | null;
  descricao_tipo_de_logradouro: string;
  cnaes_secundarios: Array<{
    codigo: number;
    descricao: string;
  }>;
  qsa: Array<{
    nome_socio: string;
    qualificacao_socio: string;
    pais: string | null;
    faixa_etaria: string;
  }>;
}

export interface CNPJLookupResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  uf: string;
  cidade: string;
  bairro: string;
  cep: string;
  endereco: string;
  cnaeFiscal: number;
  cnaeFiscalDescricao: string;
  porte: string;
  naturezaJuridica: string;
  capitalSocial: number;
  situacaoCadastral: string;
  dataSituacaoCadastral: string;
  dataInicioAtividade: string;
  telefone1: string | null;
  telefone2: string | null;
  email: string | null;
  socios: Array<{
    nome: string;
    qualificacao: string;
  }>;
}

async function fetchCNPJ(cnpj: string): Promise<CNPJLookupResult> {
  const cleaned = cleanCNPJ(cnpj);
  
  if (!validateCNPJ(cleaned)) {
    throw new Error("CNPJ inválido");
  }
  
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("CNPJ não encontrado na base da Receita Federal");
    }
    if (response.status === 429) {
      throw new Error("Limite de consultas excedido. Tente novamente em alguns minutos.");
    }
    throw new Error("Erro ao consultar CNPJ. Tente novamente.");
  }
  
  const data: BrasilAPICNPJ = await response.json();
  
  // Format address
  const endereco = [
    data.descricao_tipo_de_logradouro,
    data.logradouro,
    data.numero,
    data.complemento
  ].filter(Boolean).join(" ");
  
  // Format phone
  const formatPhone = (dddPhone: string | null) => {
    if (!dddPhone) return null;
    const cleaned = dddPhone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return dddPhone;
  };
  
  return {
    cnpj: data.cnpj,
    razaoSocial: data.razao_social,
    nomeFantasia: data.nome_fantasia,
    uf: data.uf,
    cidade: data.municipio,
    bairro: data.bairro,
    cep: data.cep,
    endereco,
    cnaeFiscal: data.cnae_fiscal,
    cnaeFiscalDescricao: data.cnae_fiscal_descricao,
    porte: data.porte,
    naturezaJuridica: data.natureza_juridica,
    capitalSocial: data.capital_social,
    situacaoCadastral: data.situacao_cadastral,
    dataSituacaoCadastral: data.data_situacao_cadastral,
    dataInicioAtividade: data.data_inicio_atividade,
    telefone1: formatPhone(data.ddd_telefone_1),
    telefone2: formatPhone(data.ddd_telefone_2),
    email: data.email,
    socios: data.qsa?.map(s => ({
      nome: s.nome_socio,
      qualificacao: s.qualificacao_socio
    })) || []
  };
}

export function useCNPJLookup(cnpj: string | null) {
  return useQuery({
    queryKey: ["cnpj-lookup", cnpj],
    queryFn: () => fetchCNPJ(cnpj!),
    enabled: !!cnpj && cleanCNPJ(cnpj).length === 14,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: false
  });
}

export function useCNPJLookupManual() {
  const queryClient = useQueryClient();
  
  const lookup = async (cnpj: string) => {
    const cleaned = cleanCNPJ(cnpj);
    
    // Check cache first
    const cached = queryClient.getQueryData<CNPJLookupResult>(["cnpj-lookup", cleaned]);
    if (cached) return cached;
    
    const result = await fetchCNPJ(cleaned);
    queryClient.setQueryData(["cnpj-lookup", cleaned], result);
    return result;
  };
  
  return { lookup };
}
