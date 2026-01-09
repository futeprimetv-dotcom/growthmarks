import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCreateLead, useUpdateLead, Lead } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useLeadScore } from "@/hooks/useLeadScore";
import { useSalesFunnels } from "@/hooks/useSalesFunnels";
import { Constants } from "@/integrations/supabase/types";
import { User, Building2, DollarSign, Target, MessageSquare, Zap, X, Plus, Loader2 } from "lucide-react";

const leadStatusValues = Constants.public.Enums.lead_status;
const leadTemperatureValues = Constants.public.Enums.lead_temperature;

const leadSchema = z.object({
  // Dados Básicos
  name: z.string().min(1, "Nome é obrigatório").max(100),
  funnel_id: z.string().min(1, "Funil é obrigatório"),
  company: z.string().max(100).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  instagram: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  origin: z.string().optional(),
  responsible_id: z.string().uuid().optional().nullable(),
  
  // Dados Comerciais
  status: z.enum(leadStatusValues as unknown as [string, ...string[]]).default("novo"),
  temperature: z.enum(leadTemperatureValues as unknown as [string, ...string[]]).default("cold"),
  estimated_value: z.coerce.number().min(0).optional(),
  service_interest: z.string().max(200).optional(),
  contract_type: z.string().optional(),
  ticket_level: z.string().optional(),
  closing_probability: z.coerce.number().min(0).max(100).optional(),
  expected_close_date: z.string().optional(),
  
  // Qualificação
  invests_in_marketing: z.boolean().optional(),
  current_investment: z.coerce.number().min(0).optional(),
  main_pain: z.string().max(500).optional(),
  urgency: z.string().optional(),
  awareness_level: z.string().optional(),
  authority: z.string().optional(),
  
  // Comunicação
  contact_channel: z.string().optional(),
  next_action: z.string().max(200).optional(),
  next_action_date: z.string().optional(),
  notes: z.string().max(2000).optional(),
  
  // Dados Estratégicos
  segment: z.string().max(100).optional(),
  digital_maturity: z.string().optional(),
  ltv_potential: z.string().optional(),
  is_recurring_client: z.boolean().optional(),
  cross_sell_possible: z.boolean().optional(),
  referred_by: z.string().max(100).optional(),
  
  // Automação
  tags: z.array(z.string()).optional(),
  utm_source: z.string().max(200).optional(),
  loss_reason: z.string().max(500).optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

const statusLabels: Record<string, string> = {
  novo: "Novo",
  lead_frio: "Lead Frio",
  em_contato: "Em Contato",
  em_qualificacao: "Em Qualificação",
  contato_inicial: "Contato Inicial",
  reuniao_agendada: "Reunião Agendada",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  fechamento: "Fechamento",
  perdido: "Perdido",
};

const temperatureLabels: Record<string, string> = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

const originOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "site", label: "Site" },
  { value: "indicacao", label: "Indicação" },
  { value: "trafego_pago", label: "Tráfego Pago" },
  { value: "prospeccao", label: "Prospecção Ativa" },
  { value: "outro", label: "Outro" },
];

const urgencyOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const awarenessOptions = [
  { value: "nao_sabe", label: "Não sabe que tem problema" },
  { value: "sabe_problema", label: "Sabe que tem problema" },
  { value: "conhece_solucao", label: "Conhece soluções" },
  { value: "conhece_produto", label: "Conhece nosso produto" },
  { value: "pronto_comprar", label: "Pronto para comprar" },
];

const authorityOptions = [
  { value: "decisor", label: "Decisor" },
  { value: "influenciador", label: "Influenciador" },
  { value: "operacional", label: "Operacional" },
];

const contactChannelOptions = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "instagram", label: "Instagram DM" },
  { value: "presencial", label: "Presencial" },
];

const ticketOptions = [
  { value: "baixo", label: "Baixo (até R$ 1.000)" },
  { value: "medio", label: "Médio (R$ 1.000 - R$ 5.000)" },
  { value: "alto", label: "Alto (acima de R$ 5.000)" },
];

const maturityOptions = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const ltvOptions = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Médio" },
  { value: "alto", label: "Alto" },
];

