import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnrichedData {
  phones: string[];
  emails: string[];
  website: string;
  instagram: string[];
  whatsapp: string[];
  linkedin: string;
  address: string;
  cnpjData: any;
}

export interface EnrichCompanyRequest {
  cnpj?: string;
  companyName: string;
  city?: string;
  state?: string;
}

export function useEnrichCompany() {
  return useMutation({
    mutationFn: async (request: EnrichCompanyRequest): Promise<EnrichedData> => {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: EnrichedData;
        error?: string;
      }>("enrich-company", {
        body: request,
      });

      if (error) {
        console.error("Enrich error:", error);
        throw new Error(error.message || "Erro ao enriquecer dados");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Erro ao enriquecer dados");
      }

      return data.data!;
    },
  });
}
