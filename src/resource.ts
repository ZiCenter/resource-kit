import type { QueryClient } from '@tanstack/react-query';
import type {
  InferEntity,
  InferDetail,
  InferCreateForm,
  InferUpdateForm,
  ResourceListDefinition,
  ResourceHeaderDefinition,
  ResourceOverrides,
  ResourceManifestEntry,
} from './types/resource.types';
import type { FieldGroupDef, FormDef } from '@zicenter/form-kit';
import type { TabDef, ActionDef, TabSection } from './types/display.types';

// ── Structural constraint (avoids contravariance issues with `never` form types) ──
export type AnyResolvers = {
  queryKey: string;
  list: (...args: any[]) => any;
  get: (...args: any[]) => any;
  template?: (...args: any[]) => any;
  create?: (...args: any[]) => any;
  update?: (...args: any[]) => any;
  delete?: (...args: any[]) => any;
};

// ── Abstract Resource Class ──
export abstract class Resource<R extends AnyResolvers> {
  // ── Required ──
  abstract resolvers: R;
  abstract listing: ResourceListDefinition<InferEntity<R>>;

  // ── Required method ──
  abstract getId(entity: InferEntity<R>): string;

  // ── Optional data properties ──
  description?: string;
  tabs: TabDef<InferDetail<R>, any>[] = [];
  header?: ResourceHeaderDefinition<InferDetail<R>>;
  detailFields?: FieldGroupDef[];
  actions?: ActionDef<InferDetail<R>>[];
  tabSection?: TabSection;
  overrides?: ResourceOverrides;

  // ── Optional methods (override in subclass) ──
  createForm?(queryClient: QueryClient): FormDef<InferCreateForm<R>>;
  editForm?(queryClient: QueryClient): FormDef<InferUpdateForm<R>>;
}

// ── Loaded Resource Class ──
export class LoadedResource<R extends AnyResolvers = AnyResolvers> {
  // ── Manifest properties ──
  readonly id: string;
  readonly label: string;
  readonly labelPlural?: string;
  readonly icon: string;
  readonly group: string;
  readonly permissions?: {
    list?: string;
    create?: string;
    update?: string;
    delete?: string;
  };

  private readonly resource: Resource<R>;

  constructor(resource: Resource<R>, manifest: ResourceManifestEntry) {
    this.resource = resource;
    this.id = manifest.id;
    this.label = manifest.label;
    this.labelPlural = manifest.labelPlural;
    this.icon = manifest.icon;
    this.group = manifest.group;
    this.permissions = manifest.permissions;
  }

  // ── Delegated data properties ──
  get resolvers(): R {
    return this.resource.resolvers;
  }
  get listing(): ResourceListDefinition<InferEntity<R>> {
    return this.resource.listing;
  }
  get tabs(): TabDef<InferDetail<R>, any>[] {
    return this.resource.tabs;
  }
  get header(): ResourceHeaderDefinition<InferDetail<R>> | undefined {
    return this.resource.header;
  }
  get detailFields(): FieldGroupDef[] | undefined {
    return this.resource.detailFields;
  }
  get actions(): ActionDef<InferDetail<R>>[] | undefined {
    return this.resource.actions;
  }
  get tabSection(): TabSection | undefined {
    return this.resource.tabSection;
  }
  get overrides(): ResourceOverrides | undefined {
    return this.resource.overrides;
  }
  get description(): string | undefined {
    return this.resource.description;
  }

  // ── Delegated methods ──
  getId(entity: InferEntity<R>): string {
    return this.resource.getId(entity);
  }

  get createForm(): ((qc: QueryClient) => FormDef<InferCreateForm<R>>) | undefined {
    return this.resource.createForm?.bind(this.resource);
  }

  get editForm(): ((qc: QueryClient) => FormDef<InferUpdateForm<R>>) | undefined {
    return this.resource.editForm?.bind(this.resource);
  }
}
