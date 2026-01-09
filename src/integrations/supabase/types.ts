export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      archived_items: {
        Row: {
          archived_at: string
          archived_by: string | null
          created_at: string
          deleted_by: string | null
          id: string
          item_type: string
          original_data: Json
          original_id: string
          permanently_deleted_at: string | null
          restored_at: string | null
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          deleted_by?: string | null
          id?: string
          item_type: string
          original_data?: Json
          original_id: string
          permanently_deleted_at?: string | null
          restored_at?: string | null
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          deleted_by?: string | null
          id?: string
          item_type?: string
          original_data?: Json
          original_id?: string
          permanently_deleted_at?: string | null
          restored_at?: string | null
        }
        Relationships: []
      }
      available_services: {
        Row: {
          base_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_services: {
        Row: {
          client_id: string
          created_at: string
          custom_price: number | null
          end_date: string | null
          id: string
          service_id: string
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          custom_price?: number | null
          end_date?: string | null
          id?: string
          service_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          custom_price?: number | null
          end_date?: string | null
          id?: string
          service_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "available_services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          client_temp_password: string | null
          client_user_id: string | null
          cnpj: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_end: string | null
          contract_start: string | null
          contract_type: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          monthly_value: number | null
          name: string
          notes: string | null
          plan: string | null
          responsible_id: string | null
          state: string | null
          status: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_temp_password?: string | null
          client_user_id?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_type?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          monthly_value?: number | null
          name: string
          notes?: string | null
          plan?: string | null
          responsible_id?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_temp_password?: string | null
          client_user_id?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_type?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          monthly_value?: number | null
          name?: string
          notes?: string | null
          plan?: string | null
          responsible_id?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          service_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          service_type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          file_url: string | null
          id: string
          is_archived: boolean | null
          notes: string | null
          start_date: string
          status: string | null
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          file_url?: string | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          start_date: string
          status?: string | null
          type: string
          updated_at?: string
          value: number
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          file_url?: string | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          start_date?: string
          status?: string | null
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
          visible_widgets: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
          visible_widgets?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
          visible_widgets?: string[] | null
        }
        Relationships: []
      }
      demands: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          client_id: string
          created_at: string
          deadline: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          is_archived: boolean | null
          priority: Database["public"]["Enums"]["priority"]
          status: Database["public"]["Enums"]["demand_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          client_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_archived?: boolean | null
          priority?: Database["public"]["Enums"]["priority"]
          status?: Database["public"]["Enums"]["demand_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          client_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_archived?: boolean | null
          priority?: Database["public"]["Enums"]["priority"]
          status?: Database["public"]["Enums"]["demand_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          category: string
          created_at: string
          date: string
          description: string
          id: string
          is_archived: boolean | null
          notes: string | null
          recurring: boolean | null
          updated_at: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          recurring?: boolean | null
          updated_at?: string
          value: number
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          recurring?: boolean | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: Database["public"]["Enums"]["goal_category"]
          created_at: string
          current_value: number | null
          deadline: string | null
          id: string
          is_archived: boolean | null
          status: Database["public"]["Enums"]["goal_status"]
          target_value: number
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          unit: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["goal_category"]
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          id?: string
          is_archived?: boolean | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_value: number
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          unit: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["goal_category"]
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          id?: string
          is_archived?: boolean | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number
          title?: string
          type?: Database["public"]["Enums"]["goal_type"]
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      key_results: {
        Row: {
          created_at: string
          current_value: number | null
          goal_id: string
          id: string
          target_value: number
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          goal_id: string
          id?: string
          target_value: number
          title: string
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          goal_id?: string
          id?: string
          target_value?: number
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
          reminder_at: string | null
          scheduled_at: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
          reminder_at?: string | null
          scheduled_at?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          reminder_at?: string | null
          scheduled_at?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history: {
        Row: {
          action_type: string
          contact_channel: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
        }
        Insert: {
          action_type: string
          contact_channel?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          action_type?: string
          contact_channel?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_loss_reasons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          authority: string | null
          awareness_level: string | null
          city: string | null
          closing_probability: number | null
          company: string | null
          contact_channel: string | null
          contract_type: string | null
          converted_to_client_id: string | null
          created_at: string
          cross_sell_possible: boolean | null
          cross_sell_services: string[] | null
          current_investment: number | null
          digital_maturity: string | null
          email: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          instagram: string | null
          invests_in_marketing: boolean | null
          is_archived: boolean | null
          is_recurring_client: boolean | null
          lead_score: number | null
          loss_reason: string | null
          ltv_potential: string | null
          main_pain: string | null
          name: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          origin: string | null
          phone: string | null
          referred_by: string | null
          responsible_id: string | null
          segment: string | null
          service_interest: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          temperature: Database["public"]["Enums"]["lead_temperature"]
          ticket_level: string | null
          updated_at: string
          urgency: string | null
          utm_source: string | null
          whatsapp: string | null
        }
        Insert: {
          authority?: string | null
          awareness_level?: string | null
          city?: string | null
          closing_probability?: number | null
          company?: string | null
          contact_channel?: string | null
          contract_type?: string | null
          converted_to_client_id?: string | null
          created_at?: string
          cross_sell_possible?: boolean | null
          cross_sell_services?: string[] | null
          current_investment?: number | null
          digital_maturity?: string | null
          email?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          instagram?: string | null
          invests_in_marketing?: boolean | null
          is_archived?: boolean | null
          is_recurring_client?: boolean | null
          lead_score?: number | null
          loss_reason?: string | null
          ltv_potential?: string | null
          main_pain?: string | null
          name: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          origin?: string | null
          phone?: string | null
          referred_by?: string | null
          responsible_id?: string | null
          segment?: string | null
          service_interest?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          ticket_level?: string | null
          updated_at?: string
          urgency?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Update: {
          authority?: string | null
          awareness_level?: string | null
          city?: string | null
          closing_probability?: number | null
          company?: string | null
          contact_channel?: string | null
          contract_type?: string | null
          converted_to_client_id?: string | null
          created_at?: string
          cross_sell_possible?: boolean | null
          cross_sell_services?: string[] | null
          current_investment?: number | null
          digital_maturity?: string | null
          email?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          instagram?: string | null
          invests_in_marketing?: boolean | null
          is_archived?: boolean | null
          is_recurring_client?: boolean | null
          lead_score?: number | null
          loss_reason?: string | null
          ltv_potential?: string | null
          main_pain?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          origin?: string | null
          phone?: string | null
          referred_by?: string | null
          responsible_id?: string | null
          segment?: string | null
          service_interest?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          ticket_level?: string | null
          updated_at?: string
          urgency?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_to_client_id_fkey"
            columns: ["converted_to_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_campaigns: {
        Row: {
          budget: number | null
          created_at: string
          end_date: string | null
          id: string
          name: string
          objective: string | null
          planning_id: string
          platforms: string[] | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          objective?: string | null
          planning_id: string
          platforms?: string[] | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          objective?: string | null
          planning_id?: string
          platforms?: string[] | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_campaigns_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "plannings"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_contents: {
        Row: {
          created_at: string
          demand_id: string | null
          description: string | null
          id: string
          planning_id: string
          platform: string | null
          scheduled_date: string | null
          send_to_production: boolean | null
          status: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          demand_id?: string | null
          description?: string | null
          id?: string
          planning_id: string
          platform?: string | null
          scheduled_date?: string | null
          send_to_production?: boolean | null
          status?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          demand_id?: string | null
          description?: string | null
          id?: string
          planning_id?: string
          platform?: string | null
          scheduled_date?: string | null
          send_to_production?: boolean | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_contents_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_contents_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "plannings"
            referencedColumns: ["id"]
          },
        ]
      }
      plannings: {
        Row: {
          client_id: string
          created_at: string
          drive_link: string | null
          id: string
          is_archived: boolean | null
          month: number
          objectives: string[] | null
          observations: string | null
          share_token: string | null
          status: Database["public"]["Enums"]["planning_status"]
          updated_at: string
          year: number
        }
        Insert: {
          client_id: string
          created_at?: string
          drive_link?: string | null
          id?: string
          is_archived?: boolean | null
          month: number
          objectives?: string[] | null
          observations?: string | null
          share_token?: string | null
          status?: Database["public"]["Enums"]["planning_status"]
          updated_at?: string
          year: number
        }
        Update: {
          client_id?: string
          created_at?: string
          drive_link?: string | null
          id?: string
          is_archived?: boolean | null
          month?: number
          objectives?: string[] | null
          observations?: string | null
          share_token?: string | null
          status?: Database["public"]["Enums"]["planning_status"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "plannings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          client_id: string | null
          created_at: string
          delivery_date: string | null
          id: string
          is_archived: boolean | null
          name: string
          notes: string | null
          status: string | null
          updated_at: string
          value: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_archived: boolean | null
          monthly_value: number
          name: string
          notes: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          monthly_value: number
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          monthly_value?: number
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          is_archived: boolean | null
          name: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id?: string
          is_archived?: boolean | null
          name: string
          role: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          is_archived?: boolean | null
          name?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_type: Database["public"]["Enums"]["user_role_type"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_type?: Database["public"]["Enums"]["user_role_type"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_type?: Database["public"]["Enums"]["user_role_type"] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_type: {
        Args: {
          _role: Database["public"]["Enums"]["user_role_type"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
      is_gestao: { Args: never; Returns: boolean }
      is_producao: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      demand_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "review"
        | "done"
        | "cancelled"
      goal_category: "financeiro" | "clientes" | "producao" | "comercial"
      goal_status: "em_andamento" | "atingida" | "nao_atingida"
      goal_type: "anual" | "trimestral" | "mensal"
      lead_status:
        | "novo"
        | "contato_inicial"
        | "reuniao_agendada"
        | "proposta_enviada"
        | "negociacao"
        | "fechamento"
        | "perdido"
        | "lead_frio"
        | "em_contato"
        | "em_qualificacao"
      lead_temperature: "cold" | "warm" | "hot"
      planning_status:
        | "rascunho"
        | "aguardando_aprovacao"
        | "aprovado"
        | "em_execucao"
        | "concluido"
      priority: "low" | "medium" | "high" | "urgent"
      user_role_type: "gestao" | "producao" | "cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      demand_status: [
        "backlog",
        "todo",
        "in_progress",
        "review",
        "done",
        "cancelled",
      ],
      goal_category: ["financeiro", "clientes", "producao", "comercial"],
      goal_status: ["em_andamento", "atingida", "nao_atingida"],
      goal_type: ["anual", "trimestral", "mensal"],
      lead_status: [
        "novo",
        "contato_inicial",
        "reuniao_agendada",
        "proposta_enviada",
        "negociacao",
        "fechamento",
        "perdido",
        "lead_frio",
        "em_contato",
        "em_qualificacao",
      ],
      lead_temperature: ["cold", "warm", "hot"],
      planning_status: [
        "rascunho",
        "aguardando_aprovacao",
        "aprovado",
        "em_execucao",
        "concluido",
      ],
      priority: ["low", "medium", "high", "urgent"],
      user_role_type: ["gestao", "producao", "cliente"],
    },
  },
} as const
