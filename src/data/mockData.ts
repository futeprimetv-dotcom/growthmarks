// Mock Data for Growth Marks System

export type Priority = 'green' | 'yellow' | 'red';
export type DemandStatus = 'entrada' | 'planejamento' | 'producao' | 'revisao' | 'entregue';
export type ClientStatus = 'ativo' | 'pausado' | 'encerrado';
export type TeamStatus = 'disponivel' | 'ocupado';
export type PaymentStatus = 'pago' | 'pendente' | 'atrasado';
export type ContractType = 'mensal' | 'projeto';
export type ContractStatus = 'ativo' | 'renovacao' | 'encerrado';
export type ExpenseCategory = 'custo_operacional' | 'despesa' | 'investimento';
export type ServiceStatus = 'ativo' | 'pausado';
export type ProjectStatus = 'em_andamento' | 'quitado';

// ============= COMMERCIAL CRM TYPES =============
export type LeadStatus = 'lead_frio' | 'em_contato' | 'proposta_enviada' | 'negociacao' | 'fechado' | 'perdido';
export type LeadOrigin = 'instagram' | 'indicacao' | 'google' | 'linkedin' | 'site' | 'outro';
export type LeadTemperature = 'frio' | 'morno' | 'quente';

// ============= PLANNING TYPES =============
export type PlanningStatus = 'rascunho' | 'aguardando_aprovacao' | 'aprovado';
export type ContentType = 'post' | 'reels' | 'stories' | 'carrossel';

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  plan: string;
  monthlyValue: number;
  email: string;
  phone: string;
  startDate: string;
  responsibleId: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: TeamStatus;
  demandsCount: number;
}

export interface Demand {
  id: string;
  title: string;
  clientId: string;
  responsibleId: string;
  deadline: string;
  priority: Priority;
  status: DemandStatus;
  description: string;
  createdAt: string;
  completedAt?: string;
}

export interface Contract {
  id: string;
  clientId: string;
  type: ContractType;
  services: string[];
  value: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
}

export interface Payment {
  id: string;
  clientId: string;
  description: string;
  value: number;
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string;
}

// ============= FINANCIAL MODULE DATA =============

export interface RecurringService {
  id: string;
  clientId: string;
  serviceName: string;
  monthlyValue: number;
  status: ServiceStatus;
  paymentMethod: string;
  nextPaymentDate: string;
  contractStart: string;
  contractEnd: string;
}

export interface Product {
  id: string;
  clientId: string;
  description: string;
  totalValue: number;
  installments: number;
  paidInstallments: number;
  status: ProjectStatus;
  startDate: string;
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  category: ExpenseCategory;
  dueDate: string;
  status: PaymentStatus;
  recurrence: 'mensal' | 'pontual';
}

export interface PartnerDistribution {
  name: string;
  percentage: number;
}

// ============= COMMERCIAL CRM DATA =============

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  serviceInterest: string;
  estimatedValue: number;
  status: LeadStatus;
  origin: LeadOrigin;
  temperature: LeadTemperature;
  responsibleId: string;
  nextAction?: string;
  nextActionDate?: string;
  notes?: string;
  createdAt: string;
  closedAt?: string;
}

// ============= PLANNING DATA =============

export interface ContentItem {
  id: string;
  date: string;
  type: ContentType;
  topic: string;
  description: string;
  status: 'pendente' | 'aprovado' | 'produzindo' | 'publicado';
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  budget: number;
  platform: string;
}

export interface Planning {
  id: string;
  clientId: string;
  month: number;
  year: number;
  status: PlanningStatus;
  objectives: string[];
  observations?: string;
  contentItems: ContentItem[];
  campaigns: Campaign[];
  createdAt: string;
  updatedAt: string;
  shareToken: string;
}

// Team Members
export const teamMembers: TeamMember[] = [
  { id: 'tm1', name: 'Paulo', role: 'Gestor', status: 'disponivel', demandsCount: 3 },
  { id: 'tm2', name: 'Ana Silva', role: 'Designer', status: 'ocupado', demandsCount: 6 },
  { id: 'tm3', name: 'Carlos Oliveira', role: 'Social Media', status: 'ocupado', demandsCount: 5 },
  { id: 'tm4', name: 'Mariana Costa', role: 'Tráfego Pago', status: 'disponivel', demandsCount: 4 },
];

