import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  RotateCcw, 
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Tag,
  Building,
  Target,
  Briefcase,
  Hash,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ItemType = 'client' | 'demand' | 'lead' | 'planning' | 'contract' | 'expense' | 'product' | 'service' | 'goal' | 'team_member';

interface ArchivedDisplayItem {
  id: string;
  item_type: ItemType;
  original_id: string;
  original_data: Record<string, unknown>;
  archived_at: string;
  name: string;
  details?: string;
  daysArchived: number;
}

interface ArchivedItemPreviewDialogProps {
  item: ArchivedDisplayItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (item: ArchivedDisplayItem) => void;
  isRestoring?: boolean;
}

const typeLabels: Record<ItemType, string> = {
  client: 'Cliente',
  demand: 'Demanda',
  lead: 'Lead',
  planning: 'Planejamento',
  contract: 'Contrato',
  expense: 'Despesa',
  product: 'Produto',
  service: 'Serviço',
  goal: 'Meta',
  team_member: 'Membro da Equipe',
};

const typeColors: Record<ItemType, string> = {
  client: 'bg-blue-500/20 text-blue-500',
  demand: 'bg-purple-500/20 text-purple-500',
  lead: 'bg-orange-500/20 text-orange-500',
  planning: 'bg-green-500/20 text-green-500',
  contract: 'bg-cyan-500/20 text-cyan-500',
  expense: 'bg-red-500/20 text-red-500',
  product: 'bg-yellow-500/20 text-yellow-500',
  service: 'bg-indigo-500/20 text-indigo-500',
  goal: 'bg-pink-500/20 text-pink-500',
  team_member: 'bg-teal-500/20 text-teal-500',
};

// Field labels in Portuguese
const fieldLabels: Record<string, string> = {
  name: 'Nome',
  title: 'Título',
  description: 'Descrição',
  email: 'E-mail',
  phone: 'Telefone',
  whatsapp: 'WhatsApp',
  address: 'Endereço',
  city: 'Cidade',
  state: 'Estado',
  zip_code: 'CEP',
  cnpj: 'CNPJ',
  company: 'Empresa',
  contact_name: 'Nome do Contato',
  contact_email: 'E-mail do Contato',
  contact_phone: 'Telefone do Contato',
  status: 'Status',
  priority: 'Prioridade',
  value: 'Valor',
  monthly_value: 'Valor Mensal',
  estimated_value: 'Valor Estimado',
  notes: 'Observações',
  tags: 'Tags',
  deadline: 'Prazo',
  start_date: 'Data de Início',
  end_date: 'Data de Término',
  contract_start: 'Início do Contrato',
  contract_end: 'Fim do Contrato',
  contract_type: 'Tipo de Contrato',
  plan: 'Plano',
  segment: 'Segmento',
  origin: 'Origem',
  temperature: 'Temperatura',
  service_interest: 'Interesse em Serviço',
  role: 'Cargo',
  category: 'Categoria',
  type: 'Tipo',
  date: 'Data',
  due_date: 'Data de Vencimento',
  paid_at: 'Pago em',
  recurring: 'Recorrente',
  supplier: 'Fornecedor',
  client_id: 'Cliente',
  assigned_to: 'Responsável',
  responsible_id: 'Responsável',
  estimated_hours: 'Horas Estimadas',
  actual_hours: 'Horas Reais',
  month: 'Mês',
  year: 'Ano',
  objectives: 'Objetivos',
  target_value: 'Valor Alvo',
  current_value: 'Valor Atual',
  unit: 'Unidade',
  main_pain: 'Principal Dor',
  urgency: 'Urgência',
  next_action: 'Próxima Ação',
  next_action_date: 'Data da Próxima Ação',
  instagram: 'Instagram',
  lead_score: 'Score do Lead',
  closing_probability: 'Probabilidade de Fechamento',
  expected_close_date: 'Data Esperada de Fechamento',
  loss_reason: 'Motivo da Perda',
  avatar: 'Avatar',
  delivery_date: 'Data de Entrega',
};

// Fields to hide from preview
const hiddenFields = ['id', 'created_at', 'updated_at', 'is_archived', 'original_id', 'user_id', 'client_user_id', 'client_temp_password', 'signature_token', 'share_token'];

