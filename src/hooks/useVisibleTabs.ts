import { useMemo, useCallback } from 'react';
import { usePermission } from './usePermission';
import { useNavigation } from '../providers/NavigationProvider';
import type { LoadedResource } from '../resource';
import type { TabDef } from '../types/display.types';

/**
 * Filters tabs by visibility + permissions and manages URL-based active tab state.
 */
export function useVisibleTabs(def: LoadedResource, entity: any) {
  const { has } = usePermission();
  const { useQueryParams } = useNavigation();
  const [searchParams, setSearchParams] = useQueryParams();

  const tabs: TabDef<any>[] = useMemo(
    () =>
      def.tabs.filter((tab) => {
        if (tab.visible && !tab.visible(entity)) return false;
        return !(tab.permission && !has(tab.permission));
      }),
    [def.tabs, entity, has],
  );

  const activeTabId = searchParams.get('tab') ?? tabs[0]?.id;

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? null,
    [tabs, activeTabId],
  );

  const onSelectTab = useCallback(
    (id: string) => setSearchParams({ tab: id }, { replace: true }),
    [setSearchParams],
  );

  return { tabs, activeTabId, activeTab, onSelectTab };
}
