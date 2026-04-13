import { createContext, useContext, type ReactNode } from 'react';
import type { SearchAdapter } from './search.types';

const SearchAdapterContext = createContext<SearchAdapter | null>(null);

interface SearchProviderProps {
  adapter: SearchAdapter;
  children: ReactNode;
}

export function SearchProvider({ adapter, children }: SearchProviderProps) {
  return <SearchAdapterContext.Provider value={adapter}>{children}</SearchAdapterContext.Provider>;
}

export function useSearchAdapter(): SearchAdapter {
  const adapter = useContext(SearchAdapterContext);
  if (!adapter) {
    throw new Error('useSearchAdapter must be used within a SearchProvider');
  }
  return adapter;
}
