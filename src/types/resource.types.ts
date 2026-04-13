import type { ComponentType } from 'react';
import type { ColumnDef } from './display.types';
import type { NormalizedList } from './resolver.types';

// ── Manifest Entry (lightweight navigation metadata) ──
export interface ResourceManifestEntry {
  id: string;
  label: string;
  labelPlural?: string;
  icon: string;
  group: string;
  permissions?: { list?: string; create?: string; update?: string; delete?: string };
}

// ── Resource Overrides ──
export interface ResourceOverrides {
  ListComponent?: ComponentType;
  DetailComponent?: ComponentType;
  CreateComponent?: ComponentType;
  EditComponent?: ComponentType;
  DetailHeader?: ComponentType;
}

export interface ResourceListDefinition<TEntity> {
  columns: ColumnDef<TEntity>[];
}

export interface ResourceHeaderDefinition<TDetail> {
  title: (entity: TDetail) => string | undefined;
  subtitle?: (entity: TDetail) => string | undefined;
  status?: (entity: TDetail) => string | undefined;
  image?: (entity: TDetail) => string | undefined;
}

// ── Resolver → Type Inference Utilities ──
export type InferEntity<R> = R extends { list: (...a: any[]) => Promise<NormalizedList<infer E>> }
  ? E
  : any;
export type InferDetail<R> = R extends { get: (...a: any[]) => Promise<infer D> } ? D : any;
export type InferCreateForm<R> = R extends { create: (p: infer P) => any } ? P : any;
export type InferUpdateForm<R> = R extends { update: (e: any, p: infer P) => any } ? P : any;
