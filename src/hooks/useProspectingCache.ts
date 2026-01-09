import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProspectFilters } from "./useProspects";
import type { CompanySearchResult } from "./useCompanySearch";
import type { EnrichedData } from "./useEnrichCompany";
import type { FitAnalysis, CompanySummary, DigitalPresenceAnalysis } from "./useAIProspecting";

// ============================================
// Types
// ============================================

export interface CachedSearch {
  id: string;
  filters: ProspectFilters;
  results: CompanySearchResult[];
  total: number;
  timestamp: number;
  expiresAt: number;
}

export interface EnrichedCacheEntry {
  data: EnrichedData;
  timestamp: number;
}

export interface AIAnalysisCacheEntry {
  fitAnalysis?: FitAnalysis;
  summary?: CompanySummary;
  timestamp: number;
}

export interface DigitalPresenceCacheEntry {
  data: DigitalPresenceAnalysis;
  timestamp: number;
}

export interface CacheStats {
  searchCacheCount: number;
  searchCacheResults: number;
  enrichedCacheCount: number;
  aiAnalysisCacheCount: number;
  digitalPresenceCacheCount: number;
  totalMemoryEstimate: string;
}

// ============================================
// Constants
// ============================================

const SEARCH_CACHE_KEY = "prospeccao_search_cache";
const SEARCH_CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const MAX_CACHED_SEARCHES = 5;
const MEMORY_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour for in-memory caches

// ============================================
// Utility Functions
// ============================================

function getFiltersHash(filters: ProspectFilters): string {
  return JSON.stringify({
    segments: filters.segments?.sort() || [],
    states: filters.states?.sort() || [],
    cities: filters.cities?.sort() || [],
    companySizes: filters.companySizes?.sort() || [],
    hasEmail: filters.hasEmail || false,
    hasPhone: filters.hasPhone || false,
    hasWebsite: filters.hasWebsite || false,
  });
}

function loadSearchCache(): CachedSearch[] {
  try {
    const stored = localStorage.getItem(SEARCH_CACHE_KEY);
    if (!stored) return [];
    
    const cache = JSON.parse(stored) as CachedSearch[];
    const now = Date.now();
    
    // Filter out expired entries
    return cache.filter(c => c.expiresAt > now);
  } catch {
    return [];
  }
}

function saveSearchCache(cache: CachedSearch[]) {
  try {
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache.slice(0, MAX_CACHED_SEARCHES)));
  } catch {
    // Storage full - clear old cache
    localStorage.removeItem(SEARCH_CACHE_KEY);
  }
}

