# AweraXe Banking Portal — Architecture & Principles

**Architecture Design Document**
Author: Emmanuel (Lead Engineer) · March 2026

---

## 1. Executive Summary

The AweraXe Banking Portal is a React application built on one principle: \*\*adding a new resource should require writing only its unique business logic, never plumbing.\*\*

The core insight is that 80%+ of the existing codebase is repetitive structural code — every module re-implements
listing, viewing, creating, editing, and action dispatch from scratch. The React rebuild eliminates this by introducing
a **resource registry** that drives data fetching, forms, tables, actions, and permissions from declarative configuration objects. Routing, navigation, and breadcrumbs are owned by each consumer app, which bridges its router to core-engine via a `NavigationAdapter`.

---

## 2. Audit of the Current Angular App — Problems to Solve

### 2.1 What the Angular app gets right

These things should be preserved:

- **Domain coverage is comprehensive.** Every API surface is exposed: clients, loans, savings, shares,
  deposits, accounting, products (loan/savings/share/recurring/fixed), organization (offices, employees, funds,
  holidays, payment types, currencies), system (codes, data tables, hooks, scheduler, roles, reports, audit, external
  services, maker-checker), templates, groups, centers, collections, remittances, users, tasks, and a configuration
  wizard.
- **Resolver-based data loading.** Routes declare what data they need, and resolvers fetch it before the view renders.
  This prevents waterfall loading and ensures views always have their data.
- **The template pattern is understood.** The app correctly calls `/resource/template` endpoints to fetch form
  options (dropdowns, allowed values, code values) before rendering create/edit forms. This pattern works and must be preserved.
- **Action dispatch on entity views.** Client, loan, and savings views expose status-dependent actions (Activate, Close,
  Reject, Transfer, etc.) through a dynamic action system.

### 2.2 What needs to change

These are the structural problems that make the app hard to extend:

**Problem 1: No shared CRUD infrastructure.**
Every module re-implements the same patterns from scratch. Clients, loans, savings, products — each has its own list
component, its own view component, its own create component, its own edit component. The result: 695 components where ~
200 could do the job with proper abstraction.

**Problem 2: Monolithic services with zero reuse.**
`loans.service.ts` is 803 lines. `organization.service.ts` is 880 lines. Each service manually constructs every HTTP
call. There is no generic API layer, no resource-aware client, no shared patterns for pagination, filtering, or template
fetching.

**Problem 3: Resolver explosion.**
276 resolver files, each containing ~15 lines of boilerplate that just calls a service method and passes route params. A
resolver like `ClientViewResolver` does nothing but `clientsService.getClientData(route.params.clientId)`. This is
mechanical code that should be generated from configuration.

**Problem 4: Forms are fully hand-coded.**
Every stepper step is a dedicated component with its own `FormGroup`, its own template, its own validation logic. The
client creation stepper has 5 step components. The loan creation stepper has 7. The loan product creation has 10+. None
share form field infrastructure.

**Problem 5: Navigation is hardcoded.**
Sidebar items are a static array in `frequent-activities.ts`. Adding a new module means editing the module, the routing
module, the app module imports, and the navigation array — four separate files minimum.

**Problem 6: Action dispatch uses flag objects.**
`ClientActionsComponent` declares a `{ 'Assign Staff': boolean, 'Close': boolean, ... }` object with 17 flags, renders
all 17 child components in the template behind `@if` guards, and sets the one matching flag to `true`. Every action is a
separate component, a separate import, a separate conditional. This pattern is repeated for loans and savings.

**Problem 7: No permission awareness in the UI.**
The app has roles and permissions in the system, but the UI doesn't conditionally render based on what the logged-in
user can actually do. Every user sees every button.

---

## 3. Core Architectural Principle

> **Convention over configuration, configuration over code.**

The system should be organized in three layers:

1. **Framework layer** — Generic, reusable infrastructure that never changes per-resource (API client, table renderer,
   form engine, route generator, layout shell). Built once.
2. **Configuration layer** — Declarative resource definitions that describe _what_ a module needs (its API endpoints,
   columns, form fields, actions, tabs). Written per-resource.
3. **Custom layer** — Bespoke components for truly unique business logic that can't be expressed declaratively (loan
   schedule calculator, accounting rule builder, complex wizards). Written only when necessary.

The goal: **adding a new resource (say, "Standing Instructions") should be achievable by writing one
configuration file and zero-to-few custom components.**

---

## 4. Project Structure