// Clients
export const clients: Client[] = [
  {
    id: 'c1',
    name: 'Colégio Criativa',
    status: 'ativo',
    plan: 'Social + Tráfego',
    monthlyValue: 1500,
    email: 'contato@colegiocriativa.com.br',
    phone: '(11) 99999-1111',
    startDate: '2024-01-15',
    responsibleId: 'tm1',
  },
  {
    id: 'c2',
    name: 'VITTÁ PRIME',
    status: 'ativo',
    plan: 'Social Completo',
    monthlyValue: 1200,
    email: 'marketing@vittaprime.com.br',
    phone: '(11) 99999-2222',
    startDate: '2023-08-01',
    responsibleId: 'tm3',
  },
  {
    id: 'c3',
    name: 'Lince Investimentos',
    status: 'ativo',
    plan: 'Social Media',
    monthlyValue: 1500,
    email: 'contato@linceinvestimentos.com.br',
    phone: '(11) 99999-3333',
    startDate: '2024-03-10',
    responsibleId: 'tm4',
  },
  {
    id: 'c4',
    name: 'Cris Corretora',
    status: 'ativo',
    plan: 'Social Básico',
    monthlyValue: 1500,
    email: 'marketing@criscorretora.com.br',
    phone: '(11) 99999-4444',
    startDate: '2023-11-20',
    responsibleId: 'tm1',
  },
  {
    id: 'c5',
    name: 'Amazon Cursos',
    status: 'pausado',
    plan: 'Full Marketing',
    monthlyValue: 4500,
    email: 'ads@amazoncursos.com.br',
    phone: '(11) 99999-5555',
    startDate: '2024-02-01',
    responsibleId: 'tm4',
  },
  {
    id: 'c6',
    name: 'Tech Solutions',
    status: 'ativo',
    plan: 'Tráfego + Conversão',
    monthlyValue: 2000,
    email: 'growth@techsolutions.io',
    phone: '(11) 99999-6666',
    startDate: '2024-04-15',
    responsibleId: 'tm2',
  },
  {
    id: 'c7',
    name: 'Bella Estética',
    status: 'encerrado',
    plan: 'Social Básico',
    monthlyValue: 0,
    email: 'contato@bellaestetica.com.br',
    phone: '(11) 99999-7777',
    startDate: '2023-06-01',
    responsibleId: 'tm3',
  },
];

// ============= LEADS (CRM) =============
export const leads: Lead[] = [
  {
    id: 'lead1',
    name: 'Dr. Ricardo Almeida',
    company: 'Clínica Sorriso',
    email: 'ricardo@clinicasorriso.com.br',
    phone: '(11) 98765-1234',
    serviceInterest: 'Social Media + Tráfego',
    estimatedValue: 2500,
    status: 'proposta_enviada',
    origin: 'instagram',
    temperature: 'quente',
    responsibleId: 'tm1',
    nextAction: 'Follow-up da proposta',
    nextActionDate: '2025-01-12',
    notes: 'Muito interessado, quer começar em fevereiro',
    createdAt: '2025-01-05',
  },
  {
    id: 'lead2',
    name: 'Fernanda Lima',
    company: 'Academia FitPro',
    email: 'fernanda@fitpro.com.br',
    phone: '(11) 98765-2345',
    serviceInterest: 'Social Media',
    estimatedValue: 1800,
    status: 'em_contato',
    origin: 'indicacao',
    temperature: 'morno',
    responsibleId: 'tm1',
    nextAction: 'Agendar reunião',
    nextActionDate: '2025-01-10',
    createdAt: '2025-01-03',
  },
  {
    id: 'lead3',
    name: 'João Mendes',
    company: 'Restaurante Sabor',
    email: 'joao@restaurantesabor.com.br',
    phone: '(11) 98765-3456',
    serviceInterest: 'Social Básico',
    estimatedValue: 1200,
    status: 'lead_frio',
    origin: 'google',
    temperature: 'frio',
    responsibleId: 'tm3',
    notes: 'Pediu informações pelo site',
    createdAt: '2025-01-06',
  },
  {
    id: 'lead4',
    name: 'Patricia Santos',
    company: 'Escola Futuro',
    email: 'patricia@escolafuturo.com.br',
    phone: '(11) 98765-4567',
    serviceInterest: 'Full Marketing',
    estimatedValue: 3000,
    status: 'negociacao',
    origin: 'linkedin',
    temperature: 'quente',
    responsibleId: 'tm1',
    nextAction: 'Enviar contrato revisado',
    nextActionDate: '2025-01-09',
    notes: 'Negociando desconto no primeiro mês',
    createdAt: '2024-12-28',
  },
  {
    id: 'lead5',
    name: 'Roberto Costa',
    company: 'Petshop Amigo',
    email: 'roberto@petshopamigo.com.br',
    phone: '(11) 98765-5678',
    serviceInterest: 'Social Media',
    estimatedValue: 1500,
    status: 'fechado',
    origin: 'indicacao',
    temperature: 'quente',
    responsibleId: 'tm1',
    closedAt: '2025-01-02',
    createdAt: '2024-12-15',
  },
  {
    id: 'lead6',
    name: 'Carla Ribeiro',
    company: 'Boutique Elegance',
    email: 'carla@boutiqueelegance.com.br',
    phone: '(11) 98765-6789',
    serviceInterest: 'Social + Tráfego',
    estimatedValue: 2200,
    status: 'em_contato',
    origin: 'instagram',
    temperature: 'morno',
    responsibleId: 'tm4',
    nextAction: 'Enviar proposta',
    nextActionDate: '2025-01-11',
    createdAt: '2025-01-04',
  },
  {
    id: 'lead7',
    name: 'Marcos Oliveira',
    company: 'Construtora Horizonte',
    email: 'marcos@construtorahorizonte.com.br',
    phone: '(11) 98765-7890',
    serviceInterest: 'Branding + Social',
    estimatedValue: 4500,
    status: 'proposta_enviada',
    origin: 'site',
    temperature: 'quente',
    responsibleId: 'tm1',
    nextAction: 'Aguardar retorno',
    nextActionDate: '2025-01-15',
    notes: 'Grande potencial, projeto completo',
    createdAt: '2024-12-20',
  },
  {
    id: 'lead8',
    name: 'Ana Paula Ferreira',
    company: 'Clínica Derma',
    email: 'ana@clinicaderma.com.br',
    phone: '(11) 98765-8901',
    serviceInterest: 'Tráfego Pago',
    estimatedValue: 1800,
    status: 'perdido',
    origin: 'google',
    temperature: 'frio',
    responsibleId: 'tm4',
    notes: 'Fechou com concorrente',
    createdAt: '2024-12-10',
  },
];