// Format value based on field type
const formatValue = (key: string, value: unknown): string | React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground italic">Não informado</span>;
  }

  // Boolean values
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground italic">Nenhum</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {String(item)}
          </Badge>
        ))}
      </div>
    );
  }

  // Currency values
  if (key.includes('value') || key === 'current_investment') {
    const num = Number(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    }
  }

  // Percentage values
  if (key.includes('probability') || key === 'lead_score') {
    const num = Number(value);
    if (!isNaN(num)) {
      return `${num}%`;
    }
  }

  // Hours
  if (key.includes('hours')) {
    return `${value}h`;
  }

  // Date values
  if (key.includes('date') || key.includes('_at') || key === 'deadline') {
    try {
      const date = new Date(String(value));
      if (!isNaN(date.getTime())) {
        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      }
    } catch {
      return String(value);
    }
  }

  // Month values
  if (key === 'month') {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthNum = Number(value);
    if (monthNum >= 1 && monthNum <= 12) {
      return months[monthNum - 1];
    }
  }

  // Status translations
  if (key === 'status') {
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'pending': 'Pendente',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'in_progress': 'Em Andamento',
      'done': 'Concluído',
      'todo': 'A Fazer',
      'backlog': 'Backlog',
      'review': 'Em Revisão',
      'novo': 'Novo',
      'em_contato': 'Em Contato',
      'proposta_enviada': 'Proposta Enviada',
      'negociacao': 'Negociação',
      'fechamento': 'Fechamento',
      'perdido': 'Perdido',
    };
    return statusMap[String(value)] || String(value);
  }

  // Priority translations
  if (key === 'priority') {
    const priorityMap: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'urgent': 'Urgente',
    };
    return priorityMap[String(value)] || String(value);
  }

  // Temperature translations
  if (key === 'temperature') {
    const tempMap: Record<string, string> = {
      'cold': 'Frio',
      'warm': 'Morno',
      'hot': 'Quente',
    };
    return tempMap[String(value)] || String(value);
  }

  return String(value);
};

// Get icon for field
const getFieldIcon = (key: string) => {
  if (key.includes('email')) return Mail;
  if (key.includes('phone') || key === 'whatsapp') return Phone;
  if (key.includes('address') || key === 'city' || key === 'state' || key === 'zip_code') return MapPin;
  if (key.includes('value') || key === 'current_investment') return DollarSign;
  if (key.includes('date') || key.includes('_at') || key === 'deadline' || key === 'month' || key === 'year') return Calendar;
  if (key === 'company' || key === 'cnpj') return Building;
  if (key === 'tags' || key === 'category') return Tag;
  if (key === 'notes' || key === 'description' || key === 'objectives') return FileText;
  if (key === 'role' || key === 'assigned_to' || key === 'responsible_id') return User;
  if (key === 'segment' || key === 'service_interest') return Target;
  if (key === 'type' || key === 'contract_type' || key === 'plan') return Briefcase;
  if (key === 'priority' || key === 'status' || key === 'temperature') return AlertCircle;
  if (key.includes('hours')) return Clock;
  return Hash;
};

export function ArchivedItemPreviewDialog({
  item,
  open,
  onOpenChange,
  onRestore,
  isRestoring = false,
}: ArchivedItemPreviewDialogProps) {
  if (!item) return null;

  const data = item.original_data;
  
  // Filter and organize fields
  const fields = Object.entries(data)
    .filter(([key]) => !hiddenFields.includes(key))
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .sort((a, b) => {
      // Priority order for common fields
      const priority = ['name', 'title', 'description', 'email', 'phone', 'company', 'status', 'value', 'monthly_value'];
      const aIdx = priority.indexOf(a[0]);
      const bIdx = priority.indexOf(b[0]);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Badge className={typeColors[item.item_type]}>
              {typeLabels[item.item_type]}
            </Badge>
            <DialogTitle className="text-xl">{item.name}</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2 pt-2">
            <Calendar className="h-4 w-4" />
            Arquivado em {format(new Date(item.archived_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            <span className="text-muted-foreground">({item.daysArchived === 0 ? 'Hoje' : `há ${item.daysArchived} dias`})</span>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {fields.map(([key, value]) => {
              const Icon = getFieldIcon(key);
              const label = fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <div key={key} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <div className="text-sm mt-0.5 break-words">
                      {formatValue(key, value)}
                    </div>
                  </div>
                </div>
              );
            })}

            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado disponível para visualização</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button 
            onClick={() => {
              onRestore(item);
              onOpenChange(false);
            }}
            disabled={isRestoring}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
