# AweraXe Banking Portal — Contributor Guide & Cookbook

**For developers building resource modules**
Companion to: _AweraXe Banking Portal — Architecture & Principles_

---

## How to Use This Guide

This guide is structured as a progressive tutorial. Part 1 teaches you the mental model. Part 2 walks you through
building a real resource from scratch, keystroke by keystroke. Part 3 covers increasingly complex scenarios. Part 4 is a
reference section you'll revisit as you work.

**Pre-requisites**: You've read the Architecture & Principles document. You have a local API server running (see
the Environment Setup guide). You can run the React dev server.

---

## Part 1: The Mental Model

### 1.1 How a request becomes a screen

When a user visits `/organization/offices`, here is exactly what happens:

```
1. React Router matches the path to a route
2. The wildcard :resourceId route matches; ResourceShell loads the definition
3. The route renders <ResourceListPage /> which gets the LoadedResource via useOutletContext
4. ResourceListPage calls useResourceList(loadedResource)
5. useResourceList calls officesResource.resolvers.list() (which calls apiClient.get('/api/v1/offices'))
6. The response is passed to <DataTable columns={officesResource.listing.columns} />
7. DataTable renders the table with sort, filter, pagination
```

No component was written for this. The offices resource definition alone produced the entire page. The same pattern
applies to the detail view, create form, and edit form.

### 1.2 What you actually write

For a typical resource, you write **two files** in `src/resources/{name}/`: `{name}.resource.ts` and `{name}.resolvers.ts`, plus an entry in the manifest. The resource definition
describes the UI, and the resolvers file calls the REST API directly via `apiClient`:

- **What data looks like** (columns for the table, fields for the detail view)
- **What the form looks like** (fields for create/edit, organized into steps if needed)
- **What actions are available** (status-dependent buttons with their API commands)
- **How to call the API** (typed resolver methods calling apiClient directly)

Core-engine handles everything that isn't router-specific: data fetching, caching, permissions, pagination, sorting, filtering, search, form rendering, action dispatch. Routing, navigation, breadcrumbs, and tabs are owned by the consumer app — core-engine talks to them through the `NavigationAdapter` passed to `CoreProviders`.

### 1.3 The resolvers file

Each resource creates its own resolver file that imports `apiClient` from `@zicenter/resource-kit` and calls the REST API directly. The resolver maps standard HTTP calls to the `ResourceResolvers` interface (`list`, `get`, `create`, etc.).
Sub-resource tabs carry their own `resolver` (a `SubResourceResolver` object with a required `list` method and optional
`create`/`delete` methods) directly on the `TabDef`. Similarly, actions carry their own `resolver` function.

### 1.4 When you write custom components

You write a custom component only when the declarative definition cannot express the behavior you need. Common examples:

- A tab that shows an interactive tree (office hierarchy)
- A form step with complex interdependent logic (loan product accounting rules)
- A detail view with a custom visualization (loan repayment schedule)
- An action that requires a multi-step workflow (loan disbursement with tranches)

Even then, your custom component plugs into the framework via the `component` field in the resource definition. It still
gets routing, permissions, and caching for free.

### 1.5 The file count rule

For a typical resource, you should have:

- **Two files**: The `.resource.ts` definition + the `.resolvers.ts` file (most resources)
- **Three files**: The above + one custom component (e.g., a special tab)
- **Four files**: The above + a couple of custom components

If you're creating more than four files, talk to the team. Either the framework needs enhancement, or you're
over-customizing.

### 1.6 The import boundary rule

Resource files (`src/resources/`) import framework types, hooks, and utilities from the `@zicenter/resource-kit` package. Platform-specific API helpers live in `@/resources/_shared/`:

| What you need                                                    | Import from                                 |
| ---------------------------------------------------------------- | ------------------------------------------- |
| Types (`ResourceDefinition`, `ColumnDef`, `FieldDef`, etc.)      | `@zicenter/resource-kit`                    |
| Core utilities (`apiClient`, `queryKeys`, `SubResourceResolver`) | `@zicenter/resource-kit`                    |
| API helpers (`normalizeList`, `withDateFormat`)                  | `@/resources/_shared/fineract-api-adapters` |
| Reusable components (`ActionContainer`, `DataTable`)             | `@/components/organisms`                    |

This boundary is enforced by ESLint (`no-restricted-imports`). The only exceptions are `src/resources/loader.ts` and `src/resources/manifest.ts`, which are framework infrastructure.

---

## Part 2: Building Your First Resource — Payment Types

Payment Types is one of the simplest resources in the system. In the Angular app, it has 6 files (component, template,
styles, resolver, create component, edit component). In our system, it's one file.

### Step 1: Investigate the API

Before writing any code, you need to understand the API. Open your browser or use curl against your local API server.

**List endpoint:**

```bash
curl -X GET "https://localhost:8443/fineract-provider/api/v1/paymenttypes" \
  -H "Fineract-Platform-TenantId: default" \
  -H "Authorization: Basic bWlmb3M6cGFzc3dvcmQ="
```

Response shape:

```json
[
  {
    "id": 1,
    "name": "Money Transfer",
    "description": "Payment via mobile money transfer",
    "isCashPayment": false,
    "position": 1
  },
  {
    "id": 2,
    "name": "Cash",
    "description": "Direct cash payment",
    "isCashPayment": true,
    "position": 2
  }
]
```

Note what you observe:

- The list endpoint returns a flat array (no pagination wrapper)
- Each item has `id`, `name`, `description`, `isCashPayment`, `position`
- There is no `/paymenttypes/template` endpoint — the form is simple enough to not need one
- Create/update use the same fields

**Single entity:**

```bash
curl -X GET ".../paymenttypes/1"
```

Returns the same shape as a list item.

**Create:**

