CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: demand_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.demand_status AS ENUM (
    'backlog',
    'todo',
    'in_progress',
    'review',
    'done',
    'cancelled'
);


--
-- Name: goal_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.goal_category AS ENUM (
    'financeiro',
    'clientes',
    'producao',
    'comercial'
);


--
-- Name: goal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.goal_status AS ENUM (
    'em_andamento',
    'atingida',
    'nao_atingida'
);


--
-- Name: goal_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.goal_type AS ENUM (
    'anual',
    'trimestral',
    'mensal'
);


--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: lead_temperature; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_temperature AS ENUM (
    'cold',
    'warm',
    'hot'
);


--
-- Name: planning_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.planning_status AS ENUM (
    'rascunho',
    'aguardando_aprovacao',
    'aprovado',
    'em_execucao',
    'concluido'
);


--
-- Name: priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: user_role_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_type AS ENUM (
    'gestao',
    'producao',
    'cliente'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  -- Auto-assign admin role and gestao role_type to first users
  INSERT INTO public.user_roles (user_id, role, role_type)
  VALUES (NEW.id, 'admin', 'gestao');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: has_role_type(uuid, public.user_role_type); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role_type(_user_id uuid, _role public.user_role_type) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role_type = _role
  )
$$;


--
-- Name: is_authenticated(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_authenticated() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT auth.uid() IS NOT NULL
$$;


--
-- Name: is_gestao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_gestao() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (role_type = 'gestao' OR role = 'admin')
  )
$$;


--
-- Name: is_producao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_producao() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role_type = 'producao'
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: archived_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.archived_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_type text NOT NULL,
    original_id uuid NOT NULL,
    original_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    archived_by uuid,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    restored_at timestamp with time zone,
    permanently_deleted_at timestamp with time zone,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: available_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.available_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    base_price numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    service_id uuid NOT NULL,
    custom_price numeric,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false,
    client_user_id uuid,
    client_temp_password text
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    type text NOT NULL,
    value numeric(10,2) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status text DEFAULT 'active'::text,
    file_url text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);


--
-- Name: demands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    client_id uuid NOT NULL,
    assigned_to uuid,
    status public.demand_status DEFAULT 'backlog'::public.demand_status NOT NULL,
    priority public.priority DEFAULT 'medium'::public.priority NOT NULL,
    deadline date,
    estimated_hours numeric(5,2),
    actual_hours numeric(5,2),
    tags text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    value numeric(10,2) NOT NULL,
    date date NOT NULL,
    recurring boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    type public.goal_type NOT NULL,
    category public.goal_category NOT NULL,
    target_value numeric(12,2) NOT NULL,
    current_value numeric(12,2) DEFAULT 0,
    unit text NOT NULL,
    deadline date,
    status public.goal_status DEFAULT 'em_andamento'::public.goal_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);


--
-- Name: key_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    goal_id uuid NOT NULL,
    title text NOT NULL,
    target_value numeric(12,2) NOT NULL,
    current_value numeric(12,2) DEFAULT 0,
    unit text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    responsible_id uuid,
    notes text,
    converted_to_client_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);


--
-- Name: planning_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    planning_id uuid NOT NULL,
    name text NOT NULL,
    objective text,
    budget numeric(10,2) DEFAULT 0,
    start_date date,
    end_date date,
    platforms text[],
    status text DEFAULT 'planejada'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: planning_contents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning_contents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    planning_id uuid NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    platform text,
    scheduled_date date,
    status text DEFAULT 'pendente'::text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    send_to_production boolean DEFAULT false,
    demand_id uuid
);


--
-- Name: plannings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plannings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    status public.planning_status DEFAULT 'rascunho'::public.planning_status NOT NULL,
    objectives text[],
    observations text,
    share_token text DEFAULT (gen_random_uuid())::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    drive_link text,
    is_archived boolean DEFAULT false,
    CONSTRAINT plannings_month_check CHECK (((month >= 1) AND (month <= 12)))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    name text NOT NULL,
    value numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text,
    delivery_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    monthly_value numeric(10,2) NOT NULL,
    status text DEFAULT 'active'::text,
    start_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    role text NOT NULL,
    email text NOT NULL,
    avatar text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role_type public.user_role_type DEFAULT 'producao'::public.user_role_type
);


