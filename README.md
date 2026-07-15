# Kinder Pilot Frontend

Multi-tenant daycare ERP — Turborepo monorepo.

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for routing, whitelabeling, and state sync design.

```bash
pnpm install
pnpm dev:admin    # Staff ERP → http://localhost:3000
pnpm dev:parent   # Parent app → http://localhost:3001
```

Legacy single-app sources may still exist under `/src` at the repo root; the active apps live in `apps/`.