```bash
curl -X POST ".../paymenttypes" \
  -d '{"name":"Wire Transfer","description":"Bank wire","isCashPayment":false,"position":3}'
```

**Update:**

```bash
curl -X PUT ".../paymenttypes/1" \
  -d '{"name":"Mobile Money","description":"Updated","isCashPayment":false,"position":1}'
```

### Step 2: Create the resolvers file

Create `src/resources/payment-types/payment-types.resolvers.ts`:

```typescript
import type { ResourceResolvers } from '@zicenter/resource-kit';
import { apiClient } from '@zicenter/resource-kit';
import { normalizeList } from '@/resources/_shared/fineract-api-adapters';

export const paymentTypeResolvers: ResourceResolvers = {
  queryKey: 'payment-types',

  list: async () => {
    const { data } = await apiClient.get('/api/v1/paymenttypes');
    return normalizeList(data);
  },

  get: async (id) => {
    const { data } = await apiClient.get(`/api/v1/paymenttypes/${id}`);
    return data;
  },

  create: async (payload) => {
    const { data } = await apiClient.post('/api/v1/paymenttypes', payload);
    return data;
  },

  update: async (entity, payload) => {
    await apiClient.put(`/api/v1/paymenttypes/${entity.id}`, payload);
  },

  delete: async (entity) => {
    await apiClient.delete(`/api/v1/paymenttypes/${entity.id}`);
  },
};
```

### Step 3: Create the resource definition file

Create `src/resources/payment-types/payment-types.resource.ts`:

```typescript
import type { ResourceDefinition } from '@zicenter/resource-kit';
import { paymentTypeResolvers } from './payment-types.resolvers';

const paymentTypesResource: ResourceDefinition = {
  description: 'Configure payment type options',

  // ── API ──
  resolvers: paymentTypeResolvers,

  // ── List View ──
  listing: {
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'description', label: 'Description' },
      { key: 'isCashPayment', label: 'Cash Payment', type: 'boolean' },
      { key: 'position', label: 'Position', sortable: true },
    ],
    defaultSort: { field: 'position', direction: 'asc' },
    searchFields: ['name', 'description'],
  },

  // ── Detail View ──
  titleField: 'name',
  detailFields: [
    {
      label: 'Details',
      fields: [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'isCashPayment', label: 'Cash Payment', type: 'boolean' },
        { key: 'position', label: 'Position' },
      ],
    },
  ],
  tabs: [], // No sub-resources, no tabs needed

  // ── Create/Edit Form ──
  createForm: {
    fields: [
      {
        key: 'name',
        label: 'Payment Type Name',
        type: 'text',
        required: true,
      },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isCashPayment', label: 'Is Cash Payment', type: 'checkbox' },
      {
        key: 'position',
        label: 'Position',
        type: 'number',
        required: true,
        validation: [{ rule: 'min', value: 0 }],
      },
    ],
  },
  // editForm omitted — defaults to createForm with fields pre-populated
};

export default paymentTypesResource;
```

### Step 4: Register it in the manifest

Add an entry to `src/resources/manifest.ts` with the resource's navigation and identity metadata:

```typescript
{
  id: 'payment-types',
  label: 'Payment Type',
  labelPlural: 'Payment Types',
  icon: 'credit-card',
  group: 'organization',
  permissions: {
    list: 'READ_PAYMENTTYPE',
    create: 'CREATE_PAYMENTTYPE',
    update: 'UPDATE_PAYMENTTYPE',
    delete: 'DELETE_PAYMENTTYPE',
  },
},
```

Identity fields (`id`, `label`, `labelPlural`, `icon`, `group`) and `permissions` live **only** in the manifest. The loader merges them with the `ResourceDefinition` at load time into a `LoadedResource` type (`LoadedResource = ResourceManifestEntry & ResourceDefinition`). Consumer components and hooks always receive `LoadedResource`, not `ResourceDefinition`.

The resource definition file must `export default` — the lazy loader (`src/resources/loader.ts`) discovers definitions via `import.meta.glob('./**/*.resource.ts')`.

### Step 5: Verify

Start the dev server. You should now see:

- "Payment Types" appears in the navigation under the "Organization" group
- `/organization/payment-types` shows a table with Name, Description, Cash Payment, Position columns
- Clicking a row navigates to `/organization/payment-types/:id` showing the detail view
- A "Create" button appears (if you have `CREATE_PAYMENTTYPE` permission)
- The create form shows 4 fields: name, description, checkbox, position
- Breadcrumbs show: Home > Organization > Payment Types > [name]

**That's it. Two files. Zero custom components. Full CRUD.**

### What just happened under the hood

The manifest registered your resource for navigation. The wildcard `:resourceId` route matched, and `ResourceShell` lazy-loaded your definition via `loader.ts`, merging it with the manifest entry into a `LoadedResource`. The navigation added a link. The list page used `useResourceList` which called `resolvers.list()` — which internally calls `apiClient.get('/api/v1/paymenttypes')`. The response was rendered via `DataTable` using your `listing.columns`. The detail
page called `resolvers.get(id)` and rendered your `detailFields`. The create page rendered your `createForm.fields` via
the form engine and called `resolvers.create(payload)`. All data is cached by React Query with key
`['payment-types', ...]`.

---

## Part 3: Increasingly Complex Scenarios

### 3.1 Resource with template-driven dropdowns — Offices

Offices use the template pattern: the create form needs a dropdown of parent offices, which comes from the
`/offices/template` or the offices list itself.

**Investigate the API:**

```bash
curl ".../offices?template=true"
# or
curl ".../offices/template"
```

The template response includes `allowedParents` — an array of offices that can be selected as the parent.

**The resolvers file** (`offices.resolvers.ts`):

