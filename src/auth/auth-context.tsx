import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CoreAuthUser, AuthAdapter, SessionStorage } from './auth.types';

interface AuthState {
  user: CoreAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: Record<string, string>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadInitialState(adapter: AuthAdapter, storage: SessionStorage): AuthState {
  const token = storage.getToken();
  const userJson = storage.getUser();
  if (token && userJson) {
    const user = adapter.restoreSession?.(token, userJson) ?? null;
    if (user) {
      return { user, isAuthenticated: true, isLoading: false };
    }
    // Session restore failed — clear stale data
    storage.clear();
  }
  return { user: null, isAuthenticated: false, isLoading: false };
}

interface AuthProviderProps {
  adapter: AuthAdapter;
  /** Required session persistence strategy — the consumer decides (localStorage, cookies, memory, etc.). */
  storage: SessionStorage;
  children: ReactNode;
}

export function AuthProvider({ adapter, storage, children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => loadInitialState(adapter, storage));

  const login = useCallback(
    async (credentials: Record<string, string>) => {
      const { user, token } = await adapter.login(credentials);
      storage.setToken(token);
      storage.setUser(JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
    },
    [adapter, storage],
  );

  const logout = useCallback(async () => {
    await adapter.logout?.();
    storage.clear();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, [adapter, storage]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
