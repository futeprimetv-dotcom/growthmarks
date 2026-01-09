import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { mockProspects, type MockProspect } from "@/data/mockProspects";

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
      // For now, use mock data - later integrate with Supabase
      let filteredProspects = [...mockProspects];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProspects = filteredProspects.filter(
          p => p.name.toLowerCase().includes(searchLower) ||
               p.cnpj?.includes(filters.search || '')
        );
      }

      if (filters.segments && filters.segments.length > 0) {
        filteredProspects = filteredProspects.filter(
          p => filters.segments!.includes(p.segment)
        );
      }

      if (filters.states && filters.states.length > 0) {
        filteredProspects = filteredProspects.filter(
          p => filters.states!.includes(p.state)
        );
      }

      if (filters.cities && filters.cities.length > 0) {
        filteredProspects = filteredProspects.filter(
          p => filters.cities!.includes(p.city)
        );
      }

      if (filters.companySizes && filters.companySizes.length > 0) {
        filteredProspects = filteredProspects.filter(
          p => filters.companySizes!.includes(p.company_size)
        );
      }

      if (filters.hasWebsite !== undefined) {
        filteredProspects = filteredProspects.filter(
          p => p.has_website === filters.hasWebsite
        );
      }

      if (filters.hasPhone !== undefined) {
        filteredProspects = filteredProspects.filter(
          p => p.has_phone === filters.hasPhone
        );
      }

      if (filters.hasEmail !== undefined) {
        filteredProspects = filteredProspects.filter(
          p => p.has_email === filters.hasEmail
        );
      }

      if (filters.status && filters.status.length > 0) {
        filteredProspects = filteredProspects.filter(
          p => filters.status!.includes(p.status)
        );
      }

      return filteredProspects;
    },
    enabled
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
    mutationFn: async ({ prospectIds, funnelId }: { prospectIds: string[]; funnelId: string }) => {
      // This will create leads from prospects
      const prospects = mockProspects.filter(p => prospectIds.includes(p.id));
      
      for (const prospect of prospects) {
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

      return { count: prospects.length };
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
      for (const prospect of prospects) {
        const { error } = await supabase.from("leads").insert({
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
          tags: prospect.tags
        });

        if (error) throw error;
      }

      return { count: prospects.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Leads criados",
        description: `${data.count} lead(s) foram adicionados à base.`
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
