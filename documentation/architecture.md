# DevVault — Architecture

## Overview

DevVault is a personal developer vault for storing prompts, CLI commands, and code snippets. It is a single-page application (SPA) built with React 19 + Vite 7, backed by Supabase (PostgreSQL 17).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   React SPA (Vite)                   │
│                                                     │
│  index.tsx                                          │
│   └─ QueryClientProvider (TanStack Query v5)        │
│       └─ AuthProvider (context/AuthContext.tsx)      │
│           └─ DashboardContent (App.tsx)              │
│               ├─ useItems()          ← hooks/       │
│               ├─ useCreateItem()                    │
│               ├─ useUpdateItem()                    │
│               ├─ useDeleteItem()                    │
│               ├─ useCategories()                    │
│               └─ useCreateCategory()                │
│                                                     │
│  hooks/ ──→ services/ ──→ supabase.rpc()            │
│  (TanStack     (pure        (Supabase JS            │
│   Query)       async)        client)                │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS (PostgREST /rpc/)
                  ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL 17)                │
│                                                     │
│  RPC Functions (SECURITY INVOKER)                   │
│  ├─ get_items()                                     │
│  ├─ create_item(...)                                │
│  ├─ update_item(...)                                │
│  ├─ delete_item(...)                                │
│  ├─ get_categories()                                │
│  └─ create_category(...)                            │
│                                                     │
│  RLS Policies (defense-in-depth)                    │
│  ├─ items: (select auth.uid()) = user_id            │
│  └─ categories: (select auth.uid()) = user_id      │
│                                                     │
│  Tables                                             │
│  ├─ items (id, user_id, type, title, content, ...)  │
│  └─ categories (id, user_id, name)                  │
└─────────────────────────────────────────────────────┘
```

## Design Principles

### 1. Solo RPC — No Direct Table Access

All database operations go through PostgreSQL functions via `supabase.rpc()`. There are **zero** `.from('table')` queries in the client. This provides:

- **Decoupling**: Schema changes don't break the client as long as the function signatures stay stable.
- **Security**: Business logic and validation live in the DB, not in client code.
- **Performance**: Functions can be optimized with EXPLAIN/ANALYZE without touching the frontend.

### 2. Repository/Service Pattern

```
Component → Hook → Service → supabase.rpc()
```

| Layer | Location | Responsibility |
|-------|----------|---------------|
| **Hooks** | `hooks/useItems.ts`, `hooks/useCategories.ts` | TanStack Query wrappers — cache, mutations, invalidation |
| **Services** | `services/items.service.ts`, `services/categories.service.ts` | Pure async functions calling `supabase.rpc()` + row-to-domain mapping |
| **Client** | `lib/supabase.ts` | Singleton Supabase client initialized from env vars |

### 3. TanStack Query v5 for State Management

- **No useState for server data** — all items/categories come from TanStack Query cache.
- **Optimistic-like updates**: Mutations do `setQueryData` (instant UI update) + `invalidateQueries` (background refetch for consistency).
- **Centralized query keys** in `lib/queryClient.ts` — single source of truth prevents stale key bugs.
- **Defaults**: `staleTime: 2min`, `gcTime: 10min`, `retry: 1`, `refetchOnWindowFocus: false`.

### 4. Security Model

- **SECURITY INVOKER** on all RPC functions — they execute with the caller's permissions.
- **RLS is defense-in-depth**: Policies ensure `(select auth.uid()) = user_id` even if someone calls `.from()` directly.
- **REVOKE ALL FROM PUBLIC + GRANT EXECUTE TO authenticated** on every function.
- **Custom error codes**: `P0001` (validation), `P0002` (not found), `P0003` (duplicate).

## File Structure

```
prompt-saver/
├── index.tsx              # Entry point — QueryClientProvider + App
├── App.tsx                # Auth gate + DashboardContent (all hooks consumed here)
├── context/
│   └── AuthContext.tsx     # Supabase Auth (session management, signOut)
├── hooks/
│   ├── useItems.ts        # useItems, useCreateItem, useUpdateItem, useDeleteItem
│   └── useCategories.ts   # useCategories, useCreateCategory
├── services/
│   ├── items.service.ts   # RPC calls + row→domain mapper for items
│   └── categories.service.ts # RPC calls for categories
├── lib/
│   ├── supabase.ts        # Supabase client init (env vars, typed with Database)
│   ├── queryClient.ts     # QueryClient config + centralized queryKeys
│   └── colors.ts          # Category color system (localStorage for custom colors)
├── types/
│   └── supabase.ts        # Auto-generated Supabase types + RPC function definitions
├── types.ts               # Domain types (Item, ViewMode, FilterState, ItemType)
├── components/            # UI components (Sidebar, ItemCard, ItemForm, etc.)
├── __tests__/             # Vitest test suite
│   ├── setup.ts           # Test setup (jest-dom, cleanup)
│   ├── helpers.tsx         # Test utils (renderHookWithQuery)
│   ├── items.service.test.ts
│   ├── categories.service.test.ts
│   ├── useItems.test.tsx
│   └── useCategories.test.tsx
├── documentation/         # Project docs (this folder)
├── docs/                  # Vite build output (GitHub Pages)
└── .env                   # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

## Testing Strategy

| Layer | Framework | Count | Approach |
|-------|-----------|-------|----------|
| **Database (RPC + RLS)** | pgTAP | 24 tests | Run via `SELECT * FROM run_pgtap_rpc_tests()` in Supabase |
| **Services** | Vitest | 10 tests | Mock `supabase.rpc()` via `vi.mock` |
| **Hooks** | Vitest + React Testing Library | 12 tests | `renderHook` with QueryClientProvider, mock service layer |

Total: **46 tests** (24 pgTAP + 22 Vitest).