```typescript
import type { ResourceResolvers } from '@zicenter/resource-kit';
import { apiClient } from '@zicenter/resource-kit';
import { normalizeList, withDateFormat } from '@/resources/_shared/fineract-api-adapters';

export const officesResolvers: ResourceResolvers = {
  queryKey: 'offices',
  list: async (params) => {
    const { data } = await apiClient.get('/api/v1/offices', {
      params: { orderBy: params?.orderBy, sortOrder: params?.sortOrder },
    });
    return normalizeList(data);
  },
  get: async (id) => {
    const { data } = await apiClient.get(`/api/v1/offices/${id}`);
    return data;
  },
  template: async () => {
    const { data } = await apiClient.get('/api/v1/offices/template');
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post('/api/v1/offices', withDateFormat(payload));
    return data;
  },
  update: async (entity, payload) => {
    await apiClient.put(`/api/v1/offices/${entity.id}`, payload);
  },
};
```

**The resource definition:**

```typescript
import { officesResolvers } from './offices.resolvers';

const officesResource: ResourceDefinition = {
  description: 'Office hierarchy management',

  resolvers: officesResolvers,

  listing: {
    columns: [
      { key: 'name', label: 'Office Name', sortable: true },
      { key: 'externalId', label: 'External ID' },
      { key: 'parentName', label: 'Parent Office', sortable: true, filterable: true },
      { key: 'openingDate', label: 'Opened On', sortable: true, type: 'date' },
    ],
    defaultSort: { field: 'name', direction: 'asc' },
    searchFields: ['name', 'externalId'],
  },

  titleField: 'name',
  subtitleField: 'externalId',
  detailFields: [
    {
      label: 'Details',
      fields: [
        { key: 'name', label: 'Office Name' },
        { key: 'parentName', label: 'Parent Office' },
        { key: 'openingDate', label: 'Opened On', type: 'date' },
        { key: 'externalId', label: 'External ID' },
      ],
    },
  ],
  tabs: [],

  createForm: {
    fields: [
      { key: 'name', label: 'Office Name', type: 'text', required: true },
      {
        key: 'parentId',
        label: 'Parent Office',
        type: 'select',
        templateKey: 'allowedParents', // ← key in the /template response
        optionLabel: 'name', // ← display field
        optionValue: 'id', // ← value field
        required: true,
      },
      { key: 'openingDate', label: 'Opening Date', type: 'date', required: true },
      { key: 'externalId', label: 'External ID', type: 'text' },
    ],
  },
};

export default officesResource;
```

**Key lesson: `templateKey`**

The field `parentId` has `templateKey: 'allowedParents'`. When the form mounts, the form engine calls
`GET /offices/template`. The response contains `{ allowedParents: [{ id: 1, name: "Head Office" }, ...] }`. The engine
finds the `allowedParents` array and populates the dropdown using `optionLabel` for display and `optionValue` for the
submitted value.

You never write code to fetch options. You never wire up a subscription. You declare the mapping and the framework
handles it.

### 3.2 Resource with dependent dropdowns — Charges

Charges are more interesting because the form fields change based on what "Charge Applies To" is selected (Loan,
Savings, Shares, etc.). Different selection yields different "Charge Time Type" and "Charge Calculation Type" options.

**Investigate the API:**

```bash
curl ".../charges/template"
```

Response shape:

```json
{
  "active": true,
  "penalty": false,
  "currencyOptions": [
    ...
  ],
  "chargeCalculationTypeOptions": [
    ...
  ],
  "chargeAppliesToOptions": [
    {
      "id": 1,
      "code": "chargeAppliesTo.loan",
      "value": "Loan"
    },
    {
      "id": 2,
      "code": "chargeAppliesTo.savings",
      "value": "Savings and Deposits"
    },
    ...
  ],
  "chargeTimeTypeOptions": [
    ...
  ],
  "chargePaymentModeOptions": [
    ...
  ],
  "loanChargeCalculationTypeOptions": [
    ...
  ],
  "loanChargeTimeTypeOptions": [
    ...
  ],
  "savingsChargeCalculationTypeOptions": [
    ...
  ],
  "savingsChargeTimeTypeOptions": [
    ...
  ],
  "feeFrequencyOptions": [
    ...
  ]
}
```

Notice: there are separate option arrays for loan vs. savings charge types. The form needs to show different options
depending on the "Applies To" selection.

**The resource definition (create form section):**

```typescript
createForm: {
    fields: [
        {
            key: 'chargeAppliesTo', label: 'Charge Applies To', type: 'select',
            templateKey: 'chargeAppliesToOptions',
            optionLabel: 'value', optionValue: 'id',
            required: true
        },

        {key: 'name', label: 'Name', type: 'text', required: true},

        {
            key: 'currencyCode', label: 'Currency', type: 'select',
            templateKey: 'currencyOptions',
            optionLabel: 'name', optionValue: 'code',
            required: true
        },

        {
            key: 'chargeTimeType', label: 'Charge Time Type', type: 'select',
            // Dynamic templateKey based on another field's value
            templateKey: (formValues) => {
                const appliesTo = formValues.chargeAppliesTo;
                if (appliesTo === 1) return 'loanChargeTimeTypeOptions';
                if (appliesTo === 2) return 'savingsChargeTimeTypeOptions';
                if (appliesTo === 3) return 'clientChargeTimeTypeOptions';
                return 'chargeTimeTypeOptions';
            },
            optionLabel: 'value', optionValue: 'id',
            required: true,
            dependsOn: 'chargeAppliesTo'
        },      // ← reset when appliesTo changes

        {
            key: 'chargeCalculationType', label: 'Charge Calculation', type: 'select',
            templateKey: (formValues) => {
                const appliesTo = formValues.chargeAppliesTo;
                if (appliesTo === 1) return 'loanChargeCalculationTypeOptions';
                if (appliesTo === 2) return 'savingsChargeCalculationTypeOptions';
                return 'chargeCalculationTypeOptions';
            },
            optionLabel: 'value', optionValue: 'id',
            required: true,
            dependsOn: 'chargeAppliesTo'
        },

        {
            key: 'chargePaymentMode', label: 'Payment Mode', type: 'select',
            templateKey: 'chargePaymentModeOptions',
            optionLabel: 'value', optionValue: 'id',
            visibleWhen: (v) => v.chargeAppliesTo === 1
        },  // Only for loans

        {key: 'amount', label: 'Amount', type: 'currency', required: true},

        {key: 'penalty', label: 'Is Penalty', type: 'checkbox'},
        {key: 'active', label: 'Active', type: 'checkbox'},

        {
            key: 'minCap', label: 'Minimum Cap', type: 'currency',
            visibleWhen: (v) => [2, 4].includes(v.chargeCalculationType)
        },
        {
            key: 'maxCap', label: 'Maximum Cap', type: 'currency',
            visibleWhen: (v) => [2, 4].includes(v.chargeCalculationType)
        },

        {
            key: 'feeFrequency', label: 'Fee Frequency', type: 'select',
            templateKey: 'feeFrequencyOptions',
            optionLabel: 'value', optionValue: 'id',
            visibleWhen: (v) => v.chargeTimeType === 6
        },   // Only for "Monthly Fee"
    ],
}
,
```

