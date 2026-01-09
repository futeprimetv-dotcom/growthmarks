import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface LogActivityParams {
  action_type: "create" | "update" | "delete" | "archive" | "restore" | "view";
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return; // Don't log if no user is authenticated
    
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action_type: params.action_type,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      entity_name: params.entity_name,
      description: params.description,
      metadata: (params.metadata || {}) as Json,
    });
  } catch (error) {
    // Silently fail - don't interrupt the main operation
    console.error("Failed to log activity:", error);
  }
}

// Helper functions for common entity types
export const logClientActivity = (
  action: LogActivityParams["action_type"],
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) => logActivity({
  action_type: action,
  entity_type: "client",
  entity_id: entityId,
  entity_name: entityName,
  description: getDescription(action, "cliente", entityName),
  metadata,
});

export const logLeadActivity = (
  action: LogActivityParams["action_type"],
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) => logActivity({
  action_type: action,
  entity_type: "lead",
  entity_id: entityId,
  entity_name: entityName,
  description: getDescription(action, "lead", entityName),
  metadata,
});

export const logDemandActivity = (
  action: LogActivityParams["action_type"],
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) => logActivity({
  action_type: action,
  entity_type: "demand",
  entity_id: entityId,
  entity_name: entityName,
  description: getDescription(action, "demanda", entityName),
  metadata,
});

export const logContractActivity = (
  action: LogActivityParams["action_type"],
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) => logActivity({
  action_type: action,
  entity_type: "contract",
  entity_id: entityId,
  entity_name: entityName,
  description: getDescription(action, "contrato", entityName),
  metadata,
});

export const logTeamMemberActivity = (
  action: LogActivityParams["action_type"],
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) => logActivity({
  action_type: action,
  entity_type: "team_member",
  entity_id: entityId,
  entity_name: entityName,
  description: getDescription(action, "membro da equipe", entityName),
  metadata,
});

export const logExpenseActivity = (
  action: LogActivityParams["action_type"],
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) => logActivity({
  action_type: action,
  entity_type: "expense",
  entity_id: entityId,
  entity_name: entityName,
  description: getDescription(action, "despesa", entityName),
  metadata,
});

export const logProductActivity = (
  action: LogActivityParams["action_type"],
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) => logActivity({
  action_type: action,
  entity_type: "product",
  entity_id: entityId,
  entity_name: entityName,
  description: getDescription(action, "produto", entityName),
  metadata,
});

export const logServiceActivity = (
  action: LogActivityParams["action_type"],
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) => logActivity({
  action_type: action,
  entity_type: "service",
  entity_id: entityId,
  entity_name: entityName,
  description: getDescription(action, "serviço", entityName),
  metadata,
});

function getDescription(
  action: LogActivityParams["action_type"],
  entityTypeLabel: string,
  entityName: string
): string {
  const actions: Record<LogActivityParams["action_type"], string> = {
    create: "criou",
    update: "atualizou",
    delete: "excluiu",
    archive: "arquivou",
    restore: "restaurou",
    view: "visualizou",
  };
  
  return `${actions[action]} ${entityTypeLabel}: ${entityName}`;
}
