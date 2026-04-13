import { createContext, useContext, type ReactNode } from 'react';
import type { ResourceManifestEntry } from '../types/index';

interface ManifestContextType {
  manifest: Record<string, ResourceManifestEntry>;
}

const ManifestContext = createContext<ManifestContextType | null>(null);

export function ManifestProvider({
  manifest,
  children,
}: {
  manifest: Record<string, ResourceManifestEntry>;
  children: ReactNode;
}) {
  return <ManifestContext value={{ manifest }}>{children}</ManifestContext>;
}

export function useManifest(): Record<string, ResourceManifestEntry> {
  const ctx = useContext(ManifestContext);
  if (!ctx) throw new Error('useManifest must be used within ManifestProvider');
  return ctx.manifest;
}
