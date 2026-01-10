import { useState, useEffect } from "react";
import type { ProspectFilters } from "./useProspects";
import type { CompanySearchResult } from "./useCompanySearch";

export interface CachedSearch {
  id: string;
  filters: ProspectFilters;
  pageSize: number;
  results: CompanySearchResult[];
  total: number;
  timestamp: number;
  expiresAt: number;
}

const CACHE_KEY = "prospeccao_search_cache";
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const MAX_CACHED_SEARCHES = 5;

function getFiltersHash(filters: ProspectFilters, pageSize?: number): string {
  return JSON.stringify({
    segments: filters.segments?.sort() || [],
    states: filters.states?.sort() || [],
    cities: filters.cities?.sort() || [],
    companySizes: filters.companySizes?.sort() || [],
    hasEmail: filters.hasEmail || false,
    hasPhone: filters.hasPhone || false,
    hasWebsite: filters.hasWebsite || false,
    pageSize: pageSize || 10,
  });
}

function loadCache(): CachedSearch[] {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return [];
    
    const cache = JSON.parse(stored) as CachedSearch[];
    const now = Date.now();
    
    // Filter out expired entries
    return cache.filter(c => c.expiresAt > now);
  } catch {
    return [];
  }
}

function saveCache(cache: CachedSearch[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache.slice(0, MAX_CACHED_SEARCHES)));
  } catch {
    // Storage full - clear old cache
    localStorage.removeItem(CACHE_KEY);
  }
}

export function useSearchCache() {
  const [cache, setCache] = useState<CachedSearch[]>([]);

  // Load cache on mount
  useEffect(() => {
    setCache(loadCache());
  }, []);

  // Find cached results for filters (includes pageSize in the hash)
  const findCached = (filters: ProspectFilters, pageSize?: number): CachedSearch | null => {
    const hash = getFiltersHash(filters, pageSize);
    const now = Date.now();
    
    return cache.find(c => getFiltersHash(c.filters, c.pageSize) === hash && c.expiresAt > now) || null;
  };

  // Add new search to cache (includes pageSize)
  const addToCache = (filters: ProspectFilters, results: CompanySearchResult[], total: number, pageSize: number = 10) => {
    const now = Date.now();
    const hash = getFiltersHash(filters, pageSize);
    
    // Remove existing entry with same hash (same filters AND same pageSize)
    const filtered = cache.filter(c => getFiltersHash(c.filters, c.pageSize) !== hash);
    
    const newEntry: CachedSearch = {
      id: `cache_${now}`,
      filters,
      pageSize,
      results,
      total,
      timestamp: now,
      expiresAt: now + CACHE_EXPIRY,
    };
    
    const newCache = [newEntry, ...filtered].slice(0, MAX_CACHED_SEARCHES);
    setCache(newCache);
    saveCache(newCache);
  };

  // Get recent cached searches (for history)
  const getRecentSearches = (): CachedSearch[] => {
    return cache.slice(0, MAX_CACHED_SEARCHES);
  };

  // Clear all cache
  const clearCache = () => {
    setCache([]);
    localStorage.removeItem(CACHE_KEY);
  };

  // Get cache stats
  const getCacheStats = () => {
    const now = Date.now();
    const validEntries = cache.filter(c => c.expiresAt > now);
    return {
      total: validEntries.length,
      totalResults: validEntries.reduce((sum, c) => sum + c.results.length, 0),
    };
  };

  return {
    findCached,
    addToCache,
    getRecentSearches,
    clearCache,
    getCacheStats,
  };
}
