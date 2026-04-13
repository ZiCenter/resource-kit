const groupLabels: Record<string, string> = {};

/**
 * Register display labels for resource groups.
 * Call this at app bootstrap before resources are loaded.
 */
export function registerGroupLabels(labels: Record<string, string>): void {
  Object.assign(groupLabels, labels);
}