// ============= PLANNINGS =============
export const plannings: Planning[] = [
  {
    id: 'plan1',
    clientId: 'c1',
    month: 1,
    year: 2025,
    status: 'aprovado',
    objectives: [
      'Aumentar engajamento em 20%',
      'Gerar 50 leads para matrículas',
      'Promover evento de portas abertas'
    ],
    observations: 'Cliente prefere posts mais institucionais e educativos',
    contentItems: [
      { id: 'ci1', date: '2025-01-06', type: 'post', topic: 'Volta às aulas', description: 'Post institucional boas-vindas', status: 'publicado' },
      { id: 'ci2', date: '2025-01-08', type: 'reels', topic: 'Infraestrutura', description: 'Tour pela escola', status: 'publicado' },
      { id: 'ci3', date: '2025-01-10', type: 'carrossel', topic: 'Diferenciais', description: 'Metodologia de ensino', status: 'aprovado' },
      { id: 'ci4', date: '2025-01-13', type: 'stories', topic: 'Dia a dia', description: 'Bastidores da escola', status: 'pendente' },
      { id: 'ci5', date: '2025-01-15', type: 'post', topic: 'Portas Abertas', description: 'Convite para evento', status: 'pendente' },
      { id: 'ci6', date: '2025-01-17', type: 'reels', topic: 'Depoimentos', description: 'Pais e alunos', status: 'pendente' },
      { id: 'ci7', date: '2025-01-20', type: 'carrossel', topic: 'Atividades', description: 'Extracurriculares', status: 'pendente' },
      { id: 'ci8', date: '2025-01-22', type: 'post', topic: 'Matrículas', description: 'Últimas vagas', status: 'pendente' },
      { id: 'ci9', date: '2025-01-24', type: 'stories', topic: 'Professores', description: 'Conheça a equipe', status: 'pendente' },
      { id: 'ci10', date: '2025-01-27', type: 'reels', topic: 'Resultados', description: 'Cases de sucesso', status: 'pendente' },
      { id: 'ci11', date: '2025-01-29', type: 'post', topic: 'Encerramento', description: 'Resumo do mês', status: 'pendente' },
      { id: 'ci12', date: '2025-01-31', type: 'carrossel', topic: 'Preview Fevereiro', description: 'O que vem por aí', status: 'pendente' },
    ],
    campaigns: [
      { id: 'camp1', name: 'Matrículas 2025', objective: 'Conversão', budget: 800, platform: 'Meta Ads' },
      { id: 'camp2', name: 'Branding Institucional', objective: 'Alcance', budget: 400, platform: 'Meta Ads' },
    ],
    createdAt: '2024-12-20',
    updatedAt: '2025-01-02',
    shareToken: 'cc-jan-2025-abc123',
  },
  {
    id: 'plan2',
    clientId: 'c2',
    month: 1,
    year: 2025,
    status: 'aguardando_aprovacao',
    objectives: [
      'Lançar promoção de verão',
      'Aumentar seguidores em 500',
      'Promover novos tratamentos'
    ],
    contentItems: [
      { id: 'ci13', date: '2025-01-07', type: 'post', topic: 'Promoção Verão', description: 'Lançamento promo', status: 'aprovado' },
      { id: 'ci14', date: '2025-01-09', type: 'reels', topic: 'Tratamentos', description: 'Antes e depois', status: 'produzindo' },
      { id: 'ci15', date: '2025-01-11', type: 'stories', topic: 'Bastidores', description: 'Dia na clínica', status: 'pendente' },
      { id: 'ci16', date: '2025-01-14', type: 'carrossel', topic: 'Dicas', description: 'Cuidados verão', status: 'pendente' },
      { id: 'ci17', date: '2025-01-16', type: 'post', topic: 'Novidades', description: 'Novo tratamento', status: 'pendente' },
      { id: 'ci18', date: '2025-01-18', type: 'reels', topic: 'Depoimentos', description: 'Clientes felizes', status: 'pendente' },
      { id: 'ci19', date: '2025-01-21', type: 'stories', topic: 'Promoção', description: 'Contagem regressiva', status: 'pendente' },
      { id: 'ci20', date: '2025-01-23', type: 'post', topic: 'Resultados', description: 'Transformações', status: 'pendente' },
      { id: 'ci21', date: '2025-01-25', type: 'carrossel', topic: 'FAQ', description: 'Dúvidas frequentes', status: 'pendente' },
      { id: 'ci22', date: '2025-01-28', type: 'reels', topic: 'Equipe', description: 'Especialistas', status: 'pendente' },
      { id: 'ci23', date: '2025-01-30', type: 'post', topic: 'Fechamento', description: 'Resumo janeiro', status: 'pendente' },
    ],
    campaigns: [
      { id: 'camp3', name: 'Promoção Verão', objective: 'Conversão', budget: 600, platform: 'Meta Ads' },
    ],
    createdAt: '2024-12-22',
    updatedAt: '2025-01-05',
    shareToken: 'vp-jan-2025-def456',
  },
  {
    id: 'plan3',
    clientId: 'c3',
    month: 2,
    year: 2025,
    status: 'rascunho',
    objectives: [
      'Posicionar como autoridade em investimentos',
      'Educar sobre mercado financeiro',
      'Captar novos leads qualificados'
    ],
    contentItems: [
      { id: 'ci24', date: '2025-02-03', type: 'post', topic: 'Mercado', description: 'Análise semanal', status: 'pendente' },
      { id: 'ci25', date: '2025-02-05', type: 'carrossel', topic: 'Educacional', description: 'Tipos de investimento', status: 'pendente' },
      { id: 'ci26', date: '2025-02-07', type: 'reels', topic: 'Dicas', description: 'Erros comuns', status: 'pendente' },
      { id: 'ci27', date: '2025-02-10', type: 'post', topic: 'Case', description: 'Cliente destaque', status: 'pendente' },
      { id: 'ci28', date: '2025-02-12', type: 'stories', topic: 'Interação', description: 'Quiz financeiro', status: 'pendente' },
      { id: 'ci29', date: '2025-02-14', type: 'post', topic: 'Especial', description: 'Dia dos namorados - finanças', status: 'pendente' },
      { id: 'ci30', date: '2025-02-17', type: 'carrossel', topic: 'Planejamento', description: 'Metas 2025', status: 'pendente' },
      { id: 'ci31', date: '2025-02-19', type: 'reels', topic: 'Tendências', description: 'Novidades do mercado', status: 'pendente' },
    ],
    campaigns: [],
    createdAt: '2025-01-05',
    updatedAt: '2025-01-05',
    shareToken: 'li-fev-2025-ghi789',
  },
  {
    id: 'plan4',
    clientId: 'c4',
    month: 1,
    year: 2025,
    status: 'aprovado',
    objectives: [
      'Aumentar reconhecimento de marca',
      'Gerar leads para seguros',
      'Humanizar a marca'
    ],
    contentItems: [
      { id: 'ci32', date: '2025-01-06', type: 'post', topic: 'Institucional', description: 'Quem somos', status: 'publicado' },
      { id: 'ci33', date: '2025-01-09', type: 'carrossel', topic: 'Produtos', description: 'Tipos de seguro', status: 'publicado' },
      { id: 'ci34', date: '2025-01-13', type: 'reels', topic: 'Dicas', description: 'Como escolher seguro', status: 'aprovado' },
      { id: 'ci35', date: '2025-01-16', type: 'post', topic: 'Case', description: 'História de cliente', status: 'pendente' },
      { id: 'ci36', date: '2025-01-20', type: 'stories', topic: 'FAQ', description: 'Perguntas frequentes', status: 'pendente' },
      { id: 'ci37', date: '2025-01-23', type: 'carrossel', topic: 'Educacional', description: 'Mitos sobre seguros', status: 'pendente' },
      { id: 'ci38', date: '2025-01-27', type: 'post', topic: 'Promoção', description: 'Condições especiais', status: 'pendente' },
      { id: 'ci39', date: '2025-01-30', type: 'reels', topic: 'Bastidores', description: 'Dia na corretora', status: 'pendente' },
    ],
    campaigns: [
      { id: 'camp4', name: 'Captação Leads', objective: 'Lead Generation', budget: 500, platform: 'Meta Ads' },
    ],
    createdAt: '2024-12-18',
    updatedAt: '2024-12-28',
    shareToken: 'cc-jan-2025-jkl012',
  },
];