function estimateMemorySize(obj: unknown): number {
  const str = JSON.stringify(obj);
  return str ? str.length * 2 : 0; // Rough estimate: 2 bytes per character
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================
// Main Hook
// ============================================

export function useProspectingCache() {
  const queryClient = useQueryClient();
  
  // LocalStorage cache for search results
  const [searchCache, setSearchCache] = useState<CachedSearch[]>([]);
  
  // In-memory caches (session-only)
  const enrichedCacheRef = useRef<Map<string, EnrichedCacheEntry>>(new Map());
  const aiAnalysisCacheRef = useRef<Map<string, AIAnalysisCacheEntry>>(new Map());
  const digitalPresenceCacheRef = useRef<Map<string, DigitalPresenceCacheEntry>>(new Map());

  // Load search cache on mount
  useEffect(() => {
    setSearchCache(loadSearchCache());
  }, []);

  // ============================================
  // Search Cache Operations
  // ============================================

  const findCachedSearch = useCallback((filters: ProspectFilters): CachedSearch | null => {
    const hash = getFiltersHash(filters);
    const now = Date.now();
    return searchCache.find(c => getFiltersHash(c.filters) === hash && c.expiresAt > now) || null;
  }, [searchCache]);

  const addSearchToCache = useCallback((filters: ProspectFilters, results: CompanySearchResult[], total: number) => {
    const now = Date.now();
    const hash = getFiltersHash(filters);
    
    // Remove existing entry with same hash
    const filtered = searchCache.filter(c => getFiltersHash(c.filters) !== hash);
    
    const newEntry: CachedSearch = {
      id: `cache_${now}`,
      filters,
      results,
      total,
      timestamp: now,
      expiresAt: now + SEARCH_CACHE_EXPIRY,
    };
    
    const newCache = [newEntry, ...filtered].slice(0, MAX_CACHED_SEARCHES);
    setSearchCache(newCache);
    saveSearchCache(newCache);
  }, [searchCache]);

  const getRecentSearches = useCallback((): CachedSearch[] => {
    return searchCache.slice(0, MAX_CACHED_SEARCHES);
  }, [searchCache]);

  // ============================================
  // Enriched Data Cache Operations
  // ============================================

  const getEnrichedData = useCallback((companyId: string): EnrichedData | null => {
    const entry = enrichedCacheRef.current.get(companyId);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > MEMORY_CACHE_EXPIRY) {
      enrichedCacheRef.current.delete(companyId);
      return null;
    }
    
    return entry.data;
  }, []);

  const setEnrichedData = useCallback((companyId: string, data: EnrichedData) => {
    enrichedCacheRef.current.set(companyId, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const hasEnrichedData = useCallback((companyId: string): boolean => {
    return getEnrichedData(companyId) !== null;
  }, [getEnrichedData]);

  // ============================================
  // AI Analysis Cache Operations
  // ============================================

  const getAIAnalysis = useCallback((companyId: string): AIAnalysisCacheEntry | null => {
    const entry = aiAnalysisCacheRef.current.get(companyId);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > MEMORY_CACHE_EXPIRY) {
      aiAnalysisCacheRef.current.delete(companyId);
      return null;
    }
    
    return entry;
  }, []);

  const setAIAnalysis = useCallback((
    companyId: string, 
    analysis: { fitAnalysis?: FitAnalysis; summary?: CompanySummary }
  ) => {
    const existing = aiAnalysisCacheRef.current.get(companyId);
    aiAnalysisCacheRef.current.set(companyId, {
      fitAnalysis: analysis.fitAnalysis || existing?.fitAnalysis,
      summary: analysis.summary || existing?.summary,
      timestamp: Date.now(),
    });
  }, []);

  const hasAIAnalysis = useCallback((companyId: string): boolean => {
    return getAIAnalysis(companyId) !== null;
  }, [getAIAnalysis]);

  // ============================================
  // Digital Presence Cache Operations
  // ============================================

  const getDigitalPresence = useCallback((companyId: string): DigitalPresenceAnalysis | null => {
    const entry = digitalPresenceCacheRef.current.get(companyId);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > MEMORY_CACHE_EXPIRY) {
      digitalPresenceCacheRef.current.delete(companyId);
      return null;
    }
    
    return entry.data;
  }, []);

  const setDigitalPresence = useCallback((companyId: string, data: DigitalPresenceAnalysis) => {
    digitalPresenceCacheRef.current.set(companyId, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const hasDigitalPresence = useCallback((companyId: string): boolean => {
    return getDigitalPresence(companyId) !== null;
  }, [getDigitalPresence]);

  // ============================================
  // Cache Management
  // ============================================

  const getCacheStats = useCallback((): CacheStats => {
    const enrichedEntries = Array.from(enrichedCacheRef.current.values());
    const aiEntries = Array.from(aiAnalysisCacheRef.current.values());
    const digitalEntries = Array.from(digitalPresenceCacheRef.current.values());
    
    const totalMemory = 
      estimateMemorySize(searchCache) +
      estimateMemorySize(enrichedEntries) +
      estimateMemorySize(aiEntries) +
      estimateMemorySize(digitalEntries);

    return {
      searchCacheCount: searchCache.length,
      searchCacheResults: searchCache.reduce((sum, c) => sum + c.results.length, 0),
      enrichedCacheCount: enrichedCacheRef.current.size,
      aiAnalysisCacheCount: aiAnalysisCacheRef.current.size,
      digitalPresenceCacheCount: digitalPresenceCacheRef.current.size,
      totalMemoryEstimate: formatBytes(totalMemory),
    };
  }, [searchCache]);

  const clearAllCaches = useCallback(() => {
    // Clear localStorage cache
    localStorage.removeItem(SEARCH_CACHE_KEY);
    setSearchCache([]);
    
    // Clear in-memory caches
    enrichedCacheRef.current.clear();
    aiAnalysisCacheRef.current.clear();
    digitalPresenceCacheRef.current.clear();
    
    // Clear React Query caches related to prospecting
    queryClient.invalidateQueries({ queryKey: ["company-search"] });
    queryClient.invalidateQueries({ queryKey: ["prospects"] });
    queryClient.invalidateQueries({ queryKey: ["enrich-company"] });
    queryClient.invalidateQueries({ queryKey: ["ai-prospecting"] });
  }, [queryClient]);

  const clearSearchCache = useCallback(() => {
    localStorage.removeItem(SEARCH_CACHE_KEY);
    setSearchCache([]);
    queryClient.invalidateQueries({ queryKey: ["company-search"] });
  }, [queryClient]);

  const clearEnrichmentCache = useCallback(() => {
    enrichedCacheRef.current.clear();
    queryClient.invalidateQueries({ queryKey: ["enrich-company"] });
  }, [queryClient]);

  const clearAICache = useCallback(() => {
    aiAnalysisCacheRef.current.clear();
    digitalPresenceCacheRef.current.clear();
    queryClient.invalidateQueries({ queryKey: ["ai-prospecting"] });
  }, [queryClient]);

  // Cleanup expired entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      
      // Cleanup enriched cache
      for (const [key, entry] of enrichedCacheRef.current.entries()) {
        if (now - entry.timestamp > MEMORY_CACHE_EXPIRY) {
          enrichedCacheRef.current.delete(key);
        }
      }
      
      // Cleanup AI analysis cache
      for (const [key, entry] of aiAnalysisCacheRef.current.entries()) {
        if (now - entry.timestamp > MEMORY_CACHE_EXPIRY) {
          aiAnalysisCacheRef.current.delete(key);
        }
      }
      
      // Cleanup digital presence cache
      for (const [key, entry] of digitalPresenceCacheRef.current.entries()) {
        if (now - entry.timestamp > MEMORY_CACHE_EXPIRY) {
          digitalPresenceCacheRef.current.delete(key);
        }
      }
    };

    // Run cleanup every 10 minutes
    const interval = setInterval(cleanup, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    // Search cache
    findCachedSearch,
    addSearchToCache,
    getRecentSearches,
    
    // Enrichment cache
    getEnrichedData,
    setEnrichedData,
    hasEnrichedData,
    
    // AI analysis cache
    getAIAnalysis,
    setAIAnalysis,
    hasAIAnalysis,
    
    // Digital presence cache
    getDigitalPresence,
    setDigitalPresence,
    hasDigitalPresence,
    
    // Cache management
    getCacheStats,
    clearAllCaches,
    clearSearchCache,
    clearEnrichmentCache,
    clearAICache,
  };
}
