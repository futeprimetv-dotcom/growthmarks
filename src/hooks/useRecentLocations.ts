import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_STATES = "prospeccao_recent_states";
const STORAGE_KEY_CITIES = "prospeccao_recent_cities";
const MAX_RECENT = 5;

export function useRecentLocations() {
  const [recentStates, setRecentStates] = useState<string[]>([]);
  const [recentCities, setRecentCities] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedStates = localStorage.getItem(STORAGE_KEY_STATES);
      const savedCities = localStorage.getItem(STORAGE_KEY_CITIES);
      
      if (savedStates) {
        setRecentStates(JSON.parse(savedStates));
      }
      if (savedCities) {
        setRecentCities(JSON.parse(savedCities));
      }
    } catch (error) {
      console.error("Error loading recent locations:", error);
    }
  }, []);

  const addRecentState = useCallback((state: string) => {
    if (!state || state === "_all") return;
    
    setRecentStates(prev => {
      const filtered = prev.filter(s => s !== state);
      const updated = [state, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY_STATES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addRecentCity = useCallback((city: string) => {
    if (!city) return;
    
    setRecentCities(prev => {
      const filtered = prev.filter(c => c !== city);
      const updated = [city, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY_CITIES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    recentStates,
    recentCities,
    addRecentState,
    addRecentCity,
  };
}
