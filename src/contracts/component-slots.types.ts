/**
 * Component slot contracts for the headless core engine.
 *
 * The core engine defines these prop interfaces as contracts.
 * Consuming apps provide concrete React components that implement them.
 * This enables the core to orchestrate UI without owning any JSX/HTML.
 */

import type { ComponentType } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import type { StepperContract } from '@zicenter/form-kit';
import type { ColumnDef, ActionDef } from '../types/index';

export type { StepperContract };

// ── Action Slots ──

export interface ActionPanelProps {
  entity: any;
  actions: ActionDef[];
  selectedAction: ActionDef | null;
  onSelectAction: (action: ActionDef | null) => void;
  onClose: () => void;
  onNavigateAway?: () => void;
}

// ── Page-Level Slots ──

interface DataTableProps {
  data: any[];
  columns: ColumnDef[];
  onRowClick?: (row: any) => void;
  enableExport?: boolean;
  exportFilename?: string;
  pageCount?: number;
  totalCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: (
    updater: PaginationState | ((old: PaginationState) => PaginationState),
  ) => void;
}

interface DetailHeaderProps {
  entity: any;
  onToggleActions: () => void;
  onDelete: () => void;
  hasActions: boolean;
}

interface TabContainerProps {
  entity: any;
}

// ── Composite Slot Map ──

export interface CoreComponentSlots {
  FormStepWrapper: ComponentType<StepperContract>;
  ActionPanel: ComponentType<ActionPanelProps>;
  DataTable: ComponentType<DataTableProps>;
  DetailHeader: ComponentType<DetailHeaderProps>;
  TabContainer: ComponentType<TabContainerProps>;
}
