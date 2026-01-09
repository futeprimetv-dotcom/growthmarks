import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProspectFilters } from "./useProspects";

export interface CompanySearchResult {
  id: string;
  cnpj: string;
  name: string;
  razao_social: string;
  segment: string;
  cnae_code: string;
  cnae_description: string;
  company_size: string;
  city: string;
  state: string;
  neighborhood: string;
  zip_code: string;
  address: string;
  number: string;
  complement: string;
  has_phone: boolean;
  has_email: boolean;
  has_website: boolean;
  website_url?: string;
  phones: string[];
  emails: string[];
  situacao: string;
  capital_social: number | null;
  data_abertura: string | null;
  enriched?: boolean;
}

export interface CompanySearchResponse {
  companies: CompanySearchResult[];
  total: number;
  page: number;
  pageSize: number;
  source: string;
  error?: string;
}

export function useCompanySearch() {
  const abortControllerRef = { current: null as AbortController | null };

  const mutation = useMutation({
    mutationFn: async (params: {
      filters: ProspectFilters;
      page?: number;
      pageSize?: number;
    }): Promise<CompanySearchResponse> => {
      const { filters, page = 1, pageSize = 10 } = params;

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const { data, error } = await supabase.functions.invoke<CompanySearchResponse>(
        "search-companies",
        {
          body: {
            states: filters.states,
            cities: filters.cities,
            segments: filters.segments,
            cnae: filters.cnae,
            companySizes: filters.companySizes,
            hasEmail: filters.hasEmail,
            hasPhone: filters.hasPhone,
            hasWebsite: filters.hasWebsite,
            page,
            pageSize,
          },
        }
      );

      if (error) {
        console.error("Company search error:", error);
        throw new Error(error.message || "Erro ao buscar empresas");
      }

      return data || { companies: [], total: 0, page: 1, pageSize, source: "unknown" };
    },
  });

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    mutation.reset();
  };

  return {
    ...mutation,
    cancel,
  };
}
