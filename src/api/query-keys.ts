export const queryKeys = {
  resource: (key: string) => [key] as const,
  resourceList: (key: string, params?: Record<string, any>) => [key, 'list', params] as const,
  resourceDetail: (key: string, id: string) => [key, 'detail', id] as const,
  subResource: (key: string, id: string, subKey: string) => [key, id, subKey] as const,
};