// ============= RECURRING SERVICES (Serviços - Receita Recorrente) =============
export const recurringServices: RecurringService[] = [
  {
    id: 'rs1',
    clientId: 'c1',
    serviceName: 'Social Media + Tráfego',
    monthlyValue: 1500,
    status: 'ativo',
    paymentMethod: 'PIX',
    nextPaymentDate: '2025-02-10',
    contractStart: '2024-01-15',
    contractEnd: '2025-01-15',
  },
  {
    id: 'rs2',
    clientId: 'c3',
    serviceName: 'Social Media',
    monthlyValue: 1500,
    status: 'ativo',
    paymentMethod: 'Boleto',
    nextPaymentDate: '2025-02-05',
    contractStart: '2024-06-01',
    contractEnd: '2025-06-01',
  },
  {
    id: 'rs3',
    clientId: 'c2',
    serviceName: 'Social Completo',
    monthlyValue: 1200,
    status: 'ativo',
    paymentMethod: 'Cartão',
    nextPaymentDate: '2025-02-01',
    contractStart: '2023-08-01',
    contractEnd: '2025-08-01',
  },
  {
    id: 'rs4',
    clientId: 'c4',
    serviceName: 'Social Básico',
    monthlyValue: 1500,
    status: 'ativo',
    paymentMethod: 'PIX',
    nextPaymentDate: '2025-02-15',
    contractStart: '2024-11-01',
    contractEnd: '2025-11-01',
  },
];