--
-- Name: archived_items archived_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archived_items
    ADD CONSTRAINT archived_items_pkey PRIMARY KEY (id);


--
-- Name: available_services available_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.available_services
    ADD CONSTRAINT available_services_pkey PRIMARY KEY (id);


--
-- Name: client_services client_services_client_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_client_id_service_id_key UNIQUE (client_id, service_id);


--
-- Name: client_services client_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: demands demands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: key_results key_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_results
    ADD CONSTRAINT key_results_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: planning_campaigns planning_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_campaigns
    ADD CONSTRAINT planning_campaigns_pkey PRIMARY KEY (id);


--
-- Name: planning_contents planning_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_contents
    ADD CONSTRAINT planning_contents_pkey PRIMARY KEY (id);


--
-- Name: plannings plannings_client_id_month_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_client_id_month_year_key UNIQUE (client_id, month, year);


--
-- Name: plannings plannings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_pkey PRIMARY KEY (id);


--
-- Name: plannings plannings_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_share_token_key UNIQUE (share_token);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_archived_items_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_archived_items_archived_at ON public.archived_items USING btree (archived_at DESC);


--
-- Name: idx_archived_items_item_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_archived_items_item_type ON public.archived_items USING btree (item_type);


--
-- Name: idx_archived_items_original_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_archived_items_original_id ON public.archived_items USING btree (original_id);


--
-- Name: archived_items update_archived_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_archived_items_updated_at BEFORE UPDATE ON public.archived_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: available_services update_available_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_available_services_updated_at BEFORE UPDATE ON public.available_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_services update_client_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_services_updated_at BEFORE UPDATE ON public.client_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contracts update_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: demands update_demands_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_demands_updated_at BEFORE UPDATE ON public.demands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expenses update_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: goals update_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: key_results update_key_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON public.key_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: planning_campaigns update_planning_campaigns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_planning_campaigns_updated_at BEFORE UPDATE ON public.planning_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: planning_contents update_planning_contents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_planning_contents_updated_at BEFORE UPDATE ON public.planning_contents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: plannings update_plannings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_plannings_updated_at BEFORE UPDATE ON public.plannings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: team_members update_team_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_services client_services_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_services client_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.available_services(id) ON DELETE CASCADE;