**Key lessons:**

1. **`templateKey` can be a function.** When you need different option arrays based on form state, pass a function that
   receives current form values and returns the template key string. The form engine calls this function reactively
   whenever the dependency changes.

2. **`dependsOn` resets the field.** When `chargeAppliesTo` changes, fields with `dependsOn: 'chargeAppliesTo'` are
   reset to empty and their options are re-resolved. This prevents stale selections.

3. **`visibleWhen` conditionally hides fields.** The `chargePaymentMode` field only appears when the charge applies to
   loans. `minCap`/`maxCap` only appear for percentage-based calculations. The function receives current form values and
   returns a boolean.

4. **No re-fetch needed in this case.** Because the template response includes all option variants upfront (
   loanChargeTimeTypeOptions, savingsChargeTimeTypeOptions, etc.), the form engine doesn't need to make a second API
   call — it just reads a different key from the already-fetched template. The `dependsOn` here controls field reset and
   option resolution, not an API re-fetch.

### 3.3 Resource with dependent dropdowns that DO require re-fetch — Clients

The client create form has an `officeId` dropdown. When you select an office, the `staffId` dropdown must show only
staff assigned to that office. The template endpoint supports this:

```bash
curl ".../clients/template"                      # returns all staffOptions
curl ".../clients/template?officeId=3"            # returns staffOptions for office 3
```

```typescript
createForm: {
    steps: [
        {
            id: 'general', label: 'General', fields: [
                {
                    key: 'officeId', label: 'Office', type: 'select',
                    templateKey: 'officeOptions',
                    optionLabel: 'name', optionValue: 'id',
                    required: true
                },

                {
                    key: 'staffId', label: 'Loan Officer', type: 'select',
                    templateKey: 'staffOptions',
                    optionLabel: 'displayName', optionValue: 'id',
                    dependsOn: 'officeId',
                    refetchTemplate: true
                },              // ← triggers template re-fetch
            ]
        },
    ],
        templateParams
:
    (formValues) => {
        const params: Record<string, string> = {};
        if (formValues.officeId) {
            params.officeId = String(formValues.officeId);
            params.staffInSelectedOfficeOnly = 'true';
        }
        return params;
    },
}
,
```

**Key lesson: `refetchTemplate: true`**

When `officeId` changes:

1. The form engine sees `staffId` has `dependsOn: 'officeId'` and `refetchTemplate: true`
2. It calls `templateParams(currentFormValues)` to build query params
3. It re-fetches `GET /clients/template?officeId=3&staffInSelectedOfficeOnly=true`
4. The new `staffOptions` array replaces the old one
5. The `staffId` field is reset and repopulated

This replaces the Angular app's `buildDependencies()` method, which was 50+ lines of manual RxJS subscription wiring per
form.

### 3.4 Resource with async/search select — Cross-resource lookups

Some forms need to reference another resource (e.g., selecting a client when creating a loan). The target resource may
have thousands of records, so loading them all via a template endpoint isn't practical. Use `asyncOptions` to fetch
options on demand with a debounced search query.

```typescript
createForm: {
    steps: [
        {
            id: 'general', label: 'General', fields: [
                {
                    key: 'clientId', label: 'Client', type: 'select',
                    asyncOptions: async (query?: string) => {
                        const { data } = await apiClient.get('/api/v1/clients', {
                            params: { displayName: query },
                        });
                        return data.pageItems ?? [];
                    },
                    optionLabel: 'displayName',
                    optionValue: 'id',
                    asyncMinChars: 2,
                    required: true,
                },
            ],
        },
    ],
},
```

**Key lesson: `asyncOptions` vs `templateKey`**

- `asyncOptions` renders an `AsyncSelectField` — a combobox (Popover + Command) with debounced search (300ms). Results
  are cached and deduplicated via TanStack Query, so repeated searches are instant.
- `asyncMinChars` (default 0) controls how many characters the user must type before the first fetch fires. Set it to 2
  or 3 for large datasets to avoid fetching the entire table on focus.
- `optionLabel` and `optionValue` work exactly the same as with template-based selects.
- The priority chain for option sources is: `staticOptions` > `asyncOptions` > `templateKey`. If you accidentally set
  both `staticOptions` and `asyncOptions`, the static list wins.

### 3.5 Resource with custom tabs — Clients

Most client tabs can be declarative (documents, notes, identities are just sub-resource tables). But the Family Members
tab has inline add/edit/delete behavior that's too complex for a table declaration. Use a custom component.

