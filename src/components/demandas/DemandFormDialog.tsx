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
import { useCreateDemand, useUpdateDemand, Demand } from "@/hooks/useDemands";
import { useClients } from "@/hooks/useClients";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Constants } from "@/integrations/supabase/types";

const demandStatusValues = Constants.public.Enums.demand_status;
const priorityValues = Constants.public.Enums.priority;

const demandSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().max(1000).optional(),
  client_id: z.string().uuid("Selecione um cliente"),
  assigned_to: z.string().uuid().optional().nullable(),
  status: z.enum(demandStatusValues as unknown as [string, ...string[]]).default("backlog"),
  priority: z.enum(priorityValues as unknown as [string, ...string[]]).default("medium"),
  deadline: z.string().optional(),
  estimated_hours: z.coerce.number().min(0).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

type DemandFormValues = z.infer<typeof demandSchema>;

interface DemandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand?: Demand | null;
}

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "A Fazer",
  in_progress: "Em Andamento",
  review: "Revisão",
  done: "Concluído",
  cancelled: "Cancelado",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export function DemandFormDialog({ open, onOpenChange, demand }: DemandFormDialogProps) {
  const createDemand = useCreateDemand();
  const updateDemand = useUpdateDemand();
  const { data: clients } = useClients();
  const { data: teamMembers } = useTeamMembers();
  
  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandSchema),
    defaultValues: {
      title: "",
      description: "",
      client_id: "",
      assigned_to: null,
      status: "backlog",
      priority: "medium",
      deadline: "",
      estimated_hours: null,
      tags: [],
    },
  });

  useEffect(() => {
    if (demand) {
      form.reset({
        title: demand.title,
        description: demand.description || "",
        client_id: demand.client_id,
        assigned_to: demand.assigned_to || null,
        status: demand.status,
        priority: demand.priority,
        deadline: demand.deadline || "",
        estimated_hours: demand.estimated_hours || null,
        tags: demand.tags || [],
      });
    } else {
      form.reset({
        title: "",
        description: "",
        client_id: "",
        assigned_to: null,
        status: "backlog",
        priority: "medium",
        deadline: "",
        estimated_hours: null,
        tags: [],
      });
    }
  }, [demand, form]);

  const onSubmit = async (values: DemandFormValues) => {
    const payload = {
      title: values.title,
      description: values.description || null,
      client_id: values.client_id,
      assigned_to: values.assigned_to || null,
      status: values.status as Demand["status"],
      priority: values.priority as Demand["priority"],
      deadline: values.deadline || null,
      estimated_hours: values.estimated_hours || null,
      tags: values.tags || null,
    };

    if (demand?.id) {
      await updateDemand.mutateAsync({ id: demand.id, ...payload });
    } else {
      await createDemand.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isLoading = createDemand.isPending || updateDemand.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{demand ? "Editar Demanda" : "Nova Demanda"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da demanda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
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
                name="assigned_to"
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
                        {demandStatusValues.map((status) => (
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityValues.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priorityLabels[priority] || priority}
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
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Estimadas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.5" 
                        placeholder="Ex: 4"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada da demanda..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
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
                {isLoading ? "Salvando..." : demand ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