```
packages/
└── core-engine/                  # @zicenter/resource-kit — headless, platform-agnostic package
    └── src/
        ├── api/
        │   ├── api-client.ts         # Axios instance factory (createApiClient, configureApiClient)
        │   ├── query-keys.ts          # React Query key factory
        │   └── index.ts              # Barrel export
        ├── errors/
        │   └── errors.ts             # AppError, ValidationError, AuthenticationError classes
        ├── auth/
        │   ├── auth-context.tsx       # Auth state, login, logout, token refresh
        │   ├── auth.types.ts          # Auth types and contracts
        │   ├── permissions.ts         # Permission checking utilities
        │   └── guards.tsx             # Route guard components
        ├── hooks/
        │   ├── useResource.ts         # Core hook: CRUD operations for any resource
        │   ├── useResourceList.ts     # Paginated list with search/filter/sort
        │   ├── useResourceTemplate.ts # Fetch template for forms
        │   ├── usePermission.ts       # Check current user's permissions
        │   ├── useSearch.ts           # Global search hook
        │   └── useSlot.ts            # Slot system hook
        ├── providers/
        │   ├── CoreProviders.tsx       # Wraps all providers: Slot, Manifest, Notification, Navigation, QueryClient, UI
        │   ├── SlotProvider.tsx        # Component slot injection
        │   ├── ManifestProvider.tsx    # Injects resource manifest via context
        │   ├── NotificationProvider.tsx # Abstract toast interface
        │   ├── NavigationProvider.tsx  # Router-agnostic navigation adapter (URL params + list/detail/create/edit callbacks)
        │   └── UIProvider.tsx          # UI state context
        ├── registry/
        │   └── registry.ts            # In-memory Map store (validation + tests)
        ├── search/
        │   └── search.types.ts        # Search contracts
        ├── slots/
        │   └── slots.types.ts         # CoreComponentSlots contract
        ├── types/                     # All shared type definitions
        │   ├── resource.types.ts      # ResourceDefinition, ResourceManifestEntry, LoadedResource
        │   ├── form.types.ts          # FieldDef, FormDef, ValidationRule
        │   ├── display.types.ts       # ColumnDef, TabDef, FieldGroupDef
        │   ├── resolver.types.ts      # ResourceResolvers, SubResourceResolver
        │   └── utility.types.ts       # Shared utility types
        ├── formatters/                # Date, currency, account number formatters
        └── index.ts                   # Barrel export for all public API

src/
├── app/                              # Application bootstrap
│   ├── App.tsx                       # Root: CoreProviders, router, layout
│   ├── router.tsx                    # Wildcard :resourceId route → ResourceShell
│   └── providers.tsx                 # CoreProviders configuration with slots, adapters, manifest
│
├── resources/                        # Configuration + custom layer (per-resource, flat structure)
│   ├── _shared/                      # Platform-specific API adapters and utilities
│   │   ├── fineract-api-adapters.ts  # normalizeList, extractApiError, withDateFormat
│   │   ├── fineract-search-adapter.ts # Global search implementation
│   │   ├── fineract-datatable-utils.ts # Datatable column/form generation utilities
│   │   ├── fineract-datatable.types.ts # Datatable type definitions
│   │   ├── fineract-system-columns.ts  # System column definitions
│   │   └── fineract-option.types.ts  # EnumOptionData, CodeValueData, etc.
│   ├── clients/
│   │   ├── client.resource.ts        # Resource definition (columns, fields, actions, tabs)
│   │   ├── client.resolvers.ts       # Resolver (wraps apiClient calls)
│   │   ├── components/               # ONLY custom components unique to clients
│   │   │   ├── FamilyMembersTab.tsx
│   │   │   └── ClientActionsOverrides.tsx
│   │   └── index.ts                  # Barrel export
│   ├── loans/
│   │   ├── loan.resource.ts
│   │   ├── loan.resolvers.ts         # Resolver (wraps apiClient calls)
│   │   ├── components/
│   │   │   ├── LoanScheduleTab.tsx
│   │   │   ├── LoanRepaymentForm.tsx
│   │   │   └── LoanDisbursementWizard.tsx
│   │   └── index.ts
│   ├── savings/
│   │   ├── savings.resource.ts
│   │   ├── savings.resolvers.ts      # Resolver
│   │   └── index.ts                  # No custom components needed!
│   ├── loan-products/
│   │   ├── loan-product.resource.ts
│   │   └── components/
│   ├── savings-products/
│   │   └── savings-product.resource.ts
│   ├── charges/
│   │   └── charges.resource.ts
│   ├── offices/
│   │   └── offices.resource.ts
│   ├── employees/
│   │   └── employees.resource.ts
│   ├── currencies/
│   │   └── currencies.resource.ts
│   ├── codes/
│   │   └── codes.resource.ts
│   ├── data-tables/
│   │   └── data-tables.resource.ts
│   ├── manage-jobs/
│   │   └── manage-jobs.resource.ts
│   ├── accounting/
│   │   ├── accounting.resource.ts
│   │   └── components/
│   │       ├── ChartOfAccounts.tsx
│   │       └── JournalEntryForm.tsx
│   ├── manifest.ts                   # Lightweight navigation metadata (id, label, icon, group, permissions)
│   └── loader.ts                     # Lazy-loads resource definitions on-demand, merges with manifest metadata
│
├── components/
│   ├── core-impl/                    # Concrete slot implementations (injected via SlotProvider)
│   │   ├── FormEngine/               # Schema-driven form renderer
│   │   ├── ActionDispatcher/         # Action modal/panel dispatcher
│   │   ├── SearchDialog/             # Global search dialog
│   │   ├── DataTable/                # Sortable, filterable, paginated table
│   │   ├── FormStepWrapper/              # Multi-step form shell
│   │   └── DetailView/               # Entity detail layout with tabs
│   ├── ui/                           # Shadcn/ui primitives
│   ├── molecules/                    # Small reusable pieces
│   ├── organisms/                    # Larger compositions
│   └── templates/                    # Page-level layouts
│
└── theme/                            # Design system
    └── global.css
```

### Why this structure works for scale

**To add a new resource**, you create `src/resources/new-thing/new-thing.resource.ts` (with `export default`) and add an entry to `src/resources/manifest.ts`. Resources live in a flat folder structure (`src/resources/{name}/`), with no group nesting. The wildcard route and `ResourceShell` handle lazy loading. Navigation, the list view, the detail view, the create form — all generated. If you need custom behavior, add components to a `components/` folder and reference them from the resource definition.

**To modify an existing resource**, you edit its `.resource.ts` file. Add a column? One line. Add a tab? A few lines.
Add an action? A few lines. Change form fields? Edit the field schema.

**Nothing touches the framework layer.** `@zicenter/resource-kit` never imports from `src/`. Resources declare themselves _to_ the core via the registry.

---

## 5. The Resource Definition — Heart of the System

Every entity is described by a single `ResourceDefinition` object. This is the most important type in the
system. Here is the full type and a real example:

### 5.1 The ResourceDefinition type

