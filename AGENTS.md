# AGENTS.md

AI and contributor guide for **qrupiv2-crm-vite-frontend**, the admin/CRM frontend of Qrupi v2 (school management: users, institutions, roles, learning groups, H5P resources, quizzes, attendances, activities/KAIH, announcements, legal documents). UI copy is in Bahasa Indonesia.

The existing implementation is the source of truth. Prefer consistency over creativity.

---

# Stack

* Vite 8 + React 19 + TypeScript 6 (SPA, **not** Next.js; there is no backend code in this repo)
* React Router 7 (`BrowserRouter`, routes declared in `src/App.tsx`)
* Tailwind CSS 4 + shadcn components on `@base-ui/react` (`src/components/ui`)
* Icons: **Hugeicons only**, through `@/lib/icons` (see Icons)
* `next-themes` for dark mode, `sonner` for toasts, `recharts` for charts, `react-leaflet` for maps, `date-fns` / `react-day-picker` for dates
* H5P via `@lumieducation/h5p-react` (`@lumieducation/h5p-server` is a devDependency used for types only)

Scripts:

```bash
npm run dev     # vite
npm run build   # tsc -b && vite build
npm run lint    # eslint .
```

Environment variables (`.env`): `VITE_API_BASE_URL`, `VITE_CSRF_COOKIE_NAME`, `VITE_H5P_BASE_URL`, `VITE_QRUPI_GURU_URL`, `VITE_QRUPI_ORANG_TUA_URL`, `VITE_QRUPI_LMS_URL`.

---

# Project Structure

```text
src/
├── App.tsx                 # all routes + PermissionRoute / moduleFormRoutes helpers
├── main.tsx                # ThemeProvider + Toaster
├── config/modules.tsx      # sidebar/menu modules (title, href, icon, roles)
├── components/
│   ├── ui/                 # shadcn primitives (Button, Dialog, Select, Table, ...)
│   ├── layout/             # app-layout, app-header, global-search, notification-menu, theme-toggle
│   ├── auth/               # protected-route, allowed-roles-route
│   ├── dashboard/          # shared dashboard blocks
│   ├── backend-module-page.tsx       # generic list page engine (DefaultModulePage)
│   ├── backend-module-form-page.tsx  # generic create/edit/view form engine
│   ├── dynamic-page.tsx              # generic table/pagination renderer
│   └── *-select.tsx, *-multi-select.tsx, import-dialog, rich-text-editor, h5p-*, ...
├── hooks/
├── lib/
│   ├── api/                # client.ts (apiRequest), paginated.ts, resource.ts, regions, notifications, quiz-imports
│   ├── auth/session.ts     # getAuthUser, getRoleName, hasPermission, canReadModel, canAccessMenu
│   ├── dto/                # API contracts (*Dto)
│   ├── helper/             # date.ts, export.ts, text.ts
│   ├── icons.tsx           # Hugeicons wrappers
│   ├── module-behaviors.ts # module title -> endpoint, multipart, form fields
│   └── utils.ts            # cn()
├── services/h5p.service.ts
└── pages/<feature>/
```

---

# Feature Module Pattern

Every feature lives in `src/pages/<feature>/`:

```text
pages/<feature>/
├── page.tsx         # thin orchestration
├── page.config.tsx  # BackendModuleConfig (fields, actions, filters, toolbar, renderers)
├── actions.ts       # fetch functions (usually fetchPaginated wrappers)
├── types.ts         # local row/form types (usually aliases of ApiRecordDto)
└── components/      # feature-specific UI
```

Most list pages are only:

```tsx
export default function RolesPage() {
  return <DefaultModulePage config={ROLES_PAGE_CONFIG} fetchPage={fetchRoles} />;
}
```

Rules:

* Start from the nearest equivalent module and copy its structure, naming and file placement. "Samakan dengan folder lain" is a strict instruction.
* Configure behavior through `BackendModuleConfig` (`fields`, `actions`, `filterFields`, `toolbarActions`, `detailRenderer`, `renderRowActions`, `editableFields`, `createPayload`, `updatePayload`, ...) before writing a custom page.
* Write a custom page (e.g. `chart-page.tsx`, `teacher-page.tsx`, `kaih-page.tsx`, `ranking-page.tsx`) only when the generic engine cannot express the flow. Keep it split into local components.
* `page.tsx` orchestrates (state, fetch, modal state, refresh). It must not hold large JSX.
* If a config depends on the logged-in user (role, id), compute it **inside a component or hook** at render time, never at route/module definition time. See `pages/announcements/use-announcements-page-config.ts` and `pages/announcements/form-page.tsx`.

---

# Routing & Permissions

* Routes are declared in `src/App.tsx` under `ProtectedRoute` → `AppLayout`.
* Guard pages with `<PermissionRoute model="..." action="...">`. Without `action`, it requires `get` or `get-all`.
* Use `moduleFormRoutes(path, config)` to register `/create`, `/:id/edit` and `/:id/view` for a module.
* `DefaultModulePage` also redirects to `/dashboard` when the user lacks `get`/`get-all` on the endpoint model.
* Permissions come from the backend on the auth user (`user.permissions` or `user.role.permissions`) as `{ model, action }`. Check them with `hasPermission`, `canReadModel` and `canAccessMenu` from `@/lib/auth/session`. Do not hardcode permission logic in components.
* Menu visibility is configured in `src/config/modules.tsx` (`roles`), together with permission checks.
* When adding a module: add the route, the menu entry, the `module-behaviors.ts` entry if it uses the generic engine, and make sure the backend permission model/actions exist.

---

# API Layer

* Always call the backend through `apiRequest` (`@/lib/api/client`). It:
  * prefixes `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`)
  * sends cookies (`credentials: "include"`) and the CSRF header `X-CSRF-Token` for mutations
  * JSON-encodes plain objects and passes `FormData` through
  * throws `ApiError` and clears the session on 401
* Lists: `fetchPaginated(endpoint, page, limit, filters)` (`@/lib/api/paginated`). It sends `page`, `limit` and `sortOrder=desc`, and returns `{ items, total }`.
* CRUD: `fetchResourceById`, `createResource`, `updateResource`, `archiveResource` and `deleteResource` (`@/lib/api/resource`). Use `multipart` for file fields.
* Pagination params are always `page` and `limit`. Never introduce `offset`, `skip`, `take` or `perPage`.
* Filters use the backend query syntax already in use (e.g. `"u.type": "student"`, `"u.type.in": "admin,teacher"`).
* Never fetch the same endpoint twice for the same data. Reuse fetched data and refresh with the same fetch function after mutations.
* Do not call `fetch()` directly in UI components. Put API logic in `actions.ts` or `lib/api/*`.

---

# DTO & Types

* API contracts live in `src/lib/dto/` with a `Dto` suffix (e.g. `AnnouncementDto`, `AuthUserDto`). Generic records use `ApiRecordDto` / `ApiListResponseDto` from `@/lib/dto/api`.
* Local `types.ts` holds page-level types (e.g. `export type UserRow = ApiRecordDto;`).
* Search `lib/dto` and local `types.ts` before defining a type. Do not redefine contracts.

---

# Helpers

* Search `src/lib/` before writing a helper (`helper/date.ts`, `helper/export.ts`, `helper/text.ts`, `utils.ts`).
* New reusable helpers go to `src/lib/helper/`, never inside page components.
* Date/time: use the date helpers and keep `date`, `time` and `datetime-local` input values stable. Be careful with `toLocaleString("id-ID")` and ISO conversion.

---

# UI Standards

* Use primitives from `@/components/ui` (Button, Input, Label, Select, Dialog, Sheet, Popover, Tooltip, Table, Badge, Skeleton, Textarea, Calendar, Chart, Sidebar, Separator, Sonner). Never use raw `<button>`, `<select>` or custom modals when a primitive exists.
* Reuse the shared selectors (`role-select`, `region-select`, `teacher-multi-select`, `learning-group-multi-select`, `activity-category-select`, `resource-autocomplete`, `search-dropdown`) and dialogs (`import-dialog`, `quiz-import-dialog`).
* Filters: use `filterFields` in the module config so every page shares the same filter UI. Text/search filters must be debounced and must be supported by the backend.
* Tables: use the `DefaultModulePage` / `DynamicPage` table with pagination, loading, empty and error states.
* Delete/archive must use the existing confirmation pattern.
* Size dialogs to their content. Dense forms may be wider and multi-column.
* Toasts: `toast` from `sonner`.
* Styling: Tailwind with the existing spacing, typography, colors and radius. Always responsive and dark-mode compatible.

---

# Icons

* Use **Hugeicons only**. `lucide-react` has been removed; do not add it back.
* Import icons from `@/lib/icons` (e.g. `import { Search, Trash2 } from "@/lib/icons"`). Each export wraps a `@hugeicons/core-free-icons` icon in `HugeiconsIcon` with `strokeWidth={2}`.
* For an icon-typed prop, use `AppIcon` from `@/lib/icons`.
* If an icon is missing, add it to `src/lib/icons.tsx` with `createIcon(SomeHugeIcon, "Name")` and do not import another library. Inside `components/ui`, using `HugeiconsIcon` directly is fine (shadcn default).
* Keep icon sizes consistent (`size-4` in buttons and tables).

---

# File Upload & H5P

* Uploads are sent to the backend as `multipart` `FormData` through `createResource` / `updateResource`. The backend stores files in MinIO. Never store files locally or add another upload mechanism.
* H5P content goes through `services/h5p.service.ts` and `components/h5p-editor.tsx` / `h5p-player.tsx`.

---

# Dashboard

Dashboards are role-aware (`pages/dashboard/components/roles/*`). Each role sees decision-relevant metrics:

* `super_admin` / `owner`: tenant/institution-level strategy and growth
* `admin` / `dinas`: institution operations, attendance and activity visibility
* `teacher` / `guru` / `staff`: classes, learning groups, quizzes and attendance
* students do not access the CRM (`canAccessCrm`)

Label counts clearly. Do not reuse the same blocks for every role.

---

# Naming & Code Style

* Files are kebab-case (`form-page.tsx`, `user-qr-card.tsx`). Configs are `FEATURE_PAGE_CONFIG` or `getFeaturePageConfig(...)`.
* Actions are `fetchX`, `createX`, `updateX`, `deleteX`. DTOs are `SomethingDto`.
* Use alias imports (`@/components`, `@/components/ui`, `@/lib`, `@/hooks`).
* Prefer early returns, async/await, optional chaining, nullish coalescing and small functions.
* Avoid duplicated state, unnecessary `useEffect` and unnecessary abstraction.
* Avoid vague names (`data`, `temp`, `item`, `newData`).
* Follow `react-refresh/only-export-components`: component files export components; put hooks and helpers in separate files.

Recommended maximums: `page.tsx` ≤ 700 lines, component ≤ 500, action ≤ 250, helper ≤ 150. `backend-module-page.tsx` and `backend-module-form-page.tsx` already exceed this. Split them when touching them, and do not grow them further.

---

# Final Checklist

* Structure matches the nearest equivalent module (`page.tsx`, `page.config.tsx`, `actions.ts`, `types.ts`, `components/`)
* DTO, helpers, components, filters and table reused
* `@/components/ui` primitives and `@/lib/icons` icons used
* `page` / `limit` pagination; no duplicate requests; search really supported by the API; debounce on live filters
* Routes guarded with permissions; menu and `module-behaviors.ts` updated for new modules
* User-dependent config computed at render time
* Responsive and dark mode compatible
* Verification, in order:
  1. `npm run build` (required)
  2. `npm run lint`
  3. Manual check of the affected UI and main flow