// ============= PRODUCTS (Projetos Pontuais) =============
export const products: Product[] = [
  {
    id: 'prod1',
    clientId: 'c1',
    description: 'Website Institucional',
    totalValue: 3500,
    installments: 3,
    paidInstallments: 2,
    status: 'em_andamento',
    startDate: '2024-12-01',
  },
  {
    id: 'prod2',
    clientId: 'c3',
    description: 'Branding Completo',
    totalValue: 4800,
    installments: 4,
    paidInstallments: 4,
    status: 'quitado',
    startDate: '2024-10-15',
  },
  {
    id: 'prod3',
    clientId: 'c2',
    description: 'Landing Page + Funil',
    totalValue: 2200,
    installments: 2,
    paidInstallments: 1,
    status: 'em_andamento',
    startDate: '2025-01-05',
  },
];

// ============= EXPENSES (Despesas & Custos) =============
export const expenses: Expense[] = [
  // Custos Operacionais (Ferramentas)
  {
    id: 'exp1',
    description: 'Google Drive (Armazenamento)',
    value: 34.99,
    category: 'custo_operacional',
    dueDate: '2025-01-20',
    status: 'pago',
    recurrence: 'mensal',
  },
  {
    id: 'exp2',
    description: 'ChatGPT Plus',
    value: 104.00,
    category: 'custo_operacional',
    dueDate: '2025-01-15',
    status: 'pago',
    recurrence: 'mensal',
  },
  {
    id: 'exp3',
    description: 'TurboCloud (Hospedagem)',
    value: 59.90,
    category: 'custo_operacional',
    dueDate: '2025-01-10',
    status: 'pago',
    recurrence: 'mensal',
  },
  {
    id: 'exp4',
    description: 'Canva Pro',
    value: 54.90,
    category: 'custo_operacional',
    dueDate: '2025-01-25',
    status: 'pendente',
    recurrence: 'mensal',
  },
  {
    id: 'exp5',
    description: 'CapCut Pro',
    value: 75.00,
    category: 'custo_operacional',
    dueDate: '2025-01-28',
    status: 'pendente',
    recurrence: 'mensal',
  },
  {
    id: 'exp6',
    description: 'GoVIP (Agendamentos)',
    value: 175.00,
    category: 'custo_operacional',
    dueDate: '2025-01-05',
    status: 'pago',
    recurrence: 'mensal',
  },
  // Despesas (Pessoas)
  {
    id: 'exp7',
    description: 'Samira - Freelancer Design',
    value: 1200.00,
    category: 'despesa',
    dueDate: '2025-01-30',
    status: 'pendente',
    recurrence: 'mensal',
  },
];

