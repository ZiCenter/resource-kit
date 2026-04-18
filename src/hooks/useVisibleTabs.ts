import { useMemo, useCallback } from 'react';
import { usePermission } from './usePermission';
import { useNavigation } from '../providers/NavigationProvider';
import { useResourceDef } from '../providers/ResourceProvider';
import type { TabDef } from '../types/display.types';

export function useVisibleTabs(entity: any) {
  const def = useResourceDef();
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