Declarative tabs carry their own `resolver` directly on the tab definition. The resolver is a `SubResourceResolver`
object with a `list` method. Tabs import `apiClient` directly from `@zicenter/resource-kit` — no exported API instances needed:

```typescript
// In clients.resource.ts — each tab carries its own resolver
import { apiClient } from '@zicenter/resource-kit';
import {FamilyMembersTab} from './components/FamilyMembersTab';

tabs: [
    // Declarative tabs — each carries its own resolver
    {
        id: 'identities', label: 'Identities',
        columns: [
            {key: 'documentType.name', label: 'Type'},
            {key: 'documentKey', label: 'ID Number'},
            {key: 'status', label: 'Status', type: 'status'},
        ],
        resolver: {
            list: async (parent) => {
                const {data} = await apiClient.get(`/api/v1/clients/${parent.id}/identifiers`);
                return data;
            },
        },
    },
    {
        id: 'notes', label: 'Notes',
        columns: [
            {key: 'note', label: 'Note'},
            {key: 'createdByUsername', label: 'Created By'},
            {key: 'createdOn', label: 'Date', type: 'date'},
        ],
        resolver: {
            list: async (parent) => {
                const {data} = await apiClient.get(`/api/v1/clients/${parent.id}/notes`);
                return data;
            },
        },
    },

    // Custom tab — no resolver needed, component handles its own data
    {
        id: 'family', label: 'Family Members',
        component: FamilyMembersTab
    },
],
```

Custom tab components receive standard props from the framework (`entityId`, `entityData`) and use `apiClient` directly for their specific needs.

**Key lesson:** Declarative tabs need `columns` + a co-located `resolver` on the tab definition. No string-key
coupling — the resolver lives right next to the columns it serves.

### 3.6 Resource with status-dependent actions — Loans

Loan actions are the most complex in the system. Different actions appear depending on the loan's status (Submitted,
Approved, Active, Overpaid, Closed, Written Off, etc.).

```typescript
// Helper — creates a resolver that calls the loans state-transition endpoint
const loanAction = (cmd: string) => async (entity: { id: number }, payload?: any) => {
    const {data} = await apiClient.post(`/api/v1/loans/${entity.id}?command=${cmd}`, payload ?? {});
    return data;
};

actions: [
    // Simple actions — each carries its own resolver
    {
        id: 'approve', label: 'Approve', icon: 'check', variant: 'primary',
        visibleWhen: (e) => e.status?.code === 'loanStatusType.submitted.and" +
        ".pending.approval',
        permission: 'APPROVE_LOAN',
        apiAction: {method: 'POST', commandParam: 'approve'},
        resolver: loanAction('approve'),
        fields: [
            {key: 'approvedOnDate', label: 'Approved On', type: 'date', required: true},
            {key: 'note', label: 'Note', type: 'textarea'},
        ]
    },

    {
        id: 'reject', label: 'Reject', variant: 'danger',
        visibleWhen: (e) => e.status?.code === 'loanStatusType.submitted.and" +
        ".pending.approval',
        permission: 'REJECT_LOAN',
        apiAction: {method: 'POST', commandParam: 'reject'},
        resolver: loanAction('reject'),
        fields: [
            {key: 'rejectedOnDate', label: 'Rejected On', type: 'date', required: true},
            {key: 'note', label: 'Note', type: 'textarea'},
        ],
        confirm: 'Are you sure you want to reject this loan application?'
    },

    // Complex action — custom component handles its own API calls, no resolver needed
    {
        id: 'disburse', label: 'Disburse', icon: 'banknote', variant: 'primary',
        visibleWhen: (e) => e.status?.code === 'loanStatusType.approved',
        permission: 'DISBURSE_LOAN',
        component: LoanDisbursementForm
    },

    {
        id: 'make-repayment', label: 'Make Repayment', icon: 'wallet',
        visibleWhen: (e) => e.status?.code === 'loanStatusType.active',
        permission: 'REPAYMENT_LOAN',
        component: LoanRepaymentForm
    },

    {
        id: 'waive-interest', label: 'Waive Interest',
        visibleWhen: (e) => e.status?.code === 'loanStatusType.active',
        permission: 'WAIVEINTERESTPORTION_LOAN',
        apiAction: {method: 'POST', commandParam: 'waiveinterest'},
        resolver: loanAction('waiveinterest'),
        fields: [
            {key: 'transactionDate', label: 'Date', type: 'date', required: true},
            {key: 'transactionAmount', label: 'Amount', type: 'currency', required: true},
            {key: 'note', label: 'Note', type: 'textarea'},
        ]
    },

    {
        id: 'close', label: 'Close', variant: 'danger',
        visibleWhen: (e) => e.status?.code === 'loanStatusType.active' ||
            e.status?.code === 'loanStatusType.overpaid',
        permission: 'CLOSE_LOAN',
        apiAction: {method: 'POST', commandParam: 'close'},
        resolver: loanAction('close'),
        fields: [
            {key: 'transactionDate', label: 'Closed On', type: 'date', required: true},
        ],
        confirm: true
    },
],
```

**Key lesson: Mix simple and complex actions freely.** Simple actions (approve, reject, waive interest) are fully
declarative — the framework renders a modal with form fields and posts the command. Complex actions (disburse, make
repayment) use a custom component that gets full control over the UI while still being mounted by the framework's action
dispatcher.

### 3.7 Overriding an entire view — Codes with inline code values

The Codes module is unusual: the detail view isn't just a read-only display. It has an inline editable table of code
values where you can add, edit, and delete rows without navigating away. The generic detail view can't express this.

