// Unified Company Interface - Single source of truth for company data across the app

export interface Company {
  // Core identification
  id: string;
  cnpj: string | null;
  name: string;
  razaoSocial: string | null;
  
  // Classification
  segment: string | null;
  cnaeCode: string | null;
  cnaeDescription: string | null;
  companySize: string | null;
  
  // Location
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  zipCode: string | null;
  address: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  
  // Contact availability flags
  hasPhone: boolean;
  hasEmail: boolean;
  hasWebsite: boolean;
  
  // Contact details (may be null if not revealed/enriched)
  phones: string[];
  emails: string[];
  websiteUrl: string | null;
  
  // Social
  instagram: string[];
  whatsapp: string[];
  linkedin: string | null;
  
  // Financial
  capitalSocial: number | null;
  
  // Dates
  dataAbertura: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  
  // Status
  situacao: string | null;
  
  // Metadata
  source: string | null;
  enriched: boolean;
  dataRevealed: boolean;
  revealedAt: string | null;
  
  // Partners (from enrichment)
  partners: Partner[];
}

export interface Partner {
  name: string;
  role: string;
}

// ============================================
// Conversion Functions
// ============================================

import type { CompanySearchResult } from "@/hooks/useCompanySearch";

/**
 * Convert CompanySearchResult (from search-companies edge function) to unified Company
 */
export function fromSearchResult(result: CompanySearchResult): Company {
  return {
    id: result.id,
    cnpj: result.cnpj,
    name: result.name,
    razaoSocial: result.razao_social,
    segment: result.segment,
    cnaeCode: result.cnae_code,
    cnaeDescription: result.cnae_description,
    companySize: result.company_size,
    city: result.city,
    state: result.state,
    neighborhood: result.neighborhood,
    zipCode: result.zip_code,
    address: result.address,
    addressNumber: result.number,
    addressComplement: result.complement,
    hasPhone: result.has_phone,
    hasEmail: result.has_email,
    hasWebsite: result.has_website,
    phones: result.phones || [],
    emails: result.emails || [],
    websiteUrl: result.website_url || null,
    instagram: [],
    whatsapp: [],
    linkedin: null,
    capitalSocial: result.capital_social,
    dataAbertura: result.data_abertura,
    createdAt: null,
    updatedAt: null,
    situacao: result.situacao,
    source: "search",
    enriched: result.enriched || false,
    dataRevealed: false,
    revealedAt: null,
    partners: [],
  };
}

/**
 * Convert unified Company to CompanySearchResult (for backwards compatibility)
 */
export function toSearchResult(company: Company): CompanySearchResult {
  return {
    id: company.id,
    cnpj: company.cnpj || "",
    name: company.name,
    razao_social: company.razaoSocial || company.name,
    segment: company.segment || "",
    cnae_code: company.cnaeCode || "",
    cnae_description: company.cnaeDescription || "",
    company_size: company.companySize || "",
    city: company.city || "",
    state: company.state || "",
    neighborhood: company.neighborhood || "",
    zip_code: company.zipCode || "",
    address: company.address || "",
    number: company.addressNumber || "",
    complement: company.addressComplement || "",
    has_phone: company.hasPhone,
    has_email: company.hasEmail,
    has_website: company.hasWebsite,
    phones: company.phones,
    emails: company.emails,
    website_url: company.websiteUrl || undefined,
    situacao: company.situacao || "",
    capital_social: company.capitalSocial,
    data_abertura: company.dataAbertura,
    enriched: company.enriched,
  };
}

/**
 * Convert unified Company to format expected by AI Prospecting
 */
export function toAICompanyData(company: Company) {
  return {
    name: company.name,
    segment: company.segment || undefined,
    cnae: company.cnaeCode || undefined,
    cnaeDescription: company.cnaeDescription || undefined,
    size: company.companySize || undefined,
    city: company.city || undefined,
    state: company.state || undefined,
    hasWebsite: company.hasWebsite,
    hasEmail: company.hasEmail,
    hasPhone: company.hasPhone,
    website: company.websiteUrl || undefined,
    emails: company.emails.length > 0 ? company.emails : undefined,
    phones: company.phones.length > 0 ? company.phones : undefined,
    instagram: company.instagram.length > 0 ? company.instagram : undefined,
    linkedin: company.linkedin || undefined,
    capitalSocial: company.capitalSocial || undefined,
    dataAbertura: company.dataAbertura || undefined,
  };
}

/**
 * Convert database Prospect row to unified Company
 */
export function fromProspectRow(row: {
  id: string;
  name: string;
  cnpj?: string | null;
  segment?: string | null;
  cnae_code?: string | null;
  cnae_description?: string | null;
  company_size?: string | null;
  city?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  has_phone?: boolean | null;
  has_email?: boolean | null;
  has_website?: boolean | null;
  phones?: string[] | null;
  emails?: string[] | null;
  website_url?: string | null;
  cnpj_situacao?: string | null;
  data_revealed?: boolean | null;
  revealed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  source?: string | null;
}): Company {
  return {
    id: row.id,
    cnpj: row.cnpj || null,
    name: row.name,
    razaoSocial: null,
    segment: row.segment || null,
    cnaeCode: row.cnae_code || null,
    cnaeDescription: row.cnae_description || null,
    companySize: row.company_size || null,
    city: row.city || null,
    state: row.state || null,
    neighborhood: row.neighborhood || null,
    zipCode: row.zip_code || null,
    address: null,
    addressNumber: null,
    addressComplement: null,
    hasPhone: row.has_phone || false,
    hasEmail: row.has_email || false,
    hasWebsite: row.has_website || false,
    phones: row.phones || [],
    emails: row.emails || [],
    websiteUrl: row.website_url || null,
    instagram: [],
    whatsapp: [],
    linkedin: null,
    capitalSocial: null,
    dataAbertura: null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    situacao: row.cnpj_situacao || null,
    source: row.source || null,
    enriched: false,
    dataRevealed: row.data_revealed || false,
    revealedAt: row.revealed_at || null,
    partners: [],
  };
}

/**
 * Merge enrichment data into Company
 */
export function mergeEnrichmentData(
  company: Company,
  enrichment: {
    phones?: string[];
    emails?: string[];
    website?: string;
    instagram?: string[];
    whatsapp?: string[];
    linkedin?: string;
    partners?: Partner[];
  }
): Company {
  return {
    ...company,
    phones: [...new Set([...company.phones, ...(enrichment.phones || [])])],
    emails: [...new Set([...company.emails, ...(enrichment.emails || [])])],
    websiteUrl: enrichment.website || company.websiteUrl,
    instagram: [...new Set([...company.instagram, ...(enrichment.instagram || [])])],
    whatsapp: [...new Set([...company.whatsapp, ...(enrichment.whatsapp || [])])],
    linkedin: enrichment.linkedin || company.linkedin,
    partners: enrichment.partners || company.partners,
    hasPhone: company.hasPhone || (enrichment.phones?.length || 0) > 0,
    hasEmail: company.hasEmail || (enrichment.emails?.length || 0) > 0,
    hasWebsite: company.hasWebsite || !!enrichment.website,
    enriched: true,
  };
}
