-- ============================================================
-- MÓDULO COMERCIAL - SQL COMPLETO PARA REPLICAÇÃO
-- Gerado em: 2026-01-10
-- Projeto: Growth Marks CRM
-- ============================================================

-- ============================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ============================================================
-- 2. ENUMS
-- ============================================================

-- Status do lead no pipeline
CREATE TYPE public.lead_status AS ENUM (
    'novo',
    'contato_inicial',
    'reuniao_agendada',
    'proposta_enviada',
    'negociacao',
    'fechamento',
    'perdido',
    'lead_frio',
    'em_contato',
    'em_qualificacao'
);

-- Temperatura do lead
CREATE TYPE public.lead_temperature AS ENUM (
    'cold',
    'warm',
    'hot'
);

-- Roles do sistema (necessário para RLS)
CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);

-- Tipos de role de usuário
CREATE TYPE public.user_role_type AS ENUM (
    'gestao',
    'producao',
    'cliente',
    'vendedor'
);

-- ============================================================
-- 3. FUNÇÕES AUXILIARES
-- ============================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função para verificar se usuário está autenticado
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Função para verificar se usuário é gestor
CREATE OR REPLACE FUNCTION public.is_gestao()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (role_type = 'gestao' OR role = 'admin')
  )
$$;

-- Função para verificar role type
CREATE OR REPLACE FUNCTION public.has_role_type(_user_id uuid, _role public.user_role_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role_type = _role
  )
$$;

-- ============================================================
-- 4. TABELAS DE SUPORTE
-- ============================================================

-- Tabela de clientes (para conversão de leads)
CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    contact_name text,
    contact_email text,
    contact_phone text,
    plan text,
    monthly_value numeric(10,2) DEFAULT 0,
    status text DEFAULT 'active'::text,
    contract_type text,
    contract_start date,
    contract_end date,
    responsible_id uuid,
    notes text,
    cnpj text,
    address text,
    city text,
    state text,
    zip_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);

-- Tabela de membros da equipe (responsáveis)
CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid,
    name text NOT NULL,
    role text NOT NULL,
    email text NOT NULL,
    avatar text,
    is_approved boolean DEFAULT false,
    approved_by uuid,
    approved_at timestamp with time zone,
    pending_role_type public.user_role_type,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);

-- Tabela de roles de usuário
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    role_type public.user_role_type DEFAULT 'producao'::public.user_role_type,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, role)
);

-- Tabela de perfis
CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    full_name text NOT NULL,
    email text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- 5. FUNIS DE VENDAS
-- ============================================================

