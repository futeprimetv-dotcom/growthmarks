import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLead, useUpdateLead, Lead } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Constants } from "@/integrations/supabase/types";

const leadStatusValues = Constants.public.Enums.lead_status;
const leadTemperatureValues = Constants.public.Enums.lead_temperature;

const leadSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  company: z.string().max(100).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  service_interest: z.string().max(200).optional(),
  estimated_value: z.coerce.number().min(0).optional(),
  status: z.enum(leadStatusValues as unknown as [string, ...string[]]).default("novo"),
  temperature: z.enum(leadTemperatureValues as unknown as [string, ...string[]]).default("cold"),
  origin: z.string().optional(),
  responsible_id: z.string().uuid().optional().nullable(),
  next_action: z.string().max(200).optional(),
  next_action_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

const statusLabels: Record<string, string> = {
  novo: "Novo",
  contato_inicial: "Contato Inicial",
  reuniao_agendada: "Reunião Agendada",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  fechado_ganho: "Fechado (Ganho)",
  fechado_perdido: "Fechado (Perdido)",
};

const temperatureLabels: Record<string, string> = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

const originOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "indicacao", label: "Indicação" },
  { value: "google", label: "Google" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "site", label: "Site" },
  { value: "outro", label: "Outro" },
];

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const { data: teamMembers } = useTeamMembers();
  
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      service_interest: "",
      estimated_value: 0,
      status: "novo",
      temperature: "cold",
      origin: "",
      responsible_id: null,
      next_action: "",
      next_action_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        name: lead.name,
        company: lead.company || "",
        email: lead.email || "",
        phone: lead.phone || "",
        service_interest: lead.service_interest || "",
        estimated_value: lead.estimated_value || 0,
        status: lead.status,
        temperature: lead.temperature,
        origin: lead.origin || "",
        responsible_id: lead.responsible_id || null,
        next_action: lead.next_action || "",
        next_action_date: lead.next_action_date || "",
        notes: lead.notes || "",
      });
    } else {
      form.reset({
        name: "",
        company: "",
        email: "",
        phone: "",
        service_interest: "",
        estimated_value: 0,
        status: "novo",
        temperature: "cold",
        origin: "",
        responsible_id: null,
        next_action: "",
        next_action_date: "",
        notes: "",
      });
    }
  }, [lead, form]);

  const onSubmit = async (values: LeadFormValues) => {
    const payload = {
      name: values.name,
      company: values.company || null,
      email: values.email || null,
      phone: values.phone || null,
      service_interest: values.service_interest || null,
      estimated_value: values.estimated_value || 0,
      status: values.status as Lead["status"],
      temperature: values.temperature as Lead["temperature"],
      origin: values.origin || null,
      responsible_id: values.responsible_id || null,
      next_action: values.next_action || null,
      next_action_date: values.next_action_date || null,
      notes: values.notes || null,
    };

    if (lead?.id) {
      await updateLead.mutateAsync({ id: lead.id, ...payload });
    } else {
      await createLead.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isLoading = createLead.isPending || updateLead.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do lead" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_interest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interesse</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Social Media + Tráfego" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatusValues.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status] || status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadTemperatureValues.map((temp) => (
                          <SelectItem key={temp} value={temp}>
                            {temperatureLabels[temp] || temp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {originOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsible_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Ação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Follow-up da proposta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_action_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Próxima Ação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas sobre o lead..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : lead ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
