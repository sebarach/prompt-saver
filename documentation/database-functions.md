# DevVault — Database Functions Reference

All functions use `SECURITY INVOKER`, have `REVOKE ALL FROM PUBLIC`, and `GRANT EXECUTE TO authenticated`.

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| `P0001` | Validation error | Empty title, empty content |
| `P0002` | Not found | Delete/update non-existent item |
| `P0003` | Duplicate | Category with same name already exists for user |

---

## Items

### `get_items()`

Returns all items for the authenticated user, ordered by `created_at DESC`.

- **Returns**: `SETOF items`
- **RPC call**: `supabase.rpc('get_items')`

### `create_item(p_type, p_title, p_content, p_description, p_category, p_tags)`

Creates a new item. Validates that `p_title` and `p_content` are non-empty. Automatically assigns `auth.uid()` as the `user_id`.

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `p_type` | `items_type` (`'prompt'` / `'command'` / `'snippet'`) | Yes | — |
| `p_title` | `text` | Yes | — |
| `p_content` | `text` | Yes | — |
| `p_description` | `text` | No | `''` |
| `p_category` | `text` | No | `'General'` |
| `p_tags` | `text[]` | No | `'{}'` |

- **Returns**: `items` (the created row)
- **Errors**: `P0001` if title or content is empty

### `update_item(p_id, p_title, p_content, p_description, p_category, p_tags, p_is_deprecated)`

Updates an existing item using COALESCE-based partial updates — only provided fields are changed.

| Parameter | Type | Required |
|-----------|------|----------|
| `p_id` | `uuid` | Yes |
| `p_title` | `text` | No |
| `p_content` | `text` | No |
| `p_description` | `text` | No |
| `p_category` | `text` | No |
| `p_tags` | `text[]` | No |
| `p_is_deprecated` | `boolean` | No |

- **Returns**: `items` (the updated row)
- **Errors**: `P0002` if item not found

### `delete_item(p_id)`

Deletes an item by ID. Only the owner (via RLS + `auth.uid()`) can delete.

| Parameter | Type | Required |
|-----------|------|----------|
| `p_id` | `uuid` | Yes |

- **Returns**: `void`
- **Errors**: `P0002` if item not found

---

## Categories

### `get_categories()`

Returns all categories for the authenticated user, ordered by `name ASC`.

- **Returns**: `SETOF categories`
- **RPC call**: `supabase.rpc('get_categories')`

### `create_category(p_name)`

Creates a new category. Validates non-empty name and checks for case-insensitive duplicates per user.

| Parameter | Type | Required |
|-----------|------|----------|
| `p_name` | `text` | Yes |

- **Returns**: `categories` (the created row)
- **Errors**: `P0001` if name is empty, `P0003` if duplicate

---

## RLS Policies

Both tables have a single ALL policy:

```sql
-- items
CREATE POLICY "items_user_isolation" ON items
  FOR ALL USING ((select auth.uid()) = user_id);

-- categories
CREATE POLICY "categories_user_isolation" ON categories
  FOR ALL USING ((select auth.uid()) = user_id);
```

The `(select auth.uid())` pattern (with subquery) avoids re-evaluating `auth.uid()` per row (PostgreSQL initplan optimization).

---

## pgTAP Tests

24 tests covering:
- Function existence and return types
- RLS policy existence and correctness
- Permission grants (authenticated role)
- Permission revokes (public/anon)

Run with:
```sql
SELECT * FROM run_pgtap_rpc_tests();
```
