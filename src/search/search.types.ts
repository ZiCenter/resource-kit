import type { ComponentType } from 'react';

/**
 * Generic search contracts for the core engine.
 * Each consuming app provides a SearchAdapter implementation.
 */

export interface SearchResult {
  /** Unique identifier for the entity */
  id?: number | string;
  /** Display name for the entity */
  name?: string;
  /** Entity type/category (e.g., "CLIENT", "PRODUCT") */
  type?: string;
  /** Current status of the entity */
  status?: { value: string };
  /** Allow domain-specific extra properties */
  [key: string]: unknown;
}

export interface SearchParams {
  query: string;
  resource?: string;
  exactMatch?: boolean;
}

export interface SearchAdapter {
  /** Execute a search query */
  search(params: SearchParams): Promise<SearchResult[]>;
  /** Map a search result to a route path */
  getEntityRoute(result: SearchResult): string;
  /** Get a human-readable label for an entity type */
  getEntityTypeLabel(type?: string): string;
  /** Get an icon component for an entity type */
  getEntityIcon?(type?: string): ComponentType;
  /** Build a subtitle string for a search result */
  getResultSubtitle?(result: SearchResult): string;
  /** Group results by entity type */
  groupResults?(results: SearchResult[]): Record<string, SearchResult[]>;
}