// ============= PARTNER DISTRIBUTION =============
export const partnerDistribution: PartnerDistribution[] = [
  { name: 'Paulo', percentage: 55 },
  { name: 'Isabela', percentage: 45 },
];

// ============= MONTHLY COMPARISON DATA =============
export const monthlyComparisonData = [
  { month: 'Ago', receitas: 4800, despesas: 1450, lucro: 3350 },
  { month: 'Set', receitas: 5200, despesas: 1520, lucro: 3680 },
  { month: 'Out', receitas: 5500, despesas: 1580, lucro: 3920 },
  { month: 'Nov', receitas: 5400, despesas: 1620, lucro: 3780 },
  { month: 'Dez', receitas: 5700, despesas: 1680, lucro: 4020 },
  { month: 'Jan', receitas: 5700, despesas: 1703.79, lucro: 3996.21 },
];

// Demands
export const demands: Demand[] = [
  {
    id: 'd1',
    title: 'Criar Reels Janeiro',
    clientId: 'c2',
    responsibleId: 'tm3',
    deadline: '2025-01-10',
    priority: 'red',
    status: 'producao',
    description: 'Produção de 8 reels para o mês de janeiro com foco em promoções.',
    createdAt: '2025-01-02',
  },
  {
    id: 'd2',
    title: 'Landing Page Institucional',
    clientId: 'c3',
    responsibleId: 'tm2',
    deadline: '2025-01-15',
    priority: 'yellow',
    status: 'planejamento',
    description: 'Desenvolvimento de landing page institucional com formulário de contato.',
    createdAt: '2025-01-03',
  },
  {
    id: 'd3',
    title: 'Criativos Meta Ads',
    clientId: 'c5',
    responsibleId: 'tm2',
    deadline: '2025-01-08',
    priority: 'red',
    status: 'revisao',
    description: 'Criação de 10 peças para campanha de conversão no Meta Ads.',
    createdAt: '2025-01-01',
  },
  {
    id: 'd4',
    title: 'Calendário Editorial Fevereiro',
    clientId: 'c1',
    responsibleId: 'tm3',
    deadline: '2025-01-20',
    priority: 'green',
    status: 'entrada',
    description: 'Planejamento do calendário de conteúdo para fevereiro.',
    createdAt: '2025-01-05',
  },
  {
    id: 'd5',
    title: 'Campanha Google Ads',
    clientId: 'c5',
    responsibleId: 'tm4',
    deadline: '2025-01-07',
    priority: 'red',
    status: 'producao',
    description: 'Configuração e otimização de campanha no Google Ads.',
    createdAt: '2025-01-02',
  },
  {
    id: 'd6',
    title: 'Stories Promocionais',
    clientId: 'c2',
    responsibleId: 'tm2',
    deadline: '2025-01-12',
    priority: 'yellow',
    status: 'producao',
    description: 'Criação de sequência de stories para promoção de janeiro.',
    createdAt: '2025-01-04',
  },
  {
    id: 'd7',
    title: 'Relatório de Performance',
    clientId: 'c6',
    responsibleId: 'tm4',
    deadline: '2025-01-10',
    priority: 'yellow',
    status: 'planejamento',
    description: 'Relatório mensal de performance das campanhas de tráfego.',
    createdAt: '2025-01-03',
  },
  {
    id: 'd8',
    title: 'Posts Carrossel',
    clientId: 'c1',
    responsibleId: 'tm3',
    deadline: '2025-01-18',
    priority: 'green',
    status: 'entrada',
    description: 'Criação de 4 posts carrossel educativos.',
    createdAt: '2025-01-06',
  },
  {
    id: 'd9',
    title: 'Identidade Visual Stories',
    clientId: 'c3',
    responsibleId: 'tm2',
    deadline: '2025-01-25',
    priority: 'green',
    status: 'entrada',
    description: 'Desenvolvimento de templates para stories.',
    createdAt: '2025-01-06',
  },
  {
    id: 'd10',
    title: 'Remarketing Facebook',
    clientId: 'c5',
    responsibleId: 'tm4',
    deadline: '2025-01-09',
    priority: 'red',
    status: 'revisao',
    description: 'Configuração de campanhas de remarketing.',
    createdAt: '2025-01-02',
  },
  // Archived demands
  {
    id: 'd11',
    title: 'Campanha Black Friday',
    clientId: 'c2',
    responsibleId: 'tm4',
    deadline: '2024-11-29',
    priority: 'green',
    status: 'entregue',
    description: 'Campanha completa para Black Friday.',
    createdAt: '2024-11-01',
    completedAt: '2024-11-28',
  },
  {
    id: 'd12',
    title: 'Redesign Feed Instagram',
    clientId: 'c1',
    responsibleId: 'tm2',
    deadline: '2024-12-15',
    priority: 'green',
    status: 'entregue',
    description: 'Novo layout e identidade visual do feed.',
    createdAt: '2024-12-01',
    completedAt: '2024-12-14',
  },
  {
    id: 'd13',
    title: 'Vídeo Institucional',
    clientId: 'c5',
    responsibleId: 'tm3',
    deadline: '2024-12-20',
    priority: 'green',
    status: 'entregue',
    description: 'Produção de vídeo institucional de 60 segundos.',
    createdAt: '2024-12-05',
    completedAt: '2024-12-19',
  },
];

