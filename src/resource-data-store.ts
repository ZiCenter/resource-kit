import type { QueryClient } from '@tanstack/react-query';

type DataFetcher<T = any> = (params?: Record<string, any>) => Promise<T>;

interface DataSourceConfig<T = any> {
  fetcher: DataFetcher<T>;
  staleTime?: number;
  paramsScope?: 'shared' | 'independent';
}

export class ResourceDataStore<TTemplate extends Record<string, any> = Record<string, any>> {
  private params: Record<string, any> | undefined;
  private sources = new Map<string, DataSourceConfig>();

  constructor(
    private queryKey: string,
    fetcher?: DataFetcher<TTemplate>,
  ) {
    if (fetcher) {
      this.sources.set('template', { fetcher, staleTime: 30_000, paramsScope: 'shared' });
    }
  }

  /** Register an additional named data source. Returns `this` for chaining. */
  register<T>(name: string, config: DataSourceConfig<T> | DataFetcher<T>): this {
    const normalized: DataSourceConfig<T> =
      typeof config === 'function'
        ? { fetcher: config, staleTime: 30_000, paramsScope: 'shared' }
        : { staleTime: 30_000, paramsScope: 'shared', ...config };
    this.sources.set(name, normalized);
    return this;
  }

  /** Update shared params and invalidate all shared-scope sources. */
  updateParams(queryClient: QueryClient, params: Record<string, any>) {
    this.params = params;
    for (const [name, config] of this.sources) {
      if (config.paramsScope !== 'independent') {
        queryClient.invalidateQueries({ queryKey: [this.queryKey, name] });
      }
    }
  }

  /** Get a typed field from the default 'template' source. */
  async getField<K extends keyof TTemplate>(
    queryClient: QueryClient,
    key: K,
  ): Promise<NonNullable<TTemplate[K]>> {
    const data = await this.fetch<TTemplate>(queryClient, 'template');
    return data[key] as NonNullable<TTemplate[K]>;
  }

  /** Get full data from the default 'template' source. */
  async getData(queryClient: QueryClient): Promise<TTemplate> {
    return this.fetch<TTemplate>(queryClient, 'template');
  }

  /** Fetch data from any named source. */
  async fetch<T = any>(queryClient: QueryClient, sourceName: string): Promise<T> {
    const source = this.sources.get(sourceName);
    if (!source) {
      throw new Error(
        `ResourceDataStore: no source '${sourceName}' registered for '${this.queryKey}'`,
      );
    }
    const params = source.paramsScope === 'independent' ? undefined : this.params;
    return queryClient.fetchQuery({
      queryKey: [this.queryKey, sourceName, params],
      queryFn: () => source.fetcher(params),
      staleTime: source.staleTime ?? 30_000,
    });
  }

  /** Get a typed field from a named source. */
  async getFieldFrom<TData extends Record<string, any>, K extends keyof TData>(
    queryClient: QueryClient,
    sourceName: string,
    key: K,
  ): Promise<TData[K]> {
    const data = await this.fetch<TData>(queryClient, sourceName);
    return data[key];
  }
}
