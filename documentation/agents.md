# DevVault — Agent Instructions

This document provides context for AI coding agents working on the DevVault codebase.

## Project Identity

- **Name**: DevVault (repo: `prompt-saver`)
- **Purpose**: Personal developer vault for prompts, CLI commands, and code snippets
- **Stack**: React 19 + Vite 7 + TanStack Query v5 + Supabase (PostgreSQL 17)
- **Supabase Project**: `ncknlimqqqgicbcoerxi` (region: `us-west-2`)

## Architecture Rules

1. **Solo RPC** — All database operations MUST go through `supabase.rpc()`. Never use `.from('table')` queries.
2. **Service Pattern** — Components never call Supabase directly. The chain is: `Component → Hook → Service → supabase.rpc()`.
3. **TanStack Query** — All server state is managed by TanStack Query v5. No `useState` for items/categories data.
4. **SECURITY INVOKER** — All PostgreSQL functions use `SECURITY INVOKER` so RLS policies apply.
5. **No Demo Mode** — There is no localStorage fallback or demo user. Supabase auth is required.
6. **Error Pattern** — Services throw errors, hooks propagate them via TanStack Query's `error` state, components show toast notifications via try/catch on `mutateAsync()`.

## Key Files to Understand

| File | Role |
|------|------|
| `App.tsx` | Main component — consumes all hooks, handles UI state |
| `hooks/useItems.ts` | TanStack Query hooks for items CRUD |
| `hooks/useCategories.ts` | TanStack Query hooks for categories |
| `services/items.service.ts` | RPC calls + row-to-domain mapping |
| `services/categories.service.ts` | RPC calls for categories |
| `lib/queryClient.ts` | QueryClient config + centralized `queryKeys` |
| `lib/supabase.ts` | Supabase client (fails hard if env vars missing) |
| `types.ts` | Domain types (`Item`, `ViewMode`, etc.) |
| `types/supabase.ts` | Auto-generated DB types + RPC function signatures |
| `context/AuthContext.tsx` | Auth state (user, session, signOut) |

## Adding a New Feature

### Adding a new RPC function

1. Create the migration in Supabase with: `CREATE OR REPLACE FUNCTION`, `SECURITY INVOKER`, `REVOKE ALL FROM PUBLIC`, `GRANT EXECUTE TO authenticated`.
2. Add the function type to `types/supabase.ts` under `Database['public']['Functions']`.
3. Add a method to the appropriate service file (`services/*.service.ts`).
4. Create a hook in `hooks/` using `useQuery` or `useMutation`.
5. Add pgTAP tests for the new function.
6. Add Vitest tests for the service method and hook.

### Adding a new table

1. Create the table with RLS enabled and a policy using `(select auth.uid()) = user_id`.
2. Add table types to `types/supabase.ts`.
3. Create a new service + hook pair.
4. Add a new query key to `lib/queryClient.ts`.

## Testing

- **pgTAP** (24 tests): `SELECT * FROM run_pgtap_rpc_tests();` in Supabase SQL editor
- **Vitest** (22 tests): `npm test` or `npm run test:watch`
- All service tests mock `supabase.rpc()` via `vi.mock('../lib/supabase', ...)`
- All hook tests use `renderHookWithQuery()` from `__tests__/helpers.tsx`

## Build & Deploy

- `npm run dev` — Vite dev server
- `npm run build` — Outputs to `/docs` (GitHub Pages)
- `npm test` — Vitest (22 frontend tests)
- The `/docs` folder is the build artifact; project documentation lives in `/documentation/`

## Default Categories

The app merges hardcoded defaults (`General, Azure, AWS, React, NPM, Docker, Git`) with DB categories and categories from existing items. This logic lives in `App.tsx` as a `useMemo`.

## Environment Variables

```
VITE_SUPABASE_URL=https://ncknlimqqqgicbcoerxi.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

The app will throw at startup if these are missing.
