import React, { createContext, useContext, useState, useCallback } from "react";

type SearchType = "internet" | "cnpj" | null;

interface GlobalSearchLockContextType {
  activeSearchType: SearchType;
  isSearchLocked: boolean;
  acquireLock: (type: "internet" | "cnpj") => boolean;
  releaseLock: (type: "internet" | "cnpj") => void;
  getActiveSearchMessage: () => string | null;
}

const GlobalSearchLockContext = createContext<GlobalSearchLockContextType | null>(null);

export function GlobalSearchLockProvider({ children }: { children: React.ReactNode }) {
  const [activeSearchType, setActiveSearchType] = useState<SearchType>(null);

  const isSearchLocked = activeSearchType !== null;

  const acquireLock = useCallback((type: "internet" | "cnpj"): boolean => {
    // If no active search, acquire the lock
    if (activeSearchType === null) {
      setActiveSearchType(type);
      return true;
    }
    // If same type is already active, allow (it will cancel the previous)
    if (activeSearchType === type) {
      return true;
    }
    // Different type is active, deny lock
    return false;
  }, [activeSearchType]);

  const releaseLock = useCallback((type: "internet" | "cnpj") => {
    setActiveSearchType(current => {
      if (current === type) {
        return null;
      }
      return current;
    });
  }, []);

  const getActiveSearchMessage = useCallback((): string | null => {
    if (!activeSearchType) return null;
    
    if (activeSearchType === "cnpj") {
      return "Aguarde a busca de CNPJs terminar antes de iniciar uma nova busca.";
    }
    return "Aguarde a busca na internet terminar antes de iniciar uma nova busca.";
  }, [activeSearchType]);

  return (
    <GlobalSearchLockContext.Provider
      value={{
        activeSearchType,
        isSearchLocked,
        acquireLock,
        releaseLock,
        getActiveSearchMessage,
      }}
    >
      {children}
    </GlobalSearchLockContext.Provider>
  );
}

export function useGlobalSearchLock() {
  const context = useContext(GlobalSearchLockContext);
  if (!context) {
    throw new Error("useGlobalSearchLock must be used within a GlobalSearchLockProvider");
  }
  return context;
}