// Contracts
export const contracts: Contract[] = [
  {
    id: 'ct1',
    clientId: 'c1',
    type: 'mensal',
    services: ['Social Media', 'Gestão de Tráfego', 'Relatórios Mensais'],
    value: 1500,
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    status: 'renovacao',
  },
  {
    id: 'ct2',
    clientId: 'c2',
    type: 'mensal',
    services: ['Social Media Completo', 'Produção de Vídeos', 'Stories Diários'],
    value: 1200,
    startDate: '2023-08-01',
    endDate: '2025-08-01',
    status: 'ativo',
  },
  {
    id: 'ct3',
    clientId: 'c3',
    type: 'mensal',
    services: ['Social Media'],
    value: 1500,
    startDate: '2024-06-01',
    endDate: '2025-06-01',
    status: 'ativo',
  },
  {
    id: 'ct4',
    clientId: 'c4',
    type: 'mensal',
    services: ['Social Básico'],
    value: 1500,
    startDate: '2024-11-01',
    endDate: '2025-11-01',
    status: 'ativo',
  },
];

// Payments
export const payments: Payment[] = [
  { id: 'p1', clientId: 'c1', description: 'Mensalidade Janeiro', value: 1500, dueDate: '2025-01-10', status: 'pago', paidAt: '2025-01-08' },
  { id: 'p2', clientId: 'c2', description: 'Mensalidade Janeiro', value: 1200, dueDate: '2025-01-05', status: 'pago', paidAt: '2025-01-05' },
  { id: 'p3', clientId: 'c3', description: 'Mensalidade Janeiro', value: 1500, dueDate: '2025-01-10', status: 'pago', paidAt: '2025-01-09' },
  { id: 'p4', clientId: 'c4', description: 'Mensalidade Janeiro', value: 1500, dueDate: '2025-01-15', status: 'pendente' },
  { id: 'p5', clientId: 'c1', description: 'Mensalidade Dezembro', value: 1500, dueDate: '2024-12-10', status: 'pago', paidAt: '2024-12-09' },
  { id: 'p6', clientId: 'c2', description: 'Mensalidade Dezembro', value: 1200, dueDate: '2024-12-05', status: 'pago', paidAt: '2024-12-04' },
];

// Dashboard Stats
export const dashboardStats = {
  activeClients: clients.filter(c => c.status === 'ativo').length,
  ongoingDemands: demands.filter(d => d.status !== 'entregue').length,
  urgentDemands: demands.filter(d => d.priority === 'red' && d.status !== 'entregue').length,
  monthlyRevenue: 5700,
  completedThisMonth: 26,
  // New stats
  totalLeads: leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length,
  hotLeads: leads.filter(l => l.temperature === 'quente' && l.status !== 'fechado' && l.status !== 'perdido').length,
  pendingPlannings: plannings.filter(p => p.status === 'aguardando_aprovacao').length,
};

// Chart data
export const weeklyDemandsData = [
  { week: 'Sem 1', concluidas: 5, novas: 8 },
  { week: 'Sem 2', concluidas: 7, novas: 6 },
  { week: 'Sem 3', concluidas: 8, novas: 5 },
  { week: 'Sem 4', concluidas: 6, novas: 7 },
];

export const monthlyRevenueData = [
  { month: 'Ago', valor: 4800 },
  { month: 'Set', valor: 5200 },
  { month: 'Out', valor: 5500 },
  { month: 'Nov', valor: 5400 },
  { month: 'Dez', valor: 5700 },
  { month: 'Jan', valor: 5700 },
];