```typescript
// Identity fields (id, label, icon, group, permissions) live ONLY in the manifest.
// ResourceDefinition contains only the behavioral/rendering configuration.
interface ResourceDefinition {
  // ── Optional metadata ──
  description?: string; // Short description for command palette

  // ── API (via OpenAPI resolvers) ──
  resolvers: ResourceResolvers; // Typed API methods wrapping the generated OpenAPI client
  idField?: string; // ID field name (default: 'id')
  templateParams?: (context) => Record<string, string>; // Extra template query params

  // ── List View ──
  listing: {
    columns: ColumnDef[]; // Table columns for the list view
    defaultSort?: { field: string; direction: 'asc' | 'desc' };
    searchFields?: string[]; // Which fields to search across
    filters?: FilterDefinition[]; // Header/toolbar filters
  };

  // ── Detail View ──
  titleField: string; // Which field to show as page title: 'displayName'
  subtitleField?: string; // Secondary field: 'accountNo'
  statusField?: string; // Field name for status badge: 'status.value'
  tabs: TabDef[]; // Tabs on the detail view
  detailFields?: FieldGroupDef[]; // Summary fields shown in the detail header

  // ── Forms (Create / Edit) ──
  createForm?: FormDef; // Schema for create form/stepper
  editForm?: FormDef; // Schema for edit form (defaults to createForm if absent)

  // ── Actions ──
  actions?: ActionDef[]; // Status-dependent actions (Activate, Close, etc.)

  // ── Sub-resources ──
  children?: { ref: string; mount: string }[]; // Nested resources

  // ── Customization Slots ──
  overrides?: {
    ListComponent?: React.ComponentType; // Replace the entire list view
    DetailComponent?: React.ComponentType; // Replace the entire detail view
    CreateComponent?: React.ComponentType; // Replace the create form
    EditComponent?: React.ComponentType; // Replace the edit form
    DetailHeader?: React.ComponentType; // Replace just the detail header
  };
}

// Manifest entries hold identity & navigation metadata (one per resource).
interface ResourceManifestEntry {
  id: string; // Unique key: 'clients', 'loan-products', etc.
  label: string; // Display name: 'Client'
  labelPlural?: string; // 'Clients' (defaults to label + 's')
  icon: string; // Icon identifier for navigation/breadcrumbs
  group: string; // Navigation group: 'core', 'products', 'system', etc.
  permissions?: {
    list?: string; // Permission code: 'READ_CLIENT'
    create?: string; // 'CREATE_CLIENT'
    update?: string;
    delete?: string;
  };
}

// The loader merges manifest metadata with the lazy-loaded definition at load time.
type LoadedResource = ResourceManifestEntry & ResourceDefinition;

interface SubResourceResolver<TEntity = any, TParent = any> {
  list: (parent: TParent) => Promise<any>; // Fetch sub-resource list
  create?: (parent: TParent, payload: any) => Promise<void>; // Create sub-resource
  delete?: (parent: TParent, subEntity: TEntity) => Promise<void>; // Delete sub-resource
}

interface ResourceResolvers {
  queryKey: string; // Cache key base for React Query
  list: (params?) => Promise<any>; // Fetch list of entities
  get: (id: number) => Promise<any>; // Fetch single entity
  template?: (params?) => Promise<any>; // Fetch form template (if available)
  create?: (payload) => Promise<any>; // Create entity
  update?: (id: number, payload) => Promise<any>; // Update entity
  delete?: (id: number) => Promise<any>; // Delete entity
}
```

### 5.2 Supporting types

```typescript
interface ColumnDef {
  key: string; // Data field path (supports dots: 'status.value')
  label: string; // Column header
  type?: 'text' | 'currency' | 'date' | 'boolean' | 'status' | 'badge' | 'link';
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: string[] | (() => Promise<string[]>);
  width?: string;
  render?: (value: any, row: any) => React.ReactNode; // Full custom render
  hidden?: boolean; // Hide from default view, available in column picker
}

interface TabDef {
  id: string;
  label: string;
  // Option A: Declarative — sub-resource table with co-located resolver
  columns?: ColumnDef[]; // If it's a sub-resource table
  resolver?: SubResourceResolver; // Data fetcher for declarative tabs
  fields?: FieldGroupDef[]; // If it's a detail panel
  // Option B: Custom component
  component?: React.ComponentType<{ entityId: string; entityData: any }>;
  // Conditional rendering
  visible?: (entityData: any) => boolean;
  permission?: string;
}

interface FieldDef {
  key: string; // Form field name / API field
  label: string;
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'textarea'
    | 'currency'
    | 'autocomplete'
    | 'custom';
  required?: boolean;
  validation?: ValidationRule[];
  // For select/multiselect — options come from template
  templateKey?: string; // Key in the /template response: 'officeOptions'
  optionLabel?: string; // Display field: 'name'
  optionValue?: string; // Value field: 'id'
  staticOptions?: { label: string; value: any }[]; // Or hardcoded options
  // Async options — fetch from API with optional search query
  asyncOptions?: (query?: string) => Promise<any[]>; // Fetches options on demand
  asyncMinChars?: number; // Min characters before fetching (default 0)
  // Dependencies
  dependsOn?: string; // Re-fetch template when this field changes
  visibleWhen?: (formValues: any) => boolean; // Conditional visibility
  // Layout
  span?: 1 | 2 | 3; // Grid column span (of 3-column grid)
  // Custom render
  component?: React.ComponentType<FieldProps>; // Full custom field
}

interface FormDef {
  // Single-page form
  fields?: FieldDef[];
  // Or multi-step stepper
  steps?: {
    id: string;
    label: string;
    icon?: string;
    fields?: FieldDef[]; // Declarative fields for this step
    component?: React.ComponentType; // Or a fully custom step component
  }[];
}

interface ActionDef {
  id: string; // 'activate', 'close', 'reject', etc.
  label: string;
  icon?: string;
  variant?: 'primary' | 'danger' | 'default';
  // When to show this action
  visibleWhen?: (entity: any) => boolean; // e.g., entity.status.value === 'Pending'
  permission?: string; // Permission code
  // What happens when clicked
  apiAction?: {
    method: 'POST' | 'PUT' | 'DELETE';
    path?: string; // Relative: '?command=activate'
    commandParam?: string; // Shorthand for ?command=X (metadata only)
  };
  resolver?: (id: number, payload?: any) => Promise<any>; // Co-located API call
  // Form to show before submitting (some actions need a date, a note, etc.)
  fields?: FieldDef[];
  // Or fully custom component
  component?: React.ComponentType<{ entity: any; onSuccess: () => void }>;
  // Confirmation
  confirm?: boolean | string; // Show confirmation dialog
}
```

### 5.3 A real example: Clients resource

