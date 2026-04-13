import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface UIState {
  commandPaletteOpen: boolean;
  searchDialogOpen: boolean;
  activeModule: string;
}

interface UIContextType extends UIState {
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchDialogOpen: (open: boolean) => void;
  setActiveModule: (id: string) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UIState>({
    commandPaletteOpen: false,
    searchDialogOpen: false,
    activeModule: '',
  });

  const setCommandPaletteOpen = useCallback(
    (open: boolean) => setState((s) => ({ ...s, commandPaletteOpen: open })),
    [],
  );
  const setSearchDialogOpen = useCallback(
    (open: boolean) => setState((s) => ({ ...s, searchDialogOpen: open })),
    [],
  );
  const setActiveModule = useCallback(
    (id: string) => setState((s) => ({ ...s, activeModule: id })),
    [],
  );

  return (
    <UIContext.Provider
      value={{
        ...state,
        setCommandPaletteOpen,
        setSearchDialogOpen,
        setActiveModule,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextType {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
}
