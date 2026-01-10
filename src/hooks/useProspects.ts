import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { MockProspect } from "@/data/mockProspects";
import type { CNPJLookupResult } from "@/hooks/useCNPJLookup";
import type { CompanySearchResult } from "@/hooks/useCompanySearch";
export interface Prospect {
  id: string;
  name: string;
  cnpj: string | null;
  segment: string | null;
  cnae_code: string | null;
  cnae_description: string | null;
  company_size: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  zip_code: string | null;
  has_website: boolean;
  website_url: string | null;
  has_phone: boolean;
  has_email: boolean;
  emails: string[];
  phones: string[];
  emails_count: number;
  phones_count: number;
  data_revealed: boolean;
  revealed_at: string | null;
  social_links: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  } | null;
  status: string;
  tags: string[];
  source: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProspectFilters {
  search?: string;
  segments?: string[];
  cnae?: string;
  states?: string[];
  cities?: string[];
  companySizes?: string[];
  hasWebsite?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  status?: string[];
}

export function useProspects(filters: ProspectFilters = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: ["prospects", filters],
    queryFn: async () => {
      // Fetch from database (not mock) so filters reflect real imported/consulted companies
      let query = supabase
        .from("prospects")
        .select(
          "id,name,cnpj,segment,cnae_code,cnae_description,company_size,city,state,neighborhood,zip_code,has_website,website_url,has_phone,has_email,emails,phones,emails_count,phones_count,data_revealed,social_links,status,tags,source,is_archived,created_at,updated_at,cnpj_situacao"
        )
        .eq("is_archived", false)
        .eq("cnpj_situacao", "ATIVA");

      if (filters.search) {
        const search = filters.search.trim();
        if (search) {
          // search by name or cnpj
          query = query.or(`name.ilike.%${search}%,cnpj.ilike.%${search}%`);
        }
      }

      if (filters.segments?.length) {
        query = query.in("segment", filters.segments);
      }

      if (filters.states?.length) {
        query = query.in("state", filters.states);
      }

      if (filters.cities?.length) {
        query = query.in("city", filters.cities);
      }

      if (filters.companySizes?.length) {
        query = query.in("company_size", filters.companySizes);
      }

      if (filters.hasWebsite !== undefined) {
        query = query.eq("has_website", filters.hasWebsite);
      }

      if (filters.hasPhone !== undefined) {
        query = query.eq("has_phone", filters.hasPhone);
      }

      if (filters.hasEmail !== undefined) {
        query = query.eq("has_email", filters.hasEmail);
      }

      if (filters.status?.length) {
        query = query.in("status", filters.status);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;

      // Map DB rows to the same shape used in the UI (MockProspect)
      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        cnpj: p.cnpj || "",
        segment: p.segment || "",
        cnae_code: p.cnae_code || "",
        cnae_description: p.cnae_description || "",
        company_size: p.company_size || "",
        city: p.city || "",
        state: p.state || "",
        neighborhood: p.neighborhood || undefined,
        zip_code: p.zip_code || undefined,
        has_website: !!p.has_website,
        website_url: p.website_url || undefined,
        has_phone: !!p.has_phone,
        has_email: !!p.has_email,
        emails_count: p.emails_count || 0,
        phones_count: p.phones_count || 0,
        data_revealed: !!p.data_revealed,
        emails: (p.emails || []) as string[],
        phones: (p.phones || []) as string[],
        social_links: (p.social_links || undefined) as any,
        status: (p.status || "novo") as any,
        tags: (p.tags || []) as string[],
        source: p.source || "",
      })) as MockProspect[];
    },
    enabled,
  });
}

export function useUpdateProspectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // For now, just simulate - later integrate with Supabase
      await new Promise(resolve => setTimeout(resolve, 300));
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast({
        title: "Status atualizado",
        description: "O status do prospecto foi atualizado."
      });
    }
  });
}

