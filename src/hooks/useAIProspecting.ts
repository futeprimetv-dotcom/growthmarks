import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Re-export ICPConfig from centralized config
export { type ICPConfig, type ToneOfVoice, DEFAULT_ICP } from "@/config/icp";
import type { ICPConfig } from "@/config/icp";

export interface CompanyData {
  name: string;
  cnpj?: string;
  segment?: string;
  city?: string;
  state?: string;
  companySize?: string;
  cnaeCode?: string;
  cnaeDescription?: string;
  phones?: string[];
  emails?: string[];
  website?: string;
  instagram?: string[];
}

export interface FitAnalysis {
  score: number;
  recommendation: "prospectar" | "avaliar" | "ignorar";
  justification: string;
  strengths: string[];
  concerns: string[];
}

export interface CompanySummary {
  summary: string;
  keyPoints: string[];
  opportunities: string[];
  suggestedServices: string[];
}

export interface ApproachSuggestion {
  channel: "whatsapp" | "email" | "telefone" | "linkedin";
  timing: string;
  approach: string;
  pitch: string;
  icebreaker: string;
}

export interface ContactScript {
  script: string;
  followUp: string;
  objections: Array<{ objection: string; response: string }>;
}

export interface LeadQualification {
  classification: "A" | "B" | "C" | "D";
  temperature: "hot" | "warm" | "cold";
  probability: number;
  estimatedValue: number;
  nextAction: string;
  timeToClose: string;
  reasoning: string;
}

export interface BatchAnalysisResult {
  rankings: Array<{
    companyName: string;
    score: number;
    recommendation: "prospectar" | "avaliar" | "ignorar";
    quickNote: string;
  }>;
}

export interface BusinessHours {
  found: boolean;
  isEstimated: boolean;
  hours: {
    monday: string | null;
    tuesday: string | null;
    wednesday: string | null;
    thursday: string | null;
    friday: string | null;
    saturday: string | null;
    sunday: string | null;
  };
  summary: string;
  source: "google" | "website" | "estimado";
}

export interface GoogleRating {
  found: boolean;
  rating: number | null;
  reviewCount: number | null;
}

export interface DigitalPresenceAnalysis {
  website: {
    found: boolean;
    url: string | null;
    confidence: "alta" | "média" | "baixa";
    notes: string;
    validated?: boolean;
  };
  whatsapp: {
    found: boolean;
    number: string | null;
    confidence: "alta" | "média" | "baixa";
    source: string;
    isMobile?: boolean;
  };
  socialMedia: {
    instagram: string | null;
    instagramValidated?: boolean;
    instagramNote?: string;
    facebook: string | null;
    linkedin: string | null;
    tiktok: string | null;
  };
  businessHours?: BusinessHours;
  googleRating?: GoogleRating;
  digitalMaturity: {
    level: "alta" | "média" | "baixa" | "inexistente";
    score: number;
    analysis: string;
  };
  dataQualityWarnings?: string[];
  contactSuggestions: string[];
}

type AnalysisType = 
  | "analyze-fit" 
  | "generate-summary" 
  | "suggest-approach" 
  | "generate-script" 
  | "qualify-lead"
  | "batch-analyze"
  | "digital-presence";

interface AIProspectingRequest {
  type: AnalysisType;
  company?: CompanyData;
  companies?: CompanyData[];
  channel?: string;
  icpConfig?: Partial<ICPConfig>;
}

interface AIProspectingResponse<T> {
  success: boolean;
  type: AnalysisType;
  data: T;
  error?: string;
}

async function callAIProspecting<T>(request: AIProspectingRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke<AIProspectingResponse<T>>("ai-prospecting", {
    body: request,
  });

  if (error) {
    console.error("AI Prospecting error:", error);
    throw new Error(error.message || "Erro ao conectar com IA");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Erro na análise de IA");
  }

  return data.data;
}

export function useAnalyzeFit() {
  return useMutation({
    mutationFn: async ({ company, icpConfig }: { company: CompanyData; icpConfig?: Partial<ICPConfig> }) => {
      return callAIProspecting<FitAnalysis>({
        type: "analyze-fit",
        company,
        icpConfig,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useGenerateSummary() {
  return useMutation({
    mutationFn: async ({ company }: { company: CompanyData }) => {
      return callAIProspecting<CompanySummary>({
        type: "generate-summary",
        company,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSuggestApproach() {
  return useMutation({
    mutationFn: async ({ company, icpConfig }: { company: CompanyData; icpConfig?: Partial<ICPConfig> }) => {
      return callAIProspecting<ApproachSuggestion>({
        type: "suggest-approach",
        company,
        icpConfig,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useGenerateScript() {
  return useMutation({
    mutationFn: async ({ company, channel, icpConfig }: { 
      company: CompanyData; 
      channel: string;
      icpConfig?: Partial<ICPConfig>;
    }) => {
      return callAIProspecting<ContactScript>({
        type: "generate-script",
        company,
        channel,
        icpConfig,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useQualifyLead() {
  return useMutation({
    mutationFn: async ({ company, icpConfig }: { company: CompanyData; icpConfig?: Partial<ICPConfig> }) => {
      return callAIProspecting<LeadQualification>({
        type: "qualify-lead",
        company,
        icpConfig,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBatchAnalyze() {
  return useMutation({
    mutationFn: async ({ companies, icpConfig }: { 
      companies: CompanyData[]; 
      icpConfig?: Partial<ICPConfig>;
    }) => {
      return callAIProspecting<BatchAnalysisResult>({
        type: "batch-analyze",
        companies,
        icpConfig,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDigitalPresence() {
  return useMutation({
    mutationFn: async ({ company }: { company: CompanyData }) => {
      return callAIProspecting<DigitalPresenceAnalysis>({
        type: "digital-presence",
        company,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Full analysis combining fit + summary
export function useFullAnalysis() {
  const analyzeFit = useAnalyzeFit();
  const generateSummary = useGenerateSummary();

  return useMutation({
    mutationFn: async ({ company, icpConfig }: { company: CompanyData; icpConfig?: Partial<ICPConfig> }) => {
      const [fitResult, summaryResult] = await Promise.all([
        callAIProspecting<FitAnalysis>({
          type: "analyze-fit",
          company,
          icpConfig,
        }),
        callAIProspecting<CompanySummary>({
          type: "generate-summary",
          company,
        }),
      ]);

      return {
        fit: fitResult,
        summary: summaryResult,
      };
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