```typescript
// src/resources/clients/client.resource.ts

import { ResourceDefinition } from '@zicenter/resource-kit';
import { FamilyMembersTab } from './components/FamilyMembersTab';
import { clientResolvers } from './client.resolvers';

// Identity fields (id, label, icon, group, permissions) are in manifest.ts, not here.
export const clientResource: ResourceDefinition = {
  description: 'Manage client records and KYC',

  resolvers: clientResolvers,

  // ── List View ──
  listing: {
    columns: [
      { key: 'displayName', label: 'Name', sortable: true, type: 'link' },
      { key: 'accountNo', label: 'Account No', sortable: true },
      { key: 'externalId', label: 'External ID' },
      { key: 'status.value', label: 'Status', sortable: true, type: 'status' },
      { key: 'officeName', label: 'Office', sortable: true, filterable: true },
      { key: 'activationDate', label: 'Activated', sortable: true, type: 'date' },
    ],
    defaultSort: { field: 'displayName', direction: 'asc' },
    searchFields: ['displayName', 'accountNo', 'externalId'],
  },

  // ── Detail View ──
  titleField: 'displayName',
  subtitleField: 'accountNo',
  statusField: 'status.value',
  detailFields: [
    {
      label: 'Summary',
      fields: [
        { key: 'officeName', label: 'Office' },
        { key: 'staffName', label: 'Loan Officer' },
        { key: 'activationDate', label: 'Activation Date', type: 'date' },
        { key: 'legalForm.value', label: 'Legal Form' },
      ],
    },
  ],
  tabs: [
    { id: 'general', label: 'General', component: ClientGeneralTab },
    { id: 'family', label: 'Family Members', component: FamilyMembersTab },
    {
      id: 'address',
      label: 'Address',
      columns: [
        { key: 'addressType', label: 'Address Type' },
        { key: 'street', label: 'Street' },
        { key: 'city', label: 'City' },
      ],
    },
    {
      id: 'identities',
      label: 'Identities',
      columns: [
        { key: 'documentType.name', label: 'Type' },
        { key: 'documentKey', label: 'ID Number' },
        { key: 'status', label: 'Status', type: 'status' },
      ],
    },
    {
      id: 'documents',
      label: 'Documents',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'fileName', label: 'File' },
        { key: 'size', label: 'Size' },
      ],
    },
    {
      id: 'notes',
      label: 'Notes',
      columns: [
        { key: 'note', label: 'Note' },
        { key: 'createdByUsername', label: 'Created By' },
        { key: 'createdOn', label: 'Date', type: 'date' },
      ],
    },
  ],

  // ── Create Form ──
  createForm: {
    steps: [
      {
        id: 'general',
        label: 'General',
        icon: 'user',
        fields: [
          {
            key: 'officeId',
            label: 'Office',
            type: 'select',
            templateKey: 'officeOptions',
            optionLabel: 'name',
            optionValue: 'id',
            required: true,
            span: 2,
          },
          {
            key: 'legalFormId',
            label: 'Legal Form',
            type: 'select',
            templateKey: 'clientLegalFormOptions',
            optionLabel: 'value',
            optionValue: 'id',
          },
          {
            key: 'firstname',
            label: 'First Name',
            type: 'text',
            required: true,
            visibleWhen: (v) => v.legalFormId !== 2,
          },
          {
            key: 'lastname',
            label: 'Last Name',
            type: 'text',
            required: true,
            visibleWhen: (v) => v.legalFormId !== 2,
          },
          {
            key: 'fullname',
            label: 'Full Name',
            type: 'text',
            required: true,
            visibleWhen: (v) => v.legalFormId === 2,
          },
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
          {
            key: 'genderId',
            label: 'Gender',
            type: 'select',
            templateKey: 'genderOptions',
            optionLabel: 'name',
            optionValue: 'id',
          },
          {
            key: 'staffId',
            label: 'Staff',
            type: 'select',
            templateKey: 'staffOptions',
            optionLabel: 'displayName',
            optionValue: 'id',
            dependsOn: 'officeId',
          },
          { key: 'submittedOnDate', label: 'Submitted On', type: 'date', required: true },
          { key: 'activationDate', label: 'Activation Date', type: 'date' },
          {
            key: 'savingsProductId',
            label: 'Default Savings',
            type: 'select',
            templateKey: 'savingProductOptions',
            optionLabel: 'name',
            optionValue: 'id',
          },
          { key: 'externalId', label: 'External ID', type: 'text' },
          { key: 'mobileNo', label: 'Mobile No', type: 'text' },
          { key: 'isStaff', label: 'Is Staff', type: 'checkbox' },
        ],
      },
      {
        id: 'family',
        label: 'Family Members',
        icon: 'users',
        component: FamilyMembersStepForm,
      },
      {
        id: 'address',
        label: 'Address',
        icon: 'map-pin',
        fields: [
          /* address fields from address template */
        ],
      },
    ],
  },

  // ── Actions — each carries its own resolver ──
  actions: [
    {
      id: 'activate',
      label: 'Activate',
      variant: 'primary',
      visibleWhen: (e) => e.status?.value === 'Pending',
      apiAction: { method: 'POST', commandParam: 'activate' },
      resolver: clientAction('activate'),
      fields: [{ key: 'activationDate', label: 'Activation Date', type: 'date', required: true }],
      permission: 'ACTIVATE_CLIENT',
    },
    {
      id: 'close',
      label: 'Close',
      variant: 'danger',
      visibleWhen: (e) => e.status?.value === 'Active',
      apiAction: { method: 'POST', commandParam: 'close' },
      resolver: clientAction('close'),
      fields: [
        { key: 'closureDate', label: 'Closure Date', type: 'date', required: true },
        {
          key: 'closureReasonId',
          label: 'Reason',
          type: 'select',
          templateKey: 'narpirations',
          optionLabel: 'name',
          optionValue: 'id',
        },
      ],
      confirm: 'Are you sure you want to close this client?',
      permission: 'CLOSE_CLIENT',
    },
    {
      id: 'reject',
      label: 'Reject',
      visibleWhen: (e) => e.status?.value === 'Pending',
      apiAction: { method: 'POST', commandParam: 'reject' },
      resolver: clientAction('reject'),
      fields: [
        { key: 'rejectionDate', label: 'Rejection Date', type: 'date', required: true },
        {
          key: 'rejectionReasonId',
          label: 'Reason',
          type: 'select',
          templateKey: 'closureReasons',
          optionLabel: 'name',
          optionValue: 'id',
        },
      ],
      permission: 'REJECT_CLIENT',
    },
    {
      id: 'transfer',
      label: 'Transfer Client',
      visibleWhen: (e) => e.status?.value === 'Active',
      apiAction: { method: 'POST', commandParam: 'proposeTransfer' },
      resolver: clientAction('proposeTransfer'),
      fields: [
        {
          key: 'destinationOfficeId',
          label: 'Destination Office',
          type: 'select',
          templateKey: 'officeOptions',
          optionLabel: 'name',
          optionValue: 'id',
          required: true,
        },
        { key: 'transferDate', label: 'Transfer Date', type: 'date', required: true },
        { key: 'note', label: 'Note', type: 'textarea' },
      ],
      permission: 'PROPOSETRANSFER_CLIENT',
    },
    {
      id: 'assign-staff',
      label: 'Assign Staff',
      visibleWhen: (e) => e.status?.value === 'Active',
      apiAction: { method: 'POST', commandParam: 'assignStaff' },
      resolver: clientAction('assignStaff'),
      fields: [
        {
          key: 'staffId',
          label: 'Staff',
          type: 'select',
          templateKey: 'staffOptions',
          optionLabel: 'displayName',
          optionValue: 'id',
          required: true,
        },
      ],
      permission: 'ASSIGNSTAFF_CLIENT',
    },
  ],

  children: [
    { ref: 'loans', mount: 'loans-accounts' },
    { ref: 'savings', mount: 'savings-accounts' },
    { ref: 'shares', mount: 'shares-accounts' },
  ],

  // permissions are declared in manifest.ts, not in the resource definition
};
```

Notice what this achieves: the **entire clients module** — list, detail view with 7 tabs, create wizard with 3 steps, 5+
status-dependent actions, child resource mounting — is described in a single file plus a manifest entry. No routing file. No module file. No list component. No detail component. The framework renders everything from this definition, and the loader merges identity metadata from the manifest at load time.

Compare this to the Angular app, where the clients module alone has **80 TypeScript files**, 22 resolvers, and 45+
manually imported components in `clients.module.ts`.

---

## 6. The Framework Layer — How It Works

### 6.1 Resolvers — Typed API Layer

Replace 57 hand-written service files with **typed resolvers** that use `apiClient` (the shared Axios instance from
`@zicenter/resource-kit`) and platform-specific API adapters from `src/resources/_shared/fineract-api-adapters.ts`.

Each resource defines a `resolvers` object in its own `{name}.resolvers.ts` file. The resolver uses `apiClient` to
make HTTP calls and maps them to a standard `ResourceResolvers` interface:

```typescript
// src/resources/clients/client.resolvers.ts
import { apiClient, ResourceResolvers } from '@zicenter/resource-kit';
import { normalizeList, withDateFormat } from '@/resources/_shared/fineract-api-adapters';

export const clientResolvers: ResourceResolvers = {
  queryKey: 'clients',
  list: async (params) => {
    const { data } = await apiClient.get('/api/v1/clients', { params });
    return normalizeList(data);
  },
  get: async (id) => {
    const { data } = await apiClient.get(`/api/v1/clients/${id}`);
    return data;
  },
  template: async (params) => {
    const { data } = await apiClient.get('/api/v1/clients/template', { params });
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post('/api/v1/clients', withDateFormat(payload));
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/api/v1/clients/${id}`, withDateFormat(payload));
    return data;
  },
};

// Actions and tabs carry their own resolvers in the resource definition file
```

**Key design decisions:**

- **Resources own their API calls.** Each resolver file uses `apiClient` (the shared Axios instance from
  `@zicenter/resource-kit`) and platform-specific API adapters from `@/resources/_shared/fineract-api-adapters`
  (e.g., `normalizeList`, `withDateFormat`, `extractApiError`).
- **Co-located resolvers.** Actions carry their own `resolver` function and tabs carry their own `resolver` object
  (a `SubResourceResolver` with `list`). This eliminates fragile string-key coupling between tab IDs and resolver maps.
- **Registry-time validation.** When `registerResource()` is called, the registry validates that resolver methods exist
  for declared forms, actions with `apiAction` have a `resolver`, tabs with `columns` have a `resolver`, and `queryKey`
  values are unique across resources.

React Query hooks call resolvers directly:

- `useResource(def)` → calls `def.resolvers.get(id)`
- `useResourceList(def, params)` → calls `def.resolvers.list(params)`
- `useResourceTemplate(def, params)` → calls `def.resolvers.template(params)` (enabled only if resolver has `template`)
- `useResourceMutation(def, type)` → calls `def.resolvers.create/update/delete`
- `useResourceAction(def, actionDef)` → calls `actionDef.resolver(id, payload)`

This eliminates **all 276 resolvers** and **all 57 services** from the Angular app.

### 6.2 Manifest, Lazy Loader & Wildcard Router

Navigation metadata lives in `src/resources/manifest.ts` — a lightweight array of `ResourceManifestEntry` objects (`{ id, label, icon, group, permissions }`) with no resolver imports. Identity fields (`id`, `label`, `labelPlural`, `icon`, `group`, `permissions`) live **only** in the manifest and are **not** duplicated in `ResourceDefinition`.

Resource definitions are lazily loaded by `src/resources/loader.ts` using `import.meta.glob('./**/*.resource.ts')` (non-eager). The loader builds a map at startup and caches definitions on first access with in-flight deduplication. At load time, the loader **merges** the manifest entry with the lazy-loaded definition to produce a `LoadedResource` (`ResourceManifestEntry & ResourceDefinition`).

Routing is **entirely owned by the consumer**. Core-engine has zero imports from `react-router-dom` and makes no assumptions about URL shapes. A typical consumer mounts a wildcard `:resourceId` route that renders a `ResourceShell` which validates the resource exists in the manifest, loads the definition, wraps children in `PermissionGuard`, and passes the merged `LoadedResource` via `useOutletContext`. For example:

```
/:resourceId                → ResourceShell → <ResourceListPage />
/:resourceId/create         → ResourceShell → <ResourceCreatePage />
/:resourceId/:id            → ResourceShell → <ResourceDetailPage />
/:resourceId/:id/edit       → ResourceShell → <ResourceEditPage />
```

If a resource has `overrides.ListComponent`, the override replaces `ResourceListPage`. This means you opt into custom
behavior only when the generic view isn't enough.

Any core-engine hook that needs to read URL query params or trigger navigation (e.g. `useVisibleTabs`, `useResourceFormDef`) does so via the `NavigationAdapter` — see §6.2a. The consumer implements the adapter with whatever router it uses; the navigation reads the manifest and renders module groups + links based on whatever shape the consumer chooses. Breadcrumbs, tabs/MDI, and the visit dashboard are consumer concerns — core-engine ships no `TabProvider`, `useBreadcrumbs`, or visit tracker.

### 6.2a NavigationAdapter — Router Boundary

Core-engine is router-agnostic. The `NavigationProvider` contract in `providers/NavigationProvider.tsx` defines:

```typescript
interface NavigationAdapter {
  // Hook returning [params, setter] — typical impl wraps react-router's useSearchParams
  useQueryParams: () => [
    URLSearchParams,
    (next: Record<string, string>, opts?: { replace?: boolean }) => void,
  ];

  // Navigation callbacks — consumer decides the URL shape
  navigateToList: (resourceId: string) => void;
  navigateToDetail: (resourceId: string, entityId: string) => void;
  navigateToCreate: (resourceId: string) => void;
  navigateToEdit: (resourceId: string, entityId: string) => void;
}
```

Consumers pass an instance via `CoreProviders` config:

```tsx
<CoreProviders config={{ ..., navigation: myNavigationAdapter }}>
```

Because `useQueryParams` is a real React hook, `CoreProviders` must be mounted **inside** the consumer's router context. A typical setup uses a `RootLayout` route that renders `<Providers><Outlet/></Providers>`.

### 6.3 The Form Engine

Instead of 10+ hand-coded stepper components per entity, the form engine renders forms from `FieldDef[]` arrays.

**How it works:**

1. The create/edit page calls `useResourceTemplate()` to fetch dropdown options from the API.
2. It passes the template response + the `FormDef` to `<FormEngine />`.
3. `FormEngine` iterates over fields, resolves `templateKey` to the matching array in the template response, renders the
   appropriate input component for each `type`, handles conditional visibility (`visibleWhen`), handles field
   dependencies (`dependsOn` triggers a re-fetch of the template with the current field value as a param), and manages
   validation.
4. For stepper forms, `<FormStepWrapper />` wraps `<FormEngine />` per step, with step-level validation gating.

**Field dependency example (office → staff):**
When `officeId` changes and `staffId` has `dependsOn: 'officeId'`, the form engine calls the template endpoint again
with `?officeId=X` and updates the `staffOptions` dropdown. This mirrors exactly how the Angular app works (e.g.,
`ClientGeneralStepComponent.buildDependencies()`) but without any custom code.

**Async options:** For select/autocomplete fields that need to fetch options from an API (e.g., searching clients by
name), set `asyncOptions` instead of `templateKey`. The `AsyncSelectField` component renders a combobox (Popover +
Command) with debounced search (300ms) and TanStack Query for caching/dedup. Set `asyncMinChars` to require a minimum
number of characters before fetching (useful for large datasets). The priority chain for option sources is:
`staticOptions` > `asyncOptions` > `templateKey`.

**Escape hatch:** Any step or field can provide a `component` override for fully custom rendering, while still
participating in the overall form state and stepper flow.

### 6.4 Generic DataTable

A single `<DataTable>` component handles:

- Rendering columns from `ColumnDef[]`
- Server-side pagination (always enabled — `manualPagination` with `offset`/`limit` params)
- Column-level filtering (dropdowns for filterable columns, text search for others)
- Pagination with configurable page sizes
- Row click → navigate to `/{resource.id}/{row[idField]}`
- Column visibility picker
- Export to CSV
- Bulk selection + bulk actions
- Custom cell rendering via `render` function in `ColumnDef`
- Status badge rendering for `type: 'status'` columns
- Currency formatting for `type: 'currency'` columns
- Responsive: columns with `hidden: true` are excluded on small screens

### 6.5 Generic Detail View

`<ResourceDetailPage>` renders:

1. **Header**: Entity title (`titleField`), subtitle (`subtitleField`), status badge (`statusField`), action buttons (
   filtered by `visibleWhen` and `permission`).
2. **Summary fields**: `detailFields` rendered as a key-value grid.
3. **Tabs**: Rendered from `TabDef[]`. For declarative tabs with `columns`, the component calls
   `tab.resolver.list(entityId)` to fetch the data and renders it as a table. Custom tabs render their
   `component`.

### 6.6 Action Dispatcher

When a user clicks an action button, the `ActionDispatcher`:

1. If `confirm` is set, shows a confirmation dialog.
2. If `fields` are set, renders a modal form using the form engine.
3. On submit, calls `actionDef.resolver(id, payload)` — the resolver is co-located on the action definition.
4. On success, invalidates React Query cache and shows a success toast.
5. If `component` is set instead, renders the custom component in a modal.

This replaces the Angular pattern of 17 flag-guarded child components with zero component imports.

---

## 7. State Management

### 7.1 Server state: React Query

All API data is managed by React Query (TanStack Query). This gives us:

- Automatic caching and deduplication (multiple components requesting the same client data make one API call)
- Background re-fetching on window focus
- Optimistic updates for mutations
- Automatic retry on failure
- Cache invalidation after mutations (creating a loan invalidates the client's accounts tab)

**Query key convention** (derived from `resolvers.queryKey`):

```
[queryKey, 'list', params]           → list
[queryKey, 'detail', id]             → single entity
[queryKey, 'template', params]       → template
[queryKey, id, subResourceId]        → sub-resource
```

### 7.2 Client state: React Context (minimal)

Global client state is managed through `CoreProviders` from `@zicenter/resource-kit`, which bundles:

- **Auth context**: current user, token, permissions, login/logout
- **UI context**: command palette open, active notifications
- **Manifest context**: resource navigation metadata (injected from app layer)
- **Notification context**: abstract toast interface (concrete implementation injected from app layer)
- **Slot context**: component slot registry (concrete UI implementations injected from app layer)
- **ApiAdapter context**: Platform-specific API helpers (normalizeList, etc., injected from app layer)

Everything else lives in component state or URL state (search params for filters, route params for entity IDs).

### 7.3 URL as source of truth for navigation state

Filters, sort order, pagination, active tab — all encoded in URL search params. This means:

- Deep-linkable filtered views
- Browser back/forward works perfectly
- Shareable URLs
- No lost state on refresh

---

## 8. Permission System

### 8.1 How it works

On login, the auth context fetches the user's roles and their associated permission codes from the API (
`/users/{userId}?associations=all`). These are stored in the auth context.

Every resource's manifest entry declares `permissions` for each CRUD operation (these are part of `ResourceManifestEntry`, not `ResourceDefinition`). Every action declares its `permission` code. Every tab can declare a `permission`.

### 8.2 Where permissions are enforced

- **Navigation**: Items are hidden if the user lacks the `list` permission for that resource.
- **List view**: The "Create New" button is hidden if the user lacks `create` permission.
- **Detail view**: The "Edit" button is hidden without `update` permission.
- **Actions**: Each action button is hidden without its specific permission.
- **Tabs**: Tabs with a `permission` are hidden when not authorized.
- **Routes**: The route guard redirects to "Not Authorized" if the user navigates directly to a protected URL.

### 8.3 The `usePermission` hook

```
const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

// In a component
if (!hasPermission('CREATE_CLIENT')) return null;
```

This is also exposed as a component for declarative use in JSX:

```
<Can permission="ACTIVATE_CLIENT">
  <ActivateButton />
</Can>
```

---

## 9. The Template Pattern

The `GET /resource/template` endpoints return the allowed
options for form fields — the list of offices, staff members, gender codes, loan products, etc. These are not static;
they change based on the tenant's configuration.

### How the form engine handles this

1. When a create or edit form mounts, it calls `useResourceTemplate(resourceDef)`.
2. The template response is a bag of arrays (e.g.,
   `{ officeOptions: [...], genderOptions: [...], staffOptions: [...] }`).
3. Each `FieldDef` with `type: 'select'` declares a `templateKey` that maps to one of these arrays. Alternatively, a
   field can use `staticOptions` for hardcoded values or `asyncOptions` for on-demand API fetching (e.g., searching
   clients by name). The resolution order is: `staticOptions` > `asyncOptions` > `templateKey`.
4. The form engine resolves the option source and renders a dropdown (or an async combobox for `asyncOptions`).
5. When a field with `dependsOn` changes, the engine re-fetches the template with the dependency value as a query
   param (e.g., `?officeId=3`), and updates only the dependent field's options.

This completely replaces the pattern in the Angular app where each component manually subscribes to form value changes
and calls service methods to re-fetch template data.

---

## 10. Handling Complex Modules (When Declarative Isn't Enough)

Some modules have business logic too complex for declarative configuration. The architecture handles this through the \*
\*override escape hatch\*\* — any layer of the generic rendering can be replaced by a custom component while still
participating in the overall system.

### 10.1 Loan module

Loans are the most complex resource. The resource definition handles the standard parts (list columns, detail tabs,
basic actions), but these need custom components:

- **Loan schedule tab**: A complex interactive table with repayment schedule calculations that depend on interest rate
  type, amortization method, and repayment strategy. This is a custom `TabDef.component`.
- **Loan disbursement**: A multi-step process with tranches, charges, and fund sources. This is a custom
  `ActionDef.component`.
- **Loan repayment form**: Needs a running balance calculator. Custom action component.
- **Loan product creation**: 10+ step wizard with complex interdependencies between accounting rules, interest method,
  and charges. Uses `overrides.CreateComponent` but still leverages the form engine for individual steps.

### 10.2 Accounting module

Chart of accounts, journal entries, and financial activity mappings have tree structures and double-entry logic. These
use `overrides.ListComponent` and `overrides.CreateComponent` but share the generic detail view and permission system.

### 10.3 Data tables (custom tables)

Data tables are themselves a meta-system — tables whose schema is defined at runtime. The data tables
resource uses a custom detail component that dynamically generates column definitions and form fields from the data
table's schema definition, making it a "resource definition factory."

### Key point

These overrides don't break the system. The sidebar still shows loans. The breadcrumbs still work. Permissions still
apply. React Query still caches. The custom component just replaces the rendering, not the plumbing.

---

## 11. Module Inventory — Migration Map

Below is every module from the Angular app, its complexity level, and the migration approach:

| Angular Module                | Files | Approach                                       | Custom Components Needed                                                                        |
| ----------------------------- | ----- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Clients                       | 80    | Resource definition + overrides                | FamilyMembersTab, FamilyMemberDialog                                                            |
| Loans                         | 117   | Resource definition + heavy overrides          | ScheduleTab, DisbursementWizard, RepaymentForm, WriteOffForm, RescheduleForm, GLIM              |
| Savings                       | 66    | Resource definition + some overrides           | TransactionForm, InterestCalculation                                                            |
| Products > Loan Products      | ~45   | Resource definition + CreateComponent override | LoanProductWizard (10 steps with complex interdependencies)                                     |
| Products > Savings Products   | ~25   | Resource definition                            | None (all declarative)                                                                          |
| Products > Share Products     | ~20   | Resource definition                            | None                                                                                            |
| Products > Charges            | ~15   | Resource definition                            | None                                                                                            |
| Products > Fixed Deposits     | ~25   | Resource definition + some overrides           | InterestRateChart                                                                               |
| Products > Recurring Deposits | ~25   | Resource definition + some overrides           | InterestRateChart                                                                               |
| Products > Floating Rates     | ~10   | Resource definition                            | None                                                                                            |
| Products > Tax                | ~15   | Resource definition                            | None                                                                                            |
| Products > Delinquency        | ~10   | Resource definition                            | None                                                                                            |
| Products > Product Mix        | ~8    | Resource definition + custom list              | ProductMixMatrix                                                                                |
| Organization > Offices        | ~12   | Resource definition                            | OfficeHierarchyTree                                                                             |
| Organization > Employees      | ~10   | Resource definition                            | None                                                                                            |
| Organization > Currencies     | ~6    | Resource definition                            | None                                                                                            |
| Organization > Manage Funds   | ~6    | Resource definition                            | None                                                                                            |
| Organization > Holidays       | ~10   | Resource definition                            | None                                                                                            |
| Organization > Payment Types  | ~6    | Resource definition                            | None                                                                                            |
| Organization > Working Days   | ~4    | Resource definition                            | None                                                                                            |
| Organization > Password Prefs | ~4    | Resource definition                            | None                                                                                            |
| Organization > SMS Campaigns  | ~10   | Resource definition                            | None                                                                                            |
| Organization > Tellers        | ~15   | Resource definition                            | CashierAllocation                                                                               |
| Organization > Bulk Import    | ~8    | Standalone feature                             | BulkImportWizard                                                                                |
| System > Codes                | ~8    | Resource definition                            | CodeValuesEditor                                                                                |
| System > Data Tables          | ~8    | Resource definition + custom                   | DynamicSchemaBuilder, DynamicDataView                                                           |
| System > Hooks                | ~8    | Resource definition                            | None                                                                                            |
| System > Roles & Perms        | ~10   | Resource definition + custom                   | PermissionTreeEditor                                                                            |
| System > Manage Jobs          | ~10   | Resource definition + custom                   | JobSchedulerPanel                                                                               |
| System > Manage Reports       | ~10   | Resource definition                            | None                                                                                            |
| System > External Services    | ~6    | Resource definition                            | None                                                                                            |
| System > Configurations       | ~8    | Resource definition                            | ConfigEditor                                                                                    |
| System > Audit Trails         | ~6    | Resource definition                            | None                                                                                            |
| System > Maker-Checker        | ~6    | Resource definition                            | None                                                                                            |
| System > Entity Mapping       | ~6    | Resource definition                            | MappingMatrix                                                                                   |
| System > Account Number Prefs | ~4    | Resource definition                            | None                                                                                            |
| Accounting                    | 60    | Mixed: Resource defs + custom                  | ChartOfAccounts (tree), JournalEntryForm (double-entry), TrialBalance, FinancialActivityMapping |
| Groups                        | 35    | Resource definition                            | GroupMembersManager                                                                             |
| Centers                       | 30    | Resource definition                            | CenterAttendance                                                                                |
| Shares                        | 31    | Resource definition                            | None                                                                                            |
| Deposits (Fixed)              | ~40   | Resource definition + overrides                | PrematureClose, InterestRateChart                                                               |
| Deposits (Recurring)          | ~40   | Resource definition + overrides                | InstallmentSchedule                                                                             |
| Templates                     | 11    | Resource definition                            | TemplateEditor (Mustache/CKEditor)                                                              |
| Users                         | 10    | Resource definition                            | None                                                                                            |
| Reports                       | 14    | Resource definition + custom                   | ReportRunner (Pentaho/Table/Chart)                                                              |
| Tasks (Maker-Checker)         | ~10   | Resource definition                            | None                                                                                            |
| Remittances                   | ~8    | Resource definition                            | None                                                                                            |
| Navigation                    | ~12   | Replaced by shell layout                       | None (framework layer)                                                                          |
| Search                        | ~6    | Framework feature                              | GlobalSearch (in toolbar)                                                                       |
| Collections                   | ~8    | Resource definition                            | CollectionSheet                                                                                 |
| Config Wizard                 | ~20   | Standalone feature                             | ConfigWizardFlow                                                                                |

**Summary**: Of the ~695 Angular components, roughly **~50 custom components** are needed in the React rebuild.
Everything else is generated from resource definitions.

---

## 12. Technology Choices

| Concern       | Choice                                      | Rationale                                                               |
| ------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Framework     | React 19 with TypeScript                    | Ecosystem, hiring pool, component model                                 |
| Routing       | React Router v7 (data router)               | Loaders mirror the resolver pattern                                     |
| Server state  | TanStack Query (React Query) v5             | Replaces all resolvers and services                                     |
| Forms         | React Hook Form + Zod v4                    | Performant, uncontrolled by default, schema validation                  |
| UI Components | Shadcn/ui + Radix primitives                | Unstyled primitives + Tailwind, no vendor lock-in, copy-paste ownership |
| Styling       | Tailwind CSS v4                             | CSS-based config, utility-first, consistent with shadcn                 |
| Tables        | TanStack Table v8                           | Headless, supports server-side pagination, sorting, filtering           |
| Icons         | Lucide React                                | Consistent icon set, tree-shakeable                                     |
| I18n          | react-i18next                               | Same translation file format as existing app                            |
| Date handling | date-fns                                    | Tree-shakeable, immutable, replaces moment.js                           |
| HTTP          | Axios                                       | Interceptor system for auth/tenant headers                              |
| Build         | Vite                                        | Fast HMR, good code-splitting support                                   |
| Structure     | pnpm monorepo (workspace: `packages/*`)     | Core engine as separate package, clean import boundaries                |
| Testing       | Vitest + React Testing Library + Playwright | Unit → Integration → E2E pyramid                                        |

---

## 13. Guiding Principles for Contributors

These rules should be enforced in PR reviews and linting:

1. **Never import a resource from the framework layer.** `@zicenter/resource-kit` (`packages/resource-kit/`) must have
   zero imports from `src/`. Information flows one direction: resources declare themselves to the core via the registry.

2. **Exhaust the declarative approach before writing custom code.** If you're writing a custom component, ask: could
   this be a `ColumnDef.render` function? A `FieldDef.visibleWhen`? A `TabDef` with `columns`? A resolver helper like
   `withDateFormat`? Only reach for a custom component when the answer is genuinely no.

3. **Custom components must accept standard props.** Every custom tab, form step, or action component receives
   `{ entityId, entityData, onSuccess }` (or the appropriate subset). This keeps them composable with the generic shell.

4. **One resource definition per file.** Never combine multiple resources in one file. The file name must match the
   pattern `{name}.resource.ts`.

5. **API calls go through resolvers and `useResource*` hooks.** Each resource defines resolvers that use `apiClient`
   from `@zicenter/resource-kit`. Hooks call resolvers, never raw Axios. All data flows through React Query so caching,
   deduplication, and invalidation work correctly.

6. **URL is the source of truth for navigation state.** Filters, sort, page, active detail tab — all in search params. Core-engine hooks read/write these only via the `NavigationAdapter` — they never import from a specific router. Consumers own the URL shape.

7. **Permissions are declared, not coded.** Don't write `if (user.role === 'admin')`. Declare
   `permission: 'CREATE_CLIENT'` in the resource definition and let the framework handle it.

8. **Keep the core-engine headless.** `@zicenter/resource-kit` contains types, hooks, providers, contracts, formatters,
   and the API client — never UI components, platform-specific logic, routing, or navigation UI (no `TabProvider`, no `useBreadcrumbs`, no visit tracker). Concrete UI implementations live in `src/components/core-impl/` and are injected via the slot system. The consumer's router is bridged through the `NavigationAdapter`. Platform-specific adapters live in `src/resources/_shared/`.

---

## 14. Migration Strategy

### Phase 1: Foundation (Weeks 1–3)

Build the framework layer: API client, React Query hooks, registry, route generator, shell layout (sidebar + toolbar +
breadcrumbs), DataTable, and FormEngine. Validate with a single simple resource (Offices or Codes) end-to-end.

### Phase 2: System & Organization (Weeks 4–6)

Migrate all system and organization resources. These are the simplest (mostly pure CRUD) and will stress-test the form
engine with various field types and the template pattern.

### Phase 3: Products (Weeks 7–9)

Migrate product definitions. Loan products are the hardest here due to their 10-step wizard — build the stepper form
override pattern here.

### Phase 4: Core Banking (Weeks 10–14)

Migrate clients, loans, savings, shares, deposits, and groups. These are the most complex resources with the most custom
components. Build them with full action support.

### Phase 5: Accounting & Reports (Weeks 15–16)

Migrate accounting (requires custom tree/double-entry components) and reports (requires custom report runner).

### Phase 6: Polish (Weeks 17–18)

Global search, configuration wizard, maker-checker tasks, collection sheets, bulk import. Responsive design pass.
Permission audit. Performance optimization (code splitting per resource group).

---

## 15. Conclusion

The existing Angular app works, but its architecture punishes contribution. Adding a simple new entity means creating
10+ files across 4+ directories. The React rebuild inverts this — the framework does the repetitive work, and
contributors focus on what makes each resource unique.

The resource definition is the contract. If your resource can be described by columns, fields, tabs, and actions, the
system handles everything else. If it can't, override exactly the parts that need customization and get everything else
for free.

This is not a rewrite for the sake of rewriting. It is a structural investment that turns a 695-component monolith into
a ~50-custom-component system backed by a generic engine — making it genuinely feasible for a team to cover the platform's
entire API surface and keep covering it as it grows.
