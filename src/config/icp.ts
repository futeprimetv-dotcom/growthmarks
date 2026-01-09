// Centralized ICP (Ideal Customer Profile) Configuration
// This is the SINGLE source of truth for default ICP settings

export type ToneOfVoice = "formal" | "casual" | "technical" | "consultative";

export interface ICPConfig {
  targetSegments: string[];
  preferredSizes: string[];
  targetStates: string[];
  minTicket: number;
  toneOfVoice: ToneOfVoice;
}

/**
 * Default ICP configuration used when no custom settings exist
 * This should be the only place where default ICP values are defined
 */
export const DEFAULT_ICP: ICPConfig = {
  targetSegments: ["Marketing Digital", "E-commerce", "Tecnologia"],
  preferredSizes: ["Pequena", "Média"],
  targetStates: ["SP", "RJ", "MG"],
  minTicket: 2000,
  toneOfVoice: "consultative",
};

/**
 * Available segment options for ICP configuration
 */
export const SEGMENT_OPTIONS = [
  "Marketing Digital",
  "E-commerce",
  "Tecnologia",
  "Saúde",
  "Educação",
  "Varejo",
  "Alimentação",
  "Construção",
  "Serviços",
  "Indústria",
  "Logística",
  "Financeiro",
  "Imobiliário",
  "Automotivo",
  "Agronegócio",
  "Pet",
  "Beleza",
  "Moda",
  "Turismo",
  "Entretenimento",
];

/**
 * Available company size options
 */
export const COMPANY_SIZE_OPTIONS = [
  { value: "MEI", label: "MEI" },
  { value: "Micro", label: "Microempresa" },
  { value: "Pequena", label: "Pequena Empresa" },
  { value: "Média", label: "Média Empresa" },
  { value: "Grande", label: "Grande Empresa" },
];

/**
 * Brazilian state options
 */
export const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

/**
 * Tone of voice options for AI-generated content
 */
export const TONE_OF_VOICE_OPTIONS = [
  { value: "profissional", label: "Profissional" },
  { value: "consultivo", label: "Consultivo" },
  { value: "amigavel", label: "Amigável" },
  { value: "direto", label: "Direto" },
  { value: "persuasivo", label: "Persuasivo" },
];

/**
 * Check if an ICP config is different from the default
 */
export function isICPCustomized(config: ICPConfig | null | undefined): boolean {
  if (!config) return false;
  
  return (
    JSON.stringify(config.targetSegments?.sort()) !== JSON.stringify(DEFAULT_ICP.targetSegments.sort()) ||
    JSON.stringify(config.targetStates?.sort()) !== JSON.stringify(DEFAULT_ICP.targetStates.sort()) ||
    JSON.stringify(config.preferredSizes?.sort()) !== JSON.stringify(DEFAULT_ICP.preferredSizes.sort()) ||
    config.minTicket !== DEFAULT_ICP.minTicket ||
    config.toneOfVoice !== DEFAULT_ICP.toneOfVoice
  );
}

/**
 * Get a summary of ICP configuration for display
 */
export function getICPSummary(config: ICPConfig | null | undefined): string {
  if (!config) return "ICP padrão";
  
  const parts: string[] = [];
  
  if (config.targetSegments?.length) {
    parts.push(`${config.targetSegments.length} segmentos`);
  }
  
  if (config.targetStates?.length) {
    parts.push(`${config.targetStates.length} estados`);
  }
  
  if (config.preferredSizes?.length) {
    parts.push(`${config.preferredSizes.length} portes`);
  }
  
  if (config.minTicket > 0) {
    parts.push(`ticket mín. R$ ${config.minTicket.toLocaleString()}`);
  }
  
  return parts.length > 0 ? parts.join(", ") : "ICP padrão";
}