```typescript
import { CodeDetailView } from './components/CodeDetailView';
import { codeResolvers } from './codes.resolvers';

const codesResource: ResourceDefinition = {
  resolvers: codeResolvers,

  listing: {
    columns: [
      { key: 'name', label: 'Code Name', sortable: true },
      { key: 'systemDefined', label: 'System Defined', type: 'boolean' },
    ],
    searchFields: ['name'],
  },

  titleField: 'name',
  tabs: [],

  // Override just the detail view — list/create/edit stay generic
  overrides: {
    DetailComponent: CodeDetailView,
  },

  createForm: {
    fields: [{ key: 'name', label: 'Code Name', type: 'text', required: true }],
  },
};

export default codesResource;
```

The custom `CodeDetailView` receives `{ resource, entityId }` as props (where `resource` is a `LoadedResource`) and has full control over rendering, but the
list view, create form, routing, and navigation are all still generic.

### 3.8 Multi-step stepper form — Loan Products

Loan product creation is the most complex form in the system — 10+ steps with interdependencies. Use the stepper form
with a mix of declarative and custom steps.

```typescript
createForm: {
    steps: [
        // Declarative step — the form engine renders it
        {
            id: 'details', label: 'Details', icon: 'file-text',
            fields: [
                {key: 'name', label: 'Product Name', type: 'text', required: true},
                {
                    key: 'shortName', label: 'Short Name', type: 'text', required: true,
                    validation: [{rule: 'maxLength', value: 4}]
                },
                {
                    key: 'fundId', label: 'Fund', type: 'select',
                    templateKey: 'fundOptions', optionLabel: 'name', optionValue: 'id'
                },
                {key: 'description', label: 'Description', type: 'textarea'},
                {key: 'startDate', label: 'Start Date', type: 'date'},
                {key: 'closeDate', label: 'Close Date', type: 'date'},
                {
                    key: 'includeInBorrowerCycle', label: 'Include in Borrower Cycle',
                    type: 'checkbox'
                },
            ]
        },

        // Declarative step with conditional fields
        {
            id: 'currency', label: 'Currency', icon: 'dollar-sign',
            fields: [
                {
                    key: 'currencyCode', label: 'Currency', type: 'select',
                    templateKey: 'currencyOptions', optionLabel: 'name', optionValue: 'code',
                    required: true
                },
                {
                    key: 'digitsAfterDecimal', label: 'Decimal Places', type: 'number',
                    required: true
                },
                {key: 'inMultiplesOf', label: 'Currency in Multiples Of', type: 'number'},
                {
                    key: 'installmentAmountInMultiplesOf',
                    label: 'Installment Amount in Multiples Of', type: 'number'
                },
            ]
        },

        {
            id: 'terms', label: 'Terms', icon: 'sliders',
            fields: [
                {key: 'minPrincipal', label: 'Minimum Principal', type: 'currency'},
                {
                    key: 'principal', label: 'Default Principal', type: 'currency',
                    required: true
                },
                {key: 'maxPrincipal', label: 'Maximum Principal', type: 'currency'},
                {key: 'minNumberOfRepayments', label: 'Min # of Repayments', type: 'number'},
                {
                    key: 'numberOfRepayments', label: 'Default # of Repayments', type: 'number',
                    required: true
                },
                {key: 'maxNumberOfRepayments', label: 'Max # of Repayments', type: 'number'},
                // ... more term fields
            ]
        },

        // Custom step — too complex for declarative config
        {
            id: 'accounting', label: 'Accounting', icon: 'book-open',
            component: LoanProductAccountingStep
        },

        {
            id: 'charges', label: 'Charges', icon: 'receipt',
            component: LoanProductChargesStep
        },
    ],
},
```

**Key lesson: Declarative where you can, custom where you must.** Steps 1-3 are pure field definitions. Steps 4-5 are
custom components because accounting rule mapping and charge selection require interactive UIs that can't be expressed
as flat field lists. But all steps participate in the same stepper, share the same form state, and submit together.

---

## Part 4: Reference

### 4.1 Field types

| Type           | Renders                               | Notes                                                                           |
| -------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| `text`         | Text input                            |                                                                                 |
| `number`       | Number input                          | Supports `validation: [{ rule: 'min', value: 0 }]`                              |
| `currency`     | Number input with currency formatting | Respects currency decimal places from context                                   |
| `date`         | Date picker                           | Formatted using the tenant's date format                                        |
| `select`       | Dropdown                              | Uses `staticOptions`, `asyncOptions`, or `templateKey` (priority in that order) |
| `multiselect`  | Multi-select dropdown                 | Same options source as `select`                                                 |
| `checkbox`     | Checkbox                              |                                                                                 |
| `textarea`     | Multi-line text                       |                                                                                 |
| `autocomplete` | Searchable dropdown                   | For large option lists (e.g., GL accounts)                                      |
| `custom`       | Your component                        | Set `component` on the field definition                                         |

### 4.2 Validation rules

```typescript
validation: [
  { rule: 'required' }, // Redundant with required: true, but explicit
  { rule: 'min', value: 0 }, // Minimum numeric value
  { rule: 'max', value: 100 }, // Maximum numeric value
  { rule: 'minLength', value: 3 }, // Minimum string length
  { rule: 'maxLength', value: 4 }, // Maximum string length
  { rule: 'pattern', value: '^[A-Z]+$' }, // Regex pattern
  {
    rule: 'custom',
    validator: (value, formValues) => {
      if (value > formValues.maxPrincipal) return 'Must not exceed max principal';
      return null; // null = valid
    },
  },
];
```

### 4.3 Column types

| Type       | Renders          | Notes                                  |
| ---------- | ---------------- | -------------------------------------- |
| `text`     | Plain text       | Default                                |
| `link`     | Clickable text   | Navigates to detail view on click      |
| `date`     | Formatted date   | Uses tenant date format                |
| `currency` | Formatted number | Respects locale and currency           |
| `boolean`  | Green/grey dot   |                                        |
| `status`   | Colored badge    | Maps status values to colors via theme |
| `badge`    | Colored label    | For enum-like values                   |