export const paymentStatusData = [
  { name: 'Pago', value: 5, color: 'hsl(142, 76%, 36%)' },
  { name: 'Pendente', value: 1, color: 'hsl(45, 93%, 47%)' },
  { name: 'Atrasado', value: 0, color: 'hsl(0, 72%, 51%)' },
];

// ============= COMMERCIAL FUNNEL DATA =============
export const salesFunnelData = [
  { stage: 'Lead Frio', count: leads.filter(l => l.status === 'lead_frio').length },
  { stage: 'Em Contato', count: leads.filter(l => l.status === 'em_contato').length },
  { stage: 'Proposta', count: leads.filter(l => l.status === 'proposta_enviada').length },
  { stage: 'Negociação', count: leads.filter(l => l.status === 'negociacao').length },
  { stage: 'Fechado', count: leads.filter(l => l.status === 'fechado').length },
];

export const leadsByOriginData = [
  { origin: 'Instagram', count: leads.filter(l => l.origin === 'instagram').length, color: 'hsl(340, 82%, 52%)' },
  { origin: 'Indicação', count: leads.filter(l => l.origin === 'indicacao').length, color: 'hsl(142, 76%, 36%)' },
  { origin: 'Google', count: leads.filter(l => l.origin === 'google').length, color: 'hsl(217, 91%, 60%)' },
  { origin: 'LinkedIn', count: leads.filter(l => l.origin === 'linkedin').length, color: 'hsl(199, 89%, 48%)' },
  { origin: 'Site', count: leads.filter(l => l.origin === 'site').length, color: 'hsl(22, 95%, 53%)' },
];

// Helper functions
export const getClientById = (id: string) => clients.find(c => c.id === id);
export const getTeamMemberById = (id: string) => teamMembers.find(t => t.id === id);
export const getDemandsByClient = (clientId: string) => demands.filter(d => d.clientId === clientId);
export const getDemandsByResponsible = (responsibleId: string) => demands.filter(d => d.responsibleId === responsibleId);
export const getContractsByClient = (clientId: string) => contracts.filter(c => c.clientId === clientId);
export const getPaymentsByClient = (clientId: string) => payments.filter(p => p.clientId === clientId);

// ============= COMMERCIAL HELPER FUNCTIONS =============
export const getLeadById = (id: string) => leads.find(l => l.id === id);
export const getLeadsByStatus = (status: LeadStatus) => leads.filter(l => l.status === status);
export const getLeadsByResponsible = (responsibleId: string) => leads.filter(l => l.responsibleId === responsibleId);
export const getTotalPipelineValue = () => leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').reduce((acc, l) => acc + l.estimatedValue, 0);
export const getConversionRate = () => {
  const closed = leads.filter(l => l.status === 'fechado').length;
  const total = leads.filter(l => l.status === 'fechado' || l.status === 'perdido').length;
  return total > 0 ? (closed / total) * 100 : 0;
};

// ============= PLANNING HELPER FUNCTIONS =============
export const getPlanningById = (id: string) => plannings.find(p => p.id === id);
export const getPlanningByShareToken = (token: string) => plannings.find(p => p.shareToken === token);
export const getPlanningsByClient = (clientId: string) => plannings.filter(p => p.clientId === clientId);
export const getPlanningsByStatus = (status: PlanningStatus) => plannings.filter(p => p.status === status);

// ============= FINANCIAL HELPER FUNCTIONS =============
export const getTotalRecurringRevenue = () => 
  recurringServices.filter(s => s.status === 'ativo').reduce((acc, s) => acc + s.monthlyValue, 0);

export const getTotalProductsRevenue = () => 
  products.reduce((acc, p) => acc + (p.totalValue / p.installments) * p.paidInstallments, 0);

export const getTotalProductsPending = () => 
  products.reduce((acc, p) => acc + (p.totalValue / p.installments) * (p.installments - p.paidInstallments), 0);

export const getTotalExpensesByCategory = (category: ExpenseCategory) =>
  expenses.filter(e => e.category === category).reduce((acc, e) => acc + e.value, 0);

export const getTotalExpenses = () =>
  expenses.reduce((acc, e) => acc + e.value, 0);

export const getNetRevenue = () => {
  const recurring = getTotalRecurringRevenue();
  const totalExpenses = getTotalExpenses();
  return recurring - totalExpenses;
};

export const getPartnerShare = (partnerName: string) => {
  const netRevenue = getNetRevenue();
  const partner = partnerDistribution.find(p => p.name === partnerName);
  return partner ? netRevenue * (partner.percentage / 100) : 0;
};