export function useSendProspectsToFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ prospectIds, funnelId, prospects }: { prospectIds: string[]; funnelId: string; prospects: MockProspect[] }) => {
      // Filter the prospects that match the selected IDs
      const selectedProspects = prospects.filter(p => prospectIds.includes(p.id));
      
      for (const prospect of selectedProspects) {
        const { error } = await supabase.from("leads").insert({
          name: prospect.name,
          company: prospect.name,
          email: prospect.emails?.[0] || null,
          phone: prospect.phones?.[0] || null,
          whatsapp: prospect.phones?.[0] || null,
          city: prospect.city,
          state: prospect.state,
          segment: prospect.segment,
          funnel_id: funnelId,
          status: "novo",
          temperature: "cold",
          origin: "prospeccao",
          tags: prospect.tags
        });

        if (error) throw error;
      }

      return { count: selectedProspects.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      toast({
        title: "Prospectos enviados",
        description: `${data.count} prospecto(s) foram adicionados ao funil.`
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar os prospectos para o funil.",
        variant: "destructive"
      });
    }
  });
}

export function useSendToLeadsBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospects: MockProspect[]) => {
      const results = [];
      for (const prospect of prospects) {
        const { data, error } = await supabase.from("leads").insert({
          name: prospect.name,
          company: prospect.name,
          email: prospect.emails?.[0] || null,
          phone: prospect.phones?.[0] || null,
          whatsapp: prospect.phones?.[0] || null,
          city: prospect.city,
          state: prospect.state,
          segment: prospect.segment,
          status: "novo",
          temperature: "cold",
          origin: "prospeccao",
          tags: prospect.tags,
          is_archived: false
        }).select();

        if (error) throw error;
        if (data) results.push(...data);
      }

      return { count: results.length };
    },
    onSuccess: (data) => {
      // Force immediate refetch of leads
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.refetchQueries({ queryKey: ["leads"] });
      toast({
        title: "Leads criados",
        description: `${data.count} lead(s) foram adicionados à base. Acesse a página de Leads para visualizá-los.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar os leads.",
        variant: "destructive"
      });
    }
  });
}

// New hook to add prospect from CNPJ lookup
export function useAddProspectFromCNPJ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cnpjData: CNPJLookupResult): Promise<MockProspect> => {
      // Regra do sistema: SOMENTE CNPJs ATIVOS
      if ((cnpjData.situacaoCadastral || "").toUpperCase() !== "ATIVA") {
        throw new Error(`CNPJ não está ativo (situação: ${cnpjData.situacaoCadastral || "N/D"}).`);
      }

      // Map porte to company_size
      const getCompanySize = (porte: string): string => {
        if (porte.includes("MICRO")) return "MEI";
        if (porte.includes("PEQUENO")) return "ME";
        if (porte.includes("MEDIO") || porte.includes("DEMAIS")) return "EPP";
        return "ME";
      };

      const phones = [cnpjData.telefone1, cnpjData.telefone2].filter(Boolean) as string[];
      const emails = cnpjData.email ? [cnpjData.email.toLowerCase()] : [];

      const prospect: MockProspect = {
        id: cnpjData.cnpj,
        name: cnpjData.nomeFantasia || cnpjData.razaoSocial,
        cnpj: cnpjData.cnpj,
        segment: cnpjData.cnaeFiscalDescricao,
        cnae_code: cnpjData.cnaeFiscal.toString(),
        cnae_description: cnpjData.cnaeFiscalDescricao,
        company_size: getCompanySize(cnpjData.porte),
        city: cnpjData.cidade,
        state: cnpjData.uf,
        neighborhood: cnpjData.bairro,
        has_website: false,
        website_url: undefined,
        has_phone: phones.length > 0,
        has_email: emails.length > 0,
        emails_count: emails.length,
        phones_count: phones.length,
        data_revealed: true,
        emails,
        phones,
        social_links: undefined,
        status: "novo",
        tags: ["cnpj-api"],
        source: "brasilapi",
      };

      // Save to database prospects table
      const { error } = await supabase.from("prospects").insert({
        id: prospect.id,
        name: prospect.name,
        cnpj: prospect.cnpj,
        segment: prospect.segment,
        cnae_code: cnpjData.cnaeFiscal.toString(),
        cnae_description: cnpjData.cnaeFiscalDescricao,
        company_size: prospect.company_size,
        city: prospect.city,
        state: prospect.state,
        neighborhood: prospect.neighborhood,
        zip_code: cnpjData.cep,
        has_website: prospect.has_website,
        website_url: prospect.website_url,
        has_phone: prospect.has_phone,
        has_email: prospect.has_email,
        emails: prospect.emails,
        phones: prospect.phones,
        emails_count: prospect.emails.length,
        phones_count: prospect.phones.length,
        status: "novo",
        tags: prospect.tags,
        source: "brasilapi",
        data_revealed: true,
        revealed_at: new Date().toISOString(),
        cnpj_situacao: "ATIVA",
      });

      if (error) {
        // If duplicate, just return the prospect without error
        if (error.code === "23505") {
          return prospect;
        }
        throw error;
      }

      return prospect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
    onError: (error) => {
      console.error("Error adding prospect:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível adicionar o prospecto.",
        variant: "destructive",
      });
    },
  });
}

// Hook to send CNPJ data directly to funnel
export function useSendCNPJToFunnel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cnpjData, funnelId }: { cnpjData: CNPJLookupResult; funnelId: string }) => {
      const phones = [cnpjData.telefone1, cnpjData.telefone2].filter(Boolean) as string[];
      
      const { error } = await supabase.from("leads").insert({
        name: cnpjData.nomeFantasia || cnpjData.razaoSocial,
        company: cnpjData.razaoSocial,
        email: cnpjData.email?.toLowerCase() || null,
        phone: phones[0] || null,
        whatsapp: phones[0] || null,
        city: cnpjData.cidade,
        state: cnpjData.uf,
        segment: cnpjData.cnaeFiscalDescricao,
        funnel_id: funnelId,
        status: "novo",
        temperature: "cold",
        origin: "prospeccao",
        tags: ["cnpj-api"]
      });

      if (error) throw error;

      return { name: cnpjData.nomeFantasia || cnpjData.razaoSocial };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Lead criado",
        description: `${data.name} foi adicionado ao funil.`
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar para o funil.",
        variant: "destructive"
      });
    }
  });
}

// Hook to add prospects from internet search (without situacaoCadastral validation)
export function useAddProspectsFromInternet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companies: CompanySearchResult[]): Promise<{ added: number; duplicates: number; errors: number }> => {
      let added = 0;
      let duplicates = 0;
      let errors = 0;

      for (const company of companies) {
        // Map company data to prospect format
        const prospectData = {
          name: company.name,
          cnpj: company.cnpj || null,
          segment: company.segment || null,
          cnae_code: company.cnae_code || null,
          cnae_description: company.cnae_description || null,
          company_size: company.company_size || null,
          city: company.city || null,
          state: company.state || null,
          neighborhood: company.neighborhood || null,
          zip_code: company.zip_code || null,
          has_website: company.has_website || false,
          website_url: null,
          has_phone: (company.phones?.length || 0) > 0,
          has_email: (company.emails?.length || 0) > 0,
          emails: company.emails || [],
          phones: company.phones || [],
          emails_count: company.emails?.length || 0,
          phones_count: company.phones?.length || 0,
          status: "novo",
          tags: ["api-search"],
          source: "casadosdados",
          data_revealed: true,
          revealed_at: new Date().toISOString(),
          cnpj_situacao: (company.situacao || "ATIVA").toUpperCase(),
        };

        // Check if CNPJ already exists (if company has CNPJ)
        if (company.cnpj) {
          const { data: existing } = await supabase
            .from("prospects")
            .select("id")
            .eq("cnpj", company.cnpj)
            .maybeSingle();

          if (existing) {
            duplicates++;
            continue;
          }
        }

        const { error } = await supabase.from("prospects").insert(prospectData);

        if (error) {
          if (error.code === "23505") {
            duplicates++;
          } else {
            console.error("Error adding prospect:", error);
            errors++;
          }
        } else {
          added++;
        }
      }

      return { added, duplicates, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      
      const messages: string[] = [];
      if (result.added > 0) messages.push(`${result.added} adicionada(s)`);
      if (result.duplicates > 0) messages.push(`${result.duplicates} já existente(s)`);
      if (result.errors > 0) messages.push(`${result.errors} com erro`);
      
      if (result.added > 0) {
        toast({
          title: "Empresas salvas na Minha Base",
          description: messages.join(", ") + ". Vá para a aba 'Minha Base' para visualizar.",
        });
      } else if (result.duplicates > 0 && result.errors === 0) {
        toast({
          title: "Empresas já existem",
          description: `${result.duplicates} empresa(s) já estão na sua base.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível adicionar as empresas à base.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Error adding prospects:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar as empresas à base.",
        variant: "destructive",
      });
    },
  });
}