Custom rendering via the `render` function:

```typescript
{
    key: 'balance', label
:
    'Balance', type
:
    'currency',
        render
:
    (value, row) => (
        <span style = {
    {
        color: value < 0 ? 'red' : 'inherit'
    }
}>
    {
        formatCurrency(value)
    }
    </span>
)
}
,
```

### 4.4 Response normalization in resolvers

All data transformation happens in the resolver layer — resource definitions stay purely declarative.

Every resolver `list` method must return `NormalizedList` (`{ data: T[], totalCount: number }`). Use the `normalizeList()` helper from `@/resources/_shared/fineract-api-adapters`:

```typescript
import { apiClient } from '@zicenter/resource-kit';
import { normalizeList } from '@/resources/_shared/fineract-api-adapters';

// Paginated API: { totalFilteredRecords: 100, pageItems: [...] }
list: async (params) => {
    const { data } = await apiClient.get('/api/v1/loans', { params: { offset: params?.offset, limit: params?.limit } });
    return normalizeList(data); // extracts pageItems + totalFilteredRecords
},

// Flat array API: [...]
list: async () => {
    const { data } = await apiClient.get('/api/v1/paymenttypes');
    return normalizeList(data); // wraps array as { data, totalCount: length }
},

// Custom structure: { savingsProductOptions: [...] }
list: async () => {
    const { data } = await apiClient.get('/api/v1/savingsproducts/template');
    return { data: data.savingsProductOptions ?? [], totalCount: data.savingsProductOptions?.length ?? 0 };
},
```

### 4.5 API conventions you need to know

**Date formats.** Every POST/PUT that includes a date must also include `dateFormat` and `locale` in the payload. Use
`withDateFormat()` in the resolver's `create`/`update` method:

```typescript
import { apiClient } from '@zicenter/resource-kit';
import { withDateFormat } from '@/resources/_shared/fineract-api-adapters';

create: async (payload) => {
    const { data } = await apiClient.post('/api/v1/offices', withDateFormat(payload));
    return data;
},
```

**Command parameters.** Actions use query parameters: `POST /loans/5?command=approve`. Each action carries its own
`resolver` function that calls `apiClient` with the appropriate URL and command param. A helper like `loanAction('approve')` creates a resolver
that passes the command to `apiClient`. The `apiAction` field is retained for documentation/metadata.

**Template endpoint.** Most resources have `GET /resource/template` that returns form options. Define a `template`
method on the resolver to enable this. For resources without a template endpoint (Payment Types, Codes), omit the
`template` method — the form engine will skip the template fetch and only render fields with `staticOptions` or no
options needed.

**The `template=true` query param on GET by ID.** Some resources support `GET /resource/:id?template=true` which returns
the entity data plus template options merged together. The edit form uses this. If the resource supports it, the
`useResourceTemplate` hook automatically adds `?template=true` when fetching for edit mode.

**Tenancy.** Every API call includes `Fineract-Platform-TenantId` header. This is configured once in the API client and
never touched in resource definitions.

### 4.6 Permission codes

Permission codes follow a pattern: `{ACTION}_{ENTITY}`. Common actions:

| Action      | Meaning                               |
| ----------- | ------------------------------------- |
| `READ`      | View/list the resource                |
| `CREATE`    | Create new instances                  |
| `UPDATE`    | Edit existing instances               |
| `DELETE`    | Delete instances                      |
| `APPROVE`   | Approve (for maker-checker workflows) |
| `REJECT`    | Reject                                |
| `ACTIVATE`  | Activate                              |
| `CLOSE`     | Close                                 |
| `DISBURSE`  | Disburse (loans)                      |
| `REPAYMENT` | Record repayment (loans)              |
| `WITHDRAW`  | Withdraw (clients, savings)           |

To find the exact permission code for an action, check the `m_permission` table in the database or the
existing Angular app's route guards.

### 4.7 File checklist

Before submitting a PR for a new resource, verify:

- [ ] Resolvers file exists at `src/resources/{name}/{name}.resolvers.ts`
- [ ] Resource definition file exists at `src/resources/{name}/{name}.resource.ts`
- [ ] Resource has `export default` in `.resource.ts` (required for lazy loader)
- [ ] Resource definition does NOT contain `id`, `label`, `labelPlural`, `icon`, `group`, or `permissions` (these belong in the manifest)
- [ ] Resource has an entry in `src/resources/manifest.ts` (identity + navigation metadata + permissions)
- [ ] Resolvers wrap the correct generated API class methods
- [ ] Every `templateKey` references a key that actually exists in the API's `/template` response
- [ ] Every `dependsOn` field has a corresponding field in the same form
- [ ] Resolver `create`/`update` uses `withDateFormat()` if the form has date fields
- [ ] Resolver `list` returns `NormalizedList` (use `normalizeList()` helper)
- [ ] Declarative tabs have a `resolver` with a `list` method
- [ ] Actions with `apiAction` have a co-located `resolver` function
- [ ] `permissions` codes in the manifest entry match actual API permission codes
- [ ] Custom components accept and use the standard props (`entityId`, `entityData`, `onSuccess`)
- [ ] The resource appears correctly in the navigation under the right group
- [ ] List view loads, sorts, filters, and searches correctly
- [ ] Detail view shows the correct title, subtitle, and status badge
- [ ] Create form renders all fields with correct types and validation
- [ ] Template-driven dropdowns populate correctly
- [ ] Dependent dropdowns update when their dependency changes
- [ ] Actions appear based on entity status and user permissions
- [ ] Edit form pre-populates with existing data

### 4.8 How to investigate an API endpoint

When you're assigned a new resource, follow this sequence:

**Step 1: Find the endpoint.** Check the Angular app's service file (e.g., `organization.service.ts`) for the HTTP
calls. The URL patterns tell you the API path.