CREATE TABLE public.sales_funnels (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    color text DEFAULT '#f97316',
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    position integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.sales_funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sales_funnels"
ON public.sales_funnels FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage sales_funnels"
ON public.sales_funnels FOR ALL
USING (is_authenticated());

-- Trigger updated_at
CREATE TRIGGER update_sales_funnels_updated_at
BEFORE UPDATE ON public.sales_funnels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Funil padrão
INSERT INTO public.sales_funnels (name, description, color, is_default, position)
VALUES ('Serviços', 'Funil padrão para prospecção de serviços', '#f97316', true, 0);

-- ============================================================
-- 6. LEADS
-- ============================================================

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    company text,
    email text,
    phone text,
    service_interest text,
    estimated_value numeric(10,2) DEFAULT 0,
    origin text,
    status public.lead_status DEFAULT 'novo'::public.lead_status NOT NULL,
    temperature public.lead_temperature DEFAULT 'cold'::public.lead_temperature NOT NULL,
    next_action text,
    next_action_date date,
    responsible_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
    notes text,
    converted_to_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    funnel_id uuid REFERENCES public.sales_funnels(id) ON DELETE SET NULL,
    
    -- Campos de localização
    city text,
    state text,
    
    -- Campos de contato social
    instagram text,
    whatsapp text,
    
    -- Campos de qualificação BANT
    invests_in_marketing boolean DEFAULT false,
    current_investment numeric DEFAULT 0,
    main_pain text,
    urgency text DEFAULT 'media',
    awareness_level text DEFAULT 'nao_sabe',
    authority text DEFAULT 'decisor',
    contact_channel text DEFAULT 'whatsapp',
    
    -- Campos de segmentação
    segment text,
    digital_maturity text DEFAULT 'iniciante',
    ltv_potential text DEFAULT 'medio',
    is_recurring_client boolean DEFAULT false,
    cross_sell_possible boolean DEFAULT false,
    cross_sell_services text[],
    
    -- Campos de tracking
    referred_by text,
    tags text[],
    utm_source text,
    
    -- Campos de scoring e probabilidade
    lead_score integer DEFAULT 0,
    closing_probability integer DEFAULT 0,
    expected_close_date date,
    loss_reason text,
    
    -- Campos comerciais
    ticket_level text DEFAULT 'medio',
    contract_type text DEFAULT 'mensal',
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_funnel_id ON public.leads(funnel_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_responsible_id ON public.leads(responsible_id);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leads"
ON public.leads FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage leads"
ON public.leads FOR ALL
USING (is_authenticated());

-- Trigger updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. ATIVIDADES DE LEADS
-- ============================================================

CREATE TABLE public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type text NOT NULL DEFAULT 'tarefa', -- ligacao, email, reuniao, whatsapp, tarefa
    title text NOT NULL,
    description text,
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    reminder_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);

-- RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead_activities"
ON public.lead_activities FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage lead_activities"
ON public.lead_activities FOR ALL
USING (is_authenticated());

-- Trigger updated_at
CREATE TRIGGER update_lead_activities_updated_at
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. HISTÓRICO DE LEADS
-- ============================================================

CREATE TABLE public.lead_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    description text,
    contact_channel text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON public.lead_history(lead_id);

-- RLS
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead_history"
ON public.lead_history FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage lead_history"
ON public.lead_history FOR ALL
USING (is_authenticated());

-- ============================================================
-- 9. MOTIVOS DE PERDA
-- ============================================================

CREATE TABLE public.lead_loss_reasons (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.lead_loss_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead_loss_reasons"
ON public.lead_loss_reasons FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage lead_loss_reasons"
ON public.lead_loss_reasons FOR ALL
USING (is_authenticated());

-- Trigger updated_at
CREATE TRIGGER update_lead_loss_reasons_updated_at
BEFORE UPDATE ON public.lead_loss_reasons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Dados padrão
INSERT INTO public.lead_loss_reasons (name, description) VALUES
    ('Preço', 'O lead considerou o preço muito alto'),
    ('Concorrência', 'O lead optou por um concorrente'),
    ('Timing', 'Não é o momento certo para o lead'),
    ('Sem resposta', 'O lead parou de responder'),
    ('Desistiu', 'O lead desistiu do projeto'),
    ('Fora do perfil', 'O lead não se encaixa no perfil ideal'),
    ('Outro', 'Outro motivo não listado');

-- ============================================================
-- 10. PROSPECTS (BASE DE PROSPECÇÃO)
-- ============================================================

CREATE TABLE public.prospects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    cnpj text,
    segment text,
    cnae_code text,
    cnae_description text,
    company_size text, -- MEI, ME, EPP, Medio, Grande
    city text,
    state text,
    neighborhood text,
    zip_code text,
    has_website boolean DEFAULT false,
    website_url text,
    has_phone boolean DEFAULT false,
    has_email boolean DEFAULT false,
    emails text[] DEFAULT '{}',
    phones text[] DEFAULT '{}',
    emails_count integer DEFAULT 0,
    phones_count integer DEFAULT 0,
    data_revealed boolean DEFAULT false,
    revealed_at timestamp with time zone,
    social_links jsonb DEFAULT '{}',
    status text DEFAULT 'novo',
    tags text[] DEFAULT '{}',
    source text DEFAULT 'manual',
    cnpj_situacao text,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prospects_cnpj ON public.prospects(cnpj);
CREATE INDEX IF NOT EXISTS idx_prospects_cnpj_situacao ON public.prospects(cnpj_situacao);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_state ON public.prospects(state);
CREATE INDEX IF NOT EXISTS idx_prospects_city ON public.prospects(city);

-- RLS
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prospects"
ON public.prospects FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can insert prospects"
ON public.prospects FOR INSERT
WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated users can update prospects"
ON public.prospects FOR UPDATE
USING (is_authenticated());

CREATE POLICY "Authenticated users can delete prospects"
ON public.prospects FOR DELETE
USING (is_authenticated());

-- Trigger updated_at
CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 11. LISTAS DE PROSPECTS
-- ============================================================

CREATE TABLE public.prospect_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.prospect_list_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    list_id uuid REFERENCES public.prospect_lists(id) ON DELETE CASCADE,
    prospect_id uuid REFERENCES public.prospects(id) ON DELETE CASCADE,
    added_at timestamp with time zone DEFAULT now(),
    UNIQUE(list_id, prospect_id)
);

-- RLS
ALTER TABLE public.prospect_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prospect_lists"
ON public.prospect_lists FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage prospect_lists"
ON public.prospect_lists FOR ALL
USING (is_authenticated());

CREATE POLICY "Authenticated users can view prospect_list_items"
ON public.prospect_list_items FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage prospect_list_items"
ON public.prospect_list_items FOR ALL
USING (is_authenticated());

-- Trigger updated_at
CREATE TRIGGER update_prospect_lists_updated_at
BEFORE UPDATE ON public.prospect_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 12. BUSCAS SALVAS
-- ============================================================

CREATE TABLE public.saved_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    filters jsonb NOT NULL DEFAULT '{}',
    results_count integer DEFAULT 0,
    search_type text DEFAULT 'prospeccao',
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view saved_searches"
ON public.saved_searches FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage saved_searches"
ON public.saved_searches FOR ALL
USING (is_authenticated());

-- Trigger updated_at
CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 13. CACHE DE CNPJ
-- ============================================================

CREATE TABLE public.cnpj_cache (
    cnpj text NOT NULL PRIMARY KEY,
    data jsonb NOT NULL,
    source text NOT NULL DEFAULT 'brasilapi',
    situacao text,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + INTERVAL '7 days') NOT NULL,
    hit_count integer DEFAULT 0 NOT NULL,
    last_accessed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_cnpj_cache_expires_at ON public.cnpj_cache(expires_at);
CREATE INDEX idx_cnpj_cache_situacao ON public.cnpj_cache(situacao);

-- Comentário
COMMENT ON TABLE public.cnpj_cache IS 'Cache para consultas de CNPJ para reduzir chamadas à API externa';

-- RLS
ALTER TABLE public.cnpj_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cnpj cache"
ON public.cnpj_cache FOR SELECT
USING (true);

CREATE POLICY "Service role can manage cnpj cache"
ON public.cnpj_cache FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION public.cleanup_expired_cnpj_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.cnpj_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Função para incrementar contador de acesso ao cache
CREATE OR REPLACE FUNCTION public.touch_cnpj_cache(p_cnpj TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.cnpj_cache 
  SET 
    hit_count = hit_count + 1,
    last_accessed_at = now()
  WHERE cnpj = p_cnpj;
END;
$$;

-- ============================================================
-- 14. CONFIGURAÇÕES DO CRM
-- ============================================================

CREATE TABLE public.crm_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    setting_key text NOT NULL UNIQUE,
    setting_value jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view crm_settings"
ON public.crm_settings FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage crm_settings"
ON public.crm_settings FOR ALL
USING (is_authenticated());

-- Trigger updated_at
CREATE TRIGGER update_crm_settings_updated_at
BEFORE UPDATE ON public.crm_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Configurações padrão
INSERT INTO public.crm_settings (setting_key, setting_value) VALUES 
    ('lead_origins', '["instagram", "whatsapp", "site", "indicacao", "trafego_pago", "prospeccao_ativa", "google", "linkedin", "outro"]'),
    ('services_interest', '["gestao_trafego", "social_media", "site_landing_page", "branding", "crm_automacao"]'),
    ('pipeline_statuses', '["novo", "contato_inicial", "em_qualificacao", "reuniao_agendada", "proposta_enviada", "negociacao", "fechamento", "perdido", "lead_frio"]'),
    ('lead_score_weights', '{"temperature": 30, "urgency": 25, "authority": 20, "investment": 15, "interactions": 10}'),
    ('segments', '["educacao", "estetica", "automotivo", "logistica", "servicos", "saude", "varejo", "tecnologia", "outro"]'),
    ('loss_reasons', '["preco", "sem_prioridade", "nao_respondeu", "fechou_com_concorrente", "nao_qualificado", "outro"]')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- 15. RLS PARA TABELAS DE SUPORTE
-- ============================================================

-- Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
ON public.clients FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage clients"
ON public.clients FOR ALL
USING (is_authenticated());

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Team Members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view team_members"
ON public.team_members FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage team_members"
ON public.team_members FOR ALL
USING (is_authenticated());

CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Gestao can view all user_roles"
ON public.user_roles FOR SELECT
USING (is_gestao());

CREATE POLICY "Gestao can manage user_roles"
ON public.user_roles FOR ALL
USING (is_gestao());

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Gestao can view all profiles"
ON public.profiles FOR SELECT
USING (is_gestao());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 16. FOREIGN KEYS ADICIONAIS
-- ============================================================

ALTER TABLE public.clients 
ADD CONSTRAINT clients_responsible_id_fkey 
FOREIGN KEY (responsible_id) REFERENCES public.team_members(id) ON DELETE SET NULL;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ============================================================
--
-- 1. HOOKS REACT NECESSÁRIOS:
--    - useLeads.ts
--    - useSalesFunnels.ts
--    - useLeadActivities.ts
--    - useLeadHistory.ts
--    - useProspects.ts
--    - useSavedSearches.ts
--    - useCompanySearch.ts
--    - useLeadScore.ts
--    - useLossReasons.ts
--    - useCRMSettings.ts
--
-- 2. EDGE FUNCTIONS:
--    - search-companies (busca internet via Firecrawl)
--    - pull-cnpjs (puxada em massa de CNPJs)
--    - enrich-company (enriquecimento de dados)
--
-- 3. CONFIGURAÇÃO ICP (src/config/icp.ts):
--    export const icpConfig = {
--      targetSegments: ['educacao', 'estetica', 'automotivo'],
--      preferredSizes: ['ME', 'EPP'],
--      targetStates: ['SP', 'RJ', 'MG'],
--      minTicket: 2000,
--      toneOfVoice: 'profissional'
--    };
--
-- 4. SECRETS NECESSÁRIAS:
--    - FIRECRAWL_API_KEY (para busca na internet)
--
-- ============================================================
