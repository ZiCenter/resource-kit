export interface NormalizedList<T = any> {
  data: T[];
  totalCount: number;
}

export interface ListParams {
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  extraFields?: Record<string, unknown>;
}

export interface SubResourceResolver<TEntity, TParent, TCreateForm> {
  list: (parent: TParent, params?: ListParams) => Promise<TEntity[] | NormalizedList<TEntity>>;
  create?: (parent: TParent, payload: TCreateForm) => Promise<void>;
  delete?: (parent: TParent, subEntity: TEntity) => Promise<void>;
}

export interface TabResolver<TEntity, TParent> {
  list: (parent: TParent, params?: ListParams) => Promise<TEntity[] | NormalizedList<TEntity>>;
  delete?: (parent: TParent, subEntity: TEntity) => Promise<void>;
}

export interface ResourceResolvers<
  TEntity,
  TDetail,
  TTemplate,
  TCreateForm,
  TUpdateForm = TCreateForm,
> {
  queryKey: string;
  list: (params?: ListParams) => Promise<NormalizedList<TEntity>>;
  get: (id: string) => Promise<TDetail>;
  template?: (params?: Record<string, any>) => Promise<TTemplate>;
  create?: (payload: TCreateForm) => Promise<string>;
  update?: (entity: TDetail, payload: TUpdateForm) => Promise<void>;
  delete?: (entity: TDetail) => Promise<void>;
}
