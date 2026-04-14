import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { BibleVersion } from '../services/bibleApi';

interface BibleVersionContextValue {
  version: BibleVersion;
  setVersion: (version: BibleVersion) => void;
}

const STORAGE_KEY = 'exodo:bible-version';
const DEFAULT_VERSION: BibleVersion = 'traditional';

const BibleVersionContext = createContext<BibleVersionContextValue | undefined>(undefined);

function isBibleVersion(value: string | null): value is BibleVersion {
  return value === 'traditional';
}

function getInitialVersion(): BibleVersion {
  if (typeof window === 'undefined') {
    return DEFAULT_VERSION;
  }

  const savedVersion = window.localStorage.getItem(STORAGE_KEY);
  return isBibleVersion(savedVersion) ? savedVersion : DEFAULT_VERSION;
}

export function BibleVersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState<BibleVersion>(getInitialVersion);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, version);
  }, [version]);

  const value = useMemo(
    () => ({
      version,
      setVersion,
    }),
    [version],
  );

  return <BibleVersionContext.Provider value={value}>{children}</BibleVersionContext.Provider>;
}

export function useBibleVersion() {
  const context = useContext(BibleVersionContext);
  if (!context) {
    throw new Error('useBibleVersion precisa ser usado dentro de BibleVersionProvider.');
  }
  return context;
}