**Step 2: Call the list endpoint.** Note the response shape: flat array or paginated wrapper? What fields come back?
Which ones should be columns?

**Step 3: Call the template endpoint.** If `GET /resource/template` exists, examine every key in the response. Each
array is a potential dropdown source. Map these to your form's `templateKey` values.

**Step 4: Call the single-entity endpoint.** Note which fields are returned. These populate your detail view and edit
form.

**Step 5: Call the single-entity endpoint with `?template=true`.** If supported, this gives you the entity data merged
with template options — used for the edit form.

**Step 6: Check the create payload.** Look at the Angular app's `submit()` method to see what fields are sent and what
format they're in. Note `dateFormat`/`locale` requirements.

**Step 7: Check for actions.** Look at the Angular routing file for `?command=` patterns. Each command is an action in
your resource definition.

**Step 8: Check permissions.** Search the Angular templates for `*hasPermission` directives. These give you the
exact permission codes.

### 4.9 Common mistakes

**Mistake: Wrong `templateKey`**
Symptom: A dropdown renders empty.
Fix: Console.log the template response and verify the exact key name. Common gotcha: The API sometimes uses `Options`
suffix (e.g., `chargeAppliesToOptions`) and sometimes doesn't.

**Mistake: Missing `withDateFormat` in resolver**
Symptom: API returns 400 with "dateFormat is required" or "invalid date".
Fix: Wrap the payload with `withDateFormat()` in the resolver's `create`/`update` method.

**Mistake: Missing `resolver` on a declarative tab**
Symptom: A tab with `columns` shows "No content configured for this tab." (The registry also logs an error at startup.)
Fix: Add a `resolver` property to the tab with at least a `list` method. Import the API instance from the resolvers file.

**Mistake: Missing `resolver` on an action with `apiAction`**
Symptom: Clicking the action throws "Action has no resolver." (The registry also logs an error at startup.)
Fix: Add a `resolver` function to the action. Use a helper like `const clientAction = (cmd) => async (id, payload) => { ... }`.

**Mistake: Using a custom component when declarative would work**
Symptom: You wrote 200 lines of React to render a table of sub-resources.
Fix: Check if a declarative tab with `columns` + a co-located `resolver` (with a `list` method) would work. You'd be surprised how
often it does.

**Mistake: Using `templateKey` for a cross-resource lookup with thousands of records**
Symptom: The template response is huge, the dropdown is slow, and the form takes seconds to load.
Fix: Use `asyncOptions` instead. It fetches on demand with a search query, so only a small page of results is loaded at
a time. Set `asyncMinChars: 2` to avoid an initial unfiltered fetch.

**Mistake: Hardcoding permission checks as role names**
Symptom: `if (user.role === 'Super Admin')` breaks when roles are renamed.
Fix: Always use permission codes: `hasPermission('CREATE_CLIENT')`. Roles are tenant-specific and mutable; permission
codes are stable API contracts.

---

## Part 5: Quick-Start Assignments

These are real resources ordered by complexity. Each is a good candidate for a contributor's first task.

### Tier 1 — Pure declarative (one file, no custom components)

| Resource                   | API Path                | Group        | Notes                             |
| -------------------------- | ----------------------- | ------------ | --------------------------------- |
| Payment Types              | `/paymenttypes`         | organization | Flat array, no template, 4 fields |
| Manage Funds               | `/funds`                | organization | Flat array, no template, 3 fields |
| Working Days               | `/workingdays`          | organization | Single-entity config, not a list  |
| Password Preferences       | `/passwordpreferences`  | organization | Single-entity config              |
| Account Number Preferences | `/accountnumberformats` | system       | Simple CRUD                       |

### Tier 2 — Template dropdowns, simple forms

| Resource          | API Path      | Group        | Notes                                                                      |
| ----------------- | ------------- | ------------ | -------------------------------------------------------------------------- |
| Offices           | `/offices`    | organization | Has template, parent office dropdown, tree view (custom override for list) |
| Holidays          | `/holidays`   | organization | Template with office filter, date range fields                             |
| Employees / Staff | `/staff`      | organization | Template with office dropdown                                              |
| Currencies        | `/currencies` | organization | Config endpoint, not standard CRUD                                         |
| Codes             | `/codes`      | system       | Simple list + inline code values editor (custom detail)                    |
| Hooks             | `/hooks`      | system       | Template with event list                                                   |

### Tier 3 — Complex forms, multiple tabs, actions

| Resource            | API Path           | Group    | Notes                                   |
| ------------------- | ------------------ | -------- | --------------------------------------- |
| Charges             | `/charges`         | products | Dependent dropdowns, conditional fields |
| Savings Products    | `/savingsproducts` | products | Multi-step form, interest rate config   |
| Share Products      | `/products/share`  | products | Multi-step form                         |
| Users               | `/users`           | admin    | Role assignment, password management    |
| Roles & Permissions | `/roles`           | system   | Permission tree editor (custom)         |

### Tier 4 — Heavy custom components needed

| Resource         | API Path                         | Group    | Notes                                                      |
| ---------------- | -------------------------------- | -------- | ---------------------------------------------------------- |
| Clients          | `/clients`                       | core     | Family members tab, many actions, sub-resources            |
| Savings Accounts | `/savingsaccounts`               | core     | Transactions, interest calculation                         |
| Loan Products    | `/loanproducts`                  | products | 10-step wizard, accounting rules                           |
| Loans            | `/loans`                         | core     | Most complex: schedule, disbursement, repayment, write-off |
| Accounting       | `/glaccounts`, `/journalentries` | finance  | Chart of accounts tree, double-entry                       |

Assign Tier 1 tasks to new contributors. Tier 2 to developers who've completed a Tier 1. Tier 3–4 to experienced
developers or pairs.