const lossReasonOptions = [
  { value: "preco", label: "Preço" },
  { value: "sem_prioridade", label: "Sem prioridade" },
  { value: "nao_respondeu", label: "Não respondeu" },
  { value: "concorrente", label: "Fechou com concorrente" },
  { value: "outro", label: "Outro" },
];

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const { data: teamMembers } = useTeamMembers();
  const { data: crmSettings } = useCRMSettings();
  const { data: funnels = [] } = useSalesFunnels();
  const { calculateScore } = useLeadScore();
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("basico");
  
  // Get default funnel
  const defaultFunnel = funnels.find(f => f.is_default) || funnels[0];
  
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      funnel_id: "",
      company: "",
      email: "",
      phone: "",
      whatsapp: "",
      instagram: "",
      city: "",
      state: "",
      origin: "",
      responsible_id: null,
      status: "novo",
      temperature: "cold",
      estimated_value: 0,
      service_interest: "",
      contract_type: "mensal",
      ticket_level: "medio",
      closing_probability: 0,
      expected_close_date: "",
      invests_in_marketing: false,
      current_investment: 0,
      main_pain: "",
      urgency: "media",
      awareness_level: "nao_sabe",
      authority: "decisor",
      contact_channel: "whatsapp",
      next_action: "",
      next_action_date: "",
      notes: "",
      segment: "",
      digital_maturity: "iniciante",
      ltv_potential: "medio",
      is_recurring_client: false,
      cross_sell_possible: false,
      referred_by: "",
      tags: [],
      utm_source: "",
      loss_reason: "",
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        name: lead.name,
        funnel_id: (lead as any).funnel_id || defaultFunnel?.id || "",
        company: lead.company || "",
        email: lead.email || "",
        phone: lead.phone || "",
        whatsapp: lead.whatsapp || "",
        instagram: lead.instagram || "",
        city: lead.city || "",
        state: lead.state || "",
        origin: lead.origin || "",
        responsible_id: lead.responsible_id || null,
        status: lead.status,
        temperature: lead.temperature,
        estimated_value: lead.estimated_value || 0,
        service_interest: lead.service_interest || "",
        contract_type: lead.contract_type || "mensal",
        ticket_level: lead.ticket_level || "medio",
        closing_probability: lead.closing_probability || 0,
        expected_close_date: lead.expected_close_date || "",
        invests_in_marketing: lead.invests_in_marketing || false,
        current_investment: lead.current_investment || 0,
        main_pain: lead.main_pain || "",
        urgency: lead.urgency || "media",
        awareness_level: lead.awareness_level || "nao_sabe",
        authority: lead.authority || "decisor",
        contact_channel: lead.contact_channel || "whatsapp",
        next_action: lead.next_action || "",
        next_action_date: lead.next_action_date || "",
        notes: lead.notes || "",
        segment: lead.segment || "",
        digital_maturity: lead.digital_maturity || "iniciante",
        ltv_potential: lead.ltv_potential || "medio",
        is_recurring_client: lead.is_recurring_client || false,
        cross_sell_possible: lead.cross_sell_possible || false,
        referred_by: lead.referred_by || "",
        tags: lead.tags || [],
        utm_source: lead.utm_source || "",
        loss_reason: lead.loss_reason || "",
      });
    } else {
      form.reset({
        name: "",
        funnel_id: defaultFunnel?.id || "",
        company: "",
        email: "",
        phone: "",
        whatsapp: "",
        instagram: "",
        city: "",
        state: "",
        origin: "",
        responsible_id: null,
        status: "novo",
        temperature: "cold",
        estimated_value: 0,
        service_interest: "",
        contract_type: "mensal",
        ticket_level: "medio",
        closing_probability: 0,
        expected_close_date: "",
        invests_in_marketing: false,
        current_investment: 0,
        main_pain: "",
        urgency: "media",
        awareness_level: "nao_sabe",
        authority: "decisor",
        contact_channel: "whatsapp",
        next_action: "",
        next_action_date: "",
        notes: "",
        segment: "",
        digital_maturity: "iniciante",
        ltv_potential: "medio",
        is_recurring_client: false,
        cross_sell_possible: false,
        referred_by: "",
        tags: [],
        utm_source: "",
        loss_reason: "",
      });
    }
    setActiveTab("basico");
  }, [lead, form, open, defaultFunnel]);

  const onSubmit = async (values: LeadFormValues) => {
    // Calculate lead score automatically
    const leadScore = calculateScore({
      temperature: values.temperature as Lead["temperature"],
      estimated_value: values.estimated_value || 0,
      urgency: values.urgency,
      closing_probability: values.closing_probability || 0,
      invests_in_marketing: values.invests_in_marketing || false,
    });

    const payload = {
      name: values.name,
      company: values.company || null,
      email: values.email || null,
      phone: values.phone || null,
      whatsapp: values.whatsapp || null,
      instagram: values.instagram || null,
      city: values.city || null,
      state: values.state || null,
      origin: values.origin || null,
      responsible_id: values.responsible_id || null,
      status: values.status as Lead["status"],
      temperature: values.temperature as Lead["temperature"],
      estimated_value: values.estimated_value || 0,
      service_interest: values.service_interest || null,
      contract_type: values.contract_type || null,
      ticket_level: values.ticket_level || null,
      closing_probability: values.closing_probability || 0,
      expected_close_date: values.expected_close_date || null,
      invests_in_marketing: values.invests_in_marketing || false,
      current_investment: values.current_investment || 0,
      main_pain: values.main_pain || null,
      urgency: values.urgency || null,
      awareness_level: values.awareness_level || null,
      authority: values.authority || null,
      contact_channel: values.contact_channel || null,
      next_action: values.next_action || null,
      next_action_date: values.next_action_date || null,
      notes: values.notes || null,
      segment: values.segment || null,
      digital_maturity: values.digital_maturity || null,
      ltv_potential: values.ltv_potential || null,
      is_recurring_client: values.is_recurring_client || false,
      cross_sell_possible: values.cross_sell_possible || false,
      referred_by: values.referred_by || null,
      tags: values.tags || [],
      utm_source: values.utm_source || null,
      loss_reason: values.loss_reason || null,
      lead_score: leadScore,
    };

    if (lead?.id) {
      await updateLead.mutateAsync({ id: lead.id, ...payload, funnel_id: values.funnel_id });
    } else {
      await createLead.mutateAsync({ ...payload, funnel_id: values.funnel_id } as any);
    }
    onOpenChange(false);
  };

  const handleAddTag = () => {
    const currentTags = form.getValues("tags") || [];
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  const isLoading = createLead.isPending || updateLead.isPending;
  const serviceInterests = crmSettings?.service_interests || ['Gestão de Tráfego', 'Social Media', 'Site/Landing Page', 'Branding', 'CRM/Automação'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="basico" className="gap-1">
                  <User className="h-3 w-3" />
                  <span className="hidden sm:inline">Básico</span>
                </TabsTrigger>
                <TabsTrigger value="comercial" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="hidden sm:inline">Comercial</span>
                </TabsTrigger>
                <TabsTrigger value="qualificacao" className="gap-1">
                  <Target className="h-3 w-3" />
                  <span className="hidden sm:inline">Qualificação</span>
                </TabsTrigger>
                <TabsTrigger value="comunicacao" className="gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span className="hidden sm:inline">Comunicação</span>
                </TabsTrigger>
                <TabsTrigger value="estrategico" className="gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="hidden sm:inline">Estratégico</span>
                </TabsTrigger>
              </TabsList>

              {/* Dados Básicos */}
              <TabsContent value="basico" className="space-y-4 mt-4">
                {/* Seleção de Funil */}
                <FormField
                  control={form.control}
                  name="funnel_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funil de Vendas *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o funil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {funnels.map((funnel) => (
                            <SelectItem key={funnel.id} value={funnel.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: funnel.color || '#3b82f6' }} 
                                />
                                {funnel.name}
                                {funnel.is_default && (
                                  <span className="text-xs text-muted-foreground">(padrão)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
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
                        <FormLabel>Empresa/Marca</FormLabel>
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
                        <FormLabel>E-mail</FormLabel>
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
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brazilianStates.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
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
                            {originOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                        <FormLabel>Responsável Comercial</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teamMembers?.map((member) => (
                              <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Dados Comerciais */}
              <TabsContent value="comercial" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status no Pipeline</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadTemperatureValues.map((temp) => (
                              <SelectItem key={temp} value={temp}>
                                {temperatureLabels[temp]}
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
                    name="service_interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serviço de Interesse</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceInterests.map((service) => (
                              <SelectItem key={service} value={service}>{service}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contract_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Contrato</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="projeto">Projeto</SelectItem>
                            <SelectItem value="pontual">Pontual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ticket_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket Esperado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ticketOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="closing_probability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilidade de Fechamento (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expected_close_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Prevista de Fechamento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("status") === "perdido" && (
                  <FormField
                    control={form.control}
                    name="loss_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo da Perda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motivo..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {lossReasonOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              {/* Qualificação */}
              <TabsContent value="qualificacao" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invests_in_marketing"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel>Já investe em marketing?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="current_investment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investimento Mensal Atual (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="main_pain"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Principal Dor</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Qual o principal problema que o lead quer resolver?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgência</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {urgencyOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="awareness_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Consciência</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {awarenessOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="authority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autoridade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {authorityOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Comunicação */}
              <TabsContent value="comunicacao" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canal de Contato Preferido</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contactChannelOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="next_action_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próximo Follow-up</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="next_action"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Observações do Comercial</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Notas e observações..." rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Dados Estratégicos */}
              <TabsContent value="estrategico" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="segment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segmento do Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: E-commerce, Saúde, Educação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="digital_maturity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maturidade Digital</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {maturityOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ltv_potential"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Potencial de LTV</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ltvOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="referred_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indicado por</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome de quem indicou" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_recurring_client"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <FormLabel>Cliente Recorrente?</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cross_sell_possible"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <FormLabel>Cross-sell Possível?</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="utm_source"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Fonte da Campanha (UTM)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: facebook_ads_maio" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <div className="col-span-2 space-y-2">
                    <FormLabel>Tags</FormLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(form.watch("tags") || []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Nova tag..."
                        className="max-w-xs"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" size="sm" variant="outline" onClick={handleAddTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : lead ? "Atualizar" : "Criar Lead"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
