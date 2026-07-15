# Kinder Pilot Frontend — Architecture

## Monorepo layout

```
kinder-pilot-frontend/
├── apps/
│   ├── admin-portal/     # Staff / Teachers / Admins (port 3000)
│   └── parent-portal/    # Parents — mobile-first (port 3001)
├── packages/
│   ├── types/            # Shared TS models + Permission keys
│   ├── api-client/       # Fetch wrapper + tenant branding resolver
│   └── ui/               # HasPermission, VirtualTable, shared tokens
├── pnpm-workspace.yaml
└── turbo.json
```

## Tenant routing (Edge Middleware)

> **Next.js note:** Folders prefixed with `_` are private and never become routes.
> Blueprint `_admin/[tenant]` is implemented as routable `i/admin/[tenant]`.

| Host | App rewrite (URL unchanged in browser) |
|------|----------------------------------------|
| `drsofiasdaycare.kinderpilot.com/dashboard` | `/i/admin/drsofiasdaycare/dashboard` |
| `portal.drsofiasdaycare.com/dashboard` | `/i/admin/drsofiasdaycare/dashboard` |
| Parent app `/home` | `/i/parents/{tenant}/home` |

Local fallback tenant: `NEXT_PUBLIC_DEFAULT_TENANT=kinder-pilot`

## Whitelabel

1. Middleware resolves `x-tenant-slug` from Host.
2. `i/admin/[tenant]/layout.tsx` / `i/parents/[tenant]/layout.tsx` fetch branding via `getTenantBranding()`.
3. CSS variables (`--brand-50`…`--brand-900`) injected into `:root` before paint.
4. Tailwind `brand.*` colors read `var(--brand-*)`.

## State sync

- **Zustand** (`useTenantStore`) — tenant, branch, permissions, sidebar UI.
- **TanStack Query** — branch switch invalidates + refetches active queries.
- **API client** — auto-injects `Authorization`, `X-Tenant-ID`, `X-Branch-ID`.

## Security & scale

- `<HasPermission name="billing.write">` — declarative RBAC gate.
- `<VirtualTable>` / `VirtualStudentTable` — `@tanstack/react-virtual` for large grids.

## Commands

```bash
pnpm install
pnpm dev:admin    # localhost:3000
pnpm dev:parent   # localhost:3001
pnpm build
```
