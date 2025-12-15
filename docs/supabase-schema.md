# Esquema de Supabase para Prompt Saver

Este documento resume las tablas que la aplicación utiliza cuando está conectada a Supabase (ver `services/api.ts` y `types/supabase.ts`). Con esto podrás recrear la base de datos directamente desde la consola de SQL de Supabase o con una migración.

## Resumen rápido

| Tabla | Propósito | Relación principal |
| --- | --- | --- |
| `public.items` | Guarda cada prompt o comando almacenado por el usuario | `user_id` → `auth.users.id` |
| `public.categories` | Lista de categorías personalizadas que el usuario puede crear | `user_id` → `auth.users.id` |

> Activa RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) y crea políticas simples de lectura/escritura por usuario para cada tabla.

---

## Tabla `public.items`

Tabla central del proyecto; cada registro representa un prompt (`type = 'prompt'`) o un comando CLI (`type = 'command'`).

| Columna | Tipo sugerido | Restricciones / default | Notas |
| --- | --- | --- | --- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | En el código se maneja como `string`. |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE` | Identifica al dueño del item. |
| `type` | `text` o `items_type` (`enum`) | `NOT NULL CHECK (type IN ('prompt','command'))` | Controla la vista (prompts/commands). |
| `category` | `text` | `NOT NULL` | Etiqueta tipo “Azure”, “React”, etc. |
| `title` | `text` | `NOT NULL` | Nombre visible de la tarjeta. |
| `content` | `text` | `NOT NULL` | Prompt o comando completo. |
| `description` | `text` | `DEFAULT NULL` | Opcional al crear/editar. |
| `tags` | `text[]` | `DEFAULT '{}'::text[]` | Guardado como arreglo JSON en el front. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT timezone('utc', now())` | Se proyecta al front como `createdAt`. |

### SQL sugerido

```sql
create type public.items_type as enum ('prompt', 'command');

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.items_type not null,
  category text not null,
  title text not null,
  content text not null,
  description text,
  tags text[] default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now())
);

create index items_user_id_idx on public.items (user_id);
create index items_category_idx on public.items (category);
create index items_type_idx on public.items (type);
create index items_created_at_idx on public.items (created_at desc);
```

---

## Tabla `public.categories`

Se usa para poblar el sidebar de contextos personalizados. Antes de insertar una categoría nueva se verifica si existe (`name` único por usuario).

| Columna | Tipo sugerido | Restricciones / default | Notas |
| --- | --- | --- | --- |
| `id` | `bigserial` | `PRIMARY KEY` | También puede ser `uuid`. |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE` | Relaciona la categoría con el usuario. |
| `name` | `text` | `NOT NULL` + `UNIQUE (user_id, name)` | Texto mostrado en la UI. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT timezone('utc', now())` | Solo informativo. |

### SQL sugerido

```sql
create table public.categories (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint categories_user_name_key unique (user_id, name)
);

create index categories_user_id_idx on public.categories (user_id);
create index categories_name_idx on public.categories (name);
```

---

## Políticas RLS recomendadas

Aplica las mismas políticas a ambas tablas:

```sql
alter table public.items enable row level security;
alter table public.categories enable row level security;

create policy "Users can CRUD their own items"
  on public.items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can CRUD their own categories"
  on public.categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Con esto ya tienes cubiertas todas las tablas que el proyecto necesita para usar Supabase en vez de LocalStorage.
