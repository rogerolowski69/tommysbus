# Tommy's Bus — web

Next.js 16 (App Router, Cache Components, Tailwind v4, shadcn/ui on Radix). See the repository
root `README.md` for setup. Useful scripts:

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server on :3000 (proxies `/api/v1/*` to Django) |
| `pnpm build && pnpm start` | Production build / server |
| `pnpm typecheck` / `pnpm lint` | Type-check and lint |
| `pnpm gen:api` | Regenerate `src/lib/api/schema.d.ts` from `../api/schema.yaml` |
| `pnpm test:e2e` | Playwright tests (Django must be running and seeded) |