--
-- Name: clients clients_responsible_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.team_members(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: demands demands_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.team_members(id) ON DELETE SET NULL;


--
-- Name: demands demands_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: key_results key_results_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_results
    ADD CONSTRAINT key_results_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: leads leads_converted_to_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_converted_to_client_id_fkey FOREIGN KEY (converted_to_client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: leads leads_responsible_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.team_members(id) ON DELETE SET NULL;


--
-- Name: planning_campaigns planning_campaigns_planning_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_campaigns
    ADD CONSTRAINT planning_campaigns_planning_id_fkey FOREIGN KEY (planning_id) REFERENCES public.plannings(id) ON DELETE CASCADE;


--
-- Name: planning_contents planning_contents_demand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_contents
    ADD CONSTRAINT planning_contents_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES public.demands(id);


--
-- Name: planning_contents planning_contents_planning_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_contents
    ADD CONSTRAINT planning_contents_planning_id_fkey FOREIGN KEY (planning_id) REFERENCES public.plannings(id) ON DELETE CASCADE;


--
-- Name: plannings plannings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: products products_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: services services_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: archived_items Authenticated users can manage archived_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage archived_items" ON public.archived_items USING (public.is_authenticated());


--
-- Name: available_services Authenticated users can manage available_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage available_services" ON public.available_services USING (public.is_authenticated());


--
-- Name: client_services Authenticated users can manage client_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage client_services" ON public.client_services USING (public.is_authenticated());


--
-- Name: clients Authenticated users can manage clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage clients" ON public.clients USING (public.is_authenticated());


--
-- Name: contracts Authenticated users can manage contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage contracts" ON public.contracts USING (public.is_authenticated());


--
-- Name: demands Authenticated users can manage demands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage demands" ON public.demands USING (public.is_authenticated());


--
-- Name: expenses Authenticated users can manage expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage expenses" ON public.expenses USING (public.is_authenticated());


--
-- Name: goals Authenticated users can manage goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage goals" ON public.goals USING (public.is_authenticated());


--
-- Name: key_results Authenticated users can manage key_results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage key_results" ON public.key_results USING (public.is_authenticated());


--
-- Name: leads Authenticated users can manage leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage leads" ON public.leads USING (public.is_authenticated());


--
-- Name: planning_campaigns Authenticated users can manage planning_campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage planning_campaigns" ON public.planning_campaigns USING (public.is_authenticated());


--
-- Name: planning_contents Authenticated users can manage planning_contents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage planning_contents" ON public.planning_contents USING (public.is_authenticated());


--
-- Name: plannings Authenticated users can manage plannings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage plannings" ON public.plannings USING (public.is_authenticated());


--
-- Name: products Authenticated users can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage products" ON public.products USING (public.is_authenticated());


--
-- Name: services Authenticated users can manage services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage services" ON public.services USING (public.is_authenticated());


--
-- Name: team_members Authenticated users can manage team_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage team_members" ON public.team_members USING (public.is_authenticated());


--
-- Name: archived_items Authenticated users can view archived_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view archived_items" ON public.archived_items FOR SELECT USING (public.is_authenticated());


--
-- Name: available_services Authenticated users can view available_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view available_services" ON public.available_services FOR SELECT USING (public.is_authenticated());


--
-- Name: client_services Authenticated users can view client_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view client_services" ON public.client_services FOR SELECT USING (public.is_authenticated());


--
-- Name: clients Authenticated users can view clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT USING (public.is_authenticated());


--
-- Name: contracts Authenticated users can view contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view contracts" ON public.contracts FOR SELECT USING (public.is_authenticated());


--
-- Name: demands Authenticated users can view demands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view demands" ON public.demands FOR SELECT USING (public.is_authenticated());


--
-- Name: expenses Authenticated users can view expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view expenses" ON public.expenses FOR SELECT USING (public.is_authenticated());


--
-- Name: goals Authenticated users can view goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view goals" ON public.goals FOR SELECT USING (public.is_authenticated());


--
-- Name: key_results Authenticated users can view key_results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view key_results" ON public.key_results FOR SELECT USING (public.is_authenticated());


--
-- Name: leads Authenticated users can view leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT USING (public.is_authenticated());


--
-- Name: planning_campaigns Authenticated users can view planning_campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view planning_campaigns" ON public.planning_campaigns FOR SELECT USING (public.is_authenticated());


--
-- Name: planning_contents Authenticated users can view planning_contents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view planning_contents" ON public.planning_contents FOR SELECT USING (public.is_authenticated());


--
-- Name: plannings Authenticated users can view plannings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view plannings" ON public.plannings FOR SELECT USING (public.is_authenticated());


--
-- Name: products Authenticated users can view products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT USING (public.is_authenticated());


--
-- Name: services Authenticated users can view services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view services" ON public.services FOR SELECT USING (public.is_authenticated());


--
-- Name: team_members Authenticated users can view team_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view team_members" ON public.team_members FOR SELECT USING (public.is_authenticated());


--
-- Name: planning_campaigns Public can view planning_campaigns by planning share; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view planning_campaigns by planning share" ON public.planning_campaigns FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.plannings
  WHERE ((plannings.id = planning_campaigns.planning_id) AND (plannings.share_token IS NOT NULL)))));


--
-- Name: planning_contents Public can view planning_contents by planning share; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view planning_contents by planning share" ON public.planning_contents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.plannings
  WHERE ((plannings.id = planning_contents.planning_id) AND (plannings.share_token IS NOT NULL)))));


--
-- Name: plannings Public can view plannings by share_token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view plannings by share_token" ON public.plannings FOR SELECT USING ((share_token IS NOT NULL));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: archived_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;

--
-- Name: available_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.available_services ENABLE ROW LEVEL SECURITY;

--
-- Name: client_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: demands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

--
-- Name: key_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: planning_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planning_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: planning_contents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planning_contents ENABLE ROW LEVEL SECURITY;

--
-- Name: plannings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plannings ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;