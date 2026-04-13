# @zicenter/resource-kit

Headless, framework-agnostic toolkit for building data-driven admin UIs in React. Declare a `ResourceDefinition` — columns, fields, tabs, actions, resolvers — and `resource-kit` wires up list, detail, and form views through slots you provide.

**Core principle:** adding a new resource should require writing a definition object, never plumbing. No controllers, no routers per resource, no handwritten hooks — just data.

Ships with **zero visuals**: no Tailwind, no components with baked-in styles, no layout assumptions. You bring the UI kit; `resource-kit` handles state, routing glue, data fetching, validation, permissions, tabs, actions, search, and i18n.

Built on [`@zicenter/form-kit`](https://github.com/ZiCenter/form-kit) for forms, TanStack Query for data, React Router for routing, and React Hook Form + Zod for validation.

## Install

Consumed as a git-based npm dependency:

```json
{
  "dependencies": {
    "@zicenter/resource-kit": "github:ZiCenter/resource-kit#main"
  }
}
```

On `pnpm install`, pnpm clones both `resource-kit` and its git dep `form-kit`, and runs the `prepare` hook (`tsup`) on each. Consumers always resolve against built output in `dist/`.

**Required pnpm config** — the `prepare` hook must be allowlisted:

```yaml
# pnpm-workspace.yaml (or root package.json)
onlyBuiltDependencies:
  - '@zicenter/resource-kit'
  - '@zicenter/form-kit'
```

### Peer dep identity gotcha

If multiple workspace packages depend on `resource-kit` directly, pnpm may create **separate installs** with different peer-dep hashes, causing TypeScript "two instances of the same class" errors. The fix: declare `resource-kit` as a **peer dependency** in shared packages (e.g., your UI kit), and only as a direct dependency in end-consumer apps. Mirror it into `devDependencies` of the shared package if you need it resolved for local typecheck.

### Pinning

Use a commit SHA for reproducible installs once stable:

```json
"@zicenter/resource-kit": "github:ZiCenter/resource-kit#<commit-sha>"
```

## Entry points

| Import | Purpose |
|---|---|
| `@zicenter/resource-kit` | Primary API — types, hooks, providers, helpers |
| `@zicenter/resource-kit/errors` | `AppError`, `ValidationError`, `AuthenticationError` |
| `@zicenter/resource-kit/auth-types` | `CoreAuthUser`, `AuthAdapter`, `SessionStorage` |
| `@zicenter/resource-kit/i18n/provider` | i18n provider wrapper |

## Peer dependencies

| Package | Version |
|---|---|
| `react`, `react-dom` | `^19` |
| `react-router-dom` | `^7` |
| `react-hook-form` | `^7` |
| `@hookform/resolvers` | `^5` |
| `@tanstack/react-query` | `^5` |
| `@tanstack/react-table` | `^8` |
| `zod` | `^4` |
| `axios` | `^1` |
| `date-fns` | `^3` or `^4` |
| `i18next` | `^25` |
| `react-i18next` | `^16` |

`@zicenter/form-kit` is a direct dependency (resolved transitively).

## Quick start

### 1. Wrap your app

```tsx
import { CoreProviders } from '@zicenter/resource-kit';
import { defaultSlots } from './slots';

<CoreProviders
  slots={defaultSlots}
  authAdapter={myAuthAdapter}
  notificationAdapter={myNotificationAdapter}
  navigationAdapter={myNavigationAdapter}
  manifest={RESOURCE_MANIFEST}
>
  <App />
</CoreProviders>
```

`CoreProviders` composes: `SlotProvider → ManifestProvider → NotificationProvider → QueryClientProvider → UIProvider → Auth → Search`.

### 2. Define a resource

```ts
import { Resource, defineTableTab } from '@zicenter/resource-kit';

export const userResource = new Resource({
  id: 'users',
  label: 'Users',
  columns: [
    { accessor: 'name',  header: 'Name' },
    { accessor: 'email', header: 'Email' },
    { accessor: 'role',  header: 'Role', cellType: 'badge' },
  ],
  fields: [
    { name: 'name',  label: 'Name',  type: 'text',   required: true },
    { name: 'email', label: 'Email', type: 'text',   required: true, validators: ['email'] },
    { name: 'role',  label: 'Role',  type: 'select', options: roleOptions },
  ],
  tabs: [
    defineTableTab({ id: 'sessions', label: 'Sessions', resource: 'sessions', foreignKey: 'userId' }),
  ],
  actions: [
    { id: 'suspend', label: 'Suspend', kind: 'confirm', run: (ctx) => api.suspend(ctx.record.id) },
  ],
  resolvers: {
    list:   ({ params }) => api.users.list(params),
    detail: ({ id })     => api.users.get(id),
    create: ({ data })   => api.users.create(data),
    update: ({ id, data }) => api.users.update(id, data),
    delete: ({ id })     => api.users.remove(id),
  },
});
```

### 3. Use it

Hooks read from the resource context and handle caching, mutations, errors, and permissions:

```tsx
const { data, isLoading } = useResource();
const create = useResourceCreate();
const update = useResourceUpdate();
const { visible } = useVisibleActions();
const can = usePermission('users.edit');
```

## Public API

### Types
`Resource`, `LoadedResource`, `ResourceManifestEntry`, `ResourceListDefinition`, `ResourceHeaderDefinition`, `ResourceResolvers`, `ListParams`, `NormalizedList`, `TabResolver`, `ColumnDef`, `TabDef`, `TableTabDef`, `ActionDef` (+ `Confirm`/`Form`/`SubResource*` variants), `TabSection`, `TabSectionProps`.

Re-exported from `form-kit`: `FieldDef`, `FieldGroupDef`, `DetailFieldDef`, `FormDef`, `StepComponentProps`, `InferFormValues`.

### Helpers
`defineFields`, `defineTableTab`, `defineFieldsTab`, `defineComponentTab`.

### Hooks
- **Data:** `useResource`, `useResourceCreate`, `useResourceUpdate`, `useResourceFormDef`, `useResourceListPage`
- **Actions:** `useActionExecution`, `useVisibleActions`
- **Permissions:** `usePermission`
- **Search:** `useSearch`, `useSearchHelpers` (+ `SearchParams`, `SearchResult` types)
- **Detail/tabs:** `useDetailHeaderState`, `useVisibleTabs`, `useSubResourceTable`
- **Forms:** `useFormEngine` (re-exported from form-kit)

### Providers
- `CoreProviders` — one-stop composition
- `SlotProvider`, `useSlots` — slot registry
- `NavigationProvider`, `useNavigation` (+ `NavigationAdapter`)
- `useNotification` (+ `NotificationAdapter`)
- `UIProvider`, `useUI`

### Contracts / slots
- `CoreComponentSlots` — interface your UI kit implements (DataTable, StepperForm, ActionPanel, etc.)
- `StepperContract`, `ActionPanelProps`, `FormFieldRenderProps`, `FormFieldSlots`

### Auth
`useAuth`, `CoreAuthUser`, `AuthAdapter`, `SessionStorage`.

### Errors
`AppError`, `ValidationError`, `AuthenticationError` (throw instances; your notification adapter presents them).

### Formatters
`formatDate`, `toApiDate`, `formatCurrency`, `formatRelativeTime`, `resolveFieldValue`.

### API
`queryKeys` — stable query-key factory for TanStack Query.

### Registry
`registerGroupLabels` — register i18n group labels for navigation.

### Data store
`ResourceDataStore` — low-level cache access.

## Design principles

- **Headless.** Zero visuals, zero styles. The consumer's UI kit owns every pixel.
- **Slot-based rendering.** `CoreComponentSlots` is a contract; consumers provide concrete implementations (`DataTable`, `StepperForm`, `ActionPanel`, etc.).
- **Definition-driven.** A `Resource` instance is the single source of truth — list, detail, form, tabs, actions, and permissions all derive from it.
- **Typed errors, not adapter strings.** Throw `AppError` / `ValidationError` / `AuthenticationError`; the notification adapter decides how to present them.
- **No framework lock-in inside the kit.** React Router and TanStack Query are peer deps, not hard-coded assumptions baked into business logic.

## Architecture docs

- [`system-design.md`](./system-design.md) — architecture deep-dive
- [`contributor-guide.md`](./contributor-guide.md) — contribution guide

## Development

```sh
pnpm install
pnpm build       # tsup → dist/
pnpm typecheck
```

## License

UNLICENSED — internal ZiCenter package.
