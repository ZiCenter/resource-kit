/**
 * Generic auth contracts for the core engine.
 * Each consuming app provides an AuthAdapter implementation.
 */

export interface CoreAuthUser {
  userId: number | string;
  username: string;
  roles: { id: number | string; name: string }[];
  permissions: string[];
  /** App-specific fields beyond the standard auth properties */
  metadata?: Record<string, unknown>;
}

export interface AuthAdapter {
  /** Authenticate a user. Returns the user and a token for session persistence. */
  login(credentials: Record<string, string>): Promise<{ user: CoreAuthUser; token: string }>;
  /** Optional logout handler (e.g., server-side session invalidation) */
  logout?(): Promise<void>;
  /** Restore a session from a previously persisted token. Return null if invalid. */
  restoreSession?(token: string, userJson: string): CoreAuthUser | null;
}

/** Pluggable storage for auth session persistence (token + user). */
export interface SessionStorage {
  getToken(): string | null;
  setToken(token: string): void;
  getUser(): string | null;
  setUser(json: string): void;
  clear(): void;
}
