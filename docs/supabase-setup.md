# Configuración de Supabase

Esta guía resume todo lo necesario para apuntar la app a tu instancia real de Supabase.

## 1. Variables de entorno

Usa el archivo `.env` (ya creado en la raíz del repo) con las credenciales del proyecto:

| Variable | Descripción |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto (ej. `https://xyzcompany.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima (Public API Key) del proyecto. |

> Si usas otros entornos (staging/prod), crea archivos `.env.staging`, `.env.production`, etc. y configura tu pipeline para inyectar los valores correctos.

## 2. Esquema de base de datos

El sistema solo necesita dos tablas (`items` y `categories`) más sus políticas RLS. Ejecuta el SQL descrito en `docs/supabase-schema.md` dentro del editor SQL de Supabase o agrégalo a tu sistema de migraciones. Asegúrate de:

1. Crear el tipo `items_type`.
2. Crear ambas tablas + índices.
3. Activar RLS y aplicar las políticas `Users can CRUD their own ...`.

## 3. Conectar la app

1. Copia tus valores reales en `.env`.
2. Instala dependencias si aún no lo hiciste: `npm install`.
3. Levanta la app con `npm run dev` (Vite cargará automáticamente las variables `VITE_*`).

La app detecta si Supabase está configurado al leer `VITE_SUPABASE_URL`. Cuando todo está listo, las operaciones CRUD dejarán de usar LocalStorage y hablarán directo con Supabase (ver `services/api.ts`).

## 4. Pruebas y despliegues

- **Local:** valida que puedes agregar/editar/borrar prompts y categorías. Verifica en la tabla `items` que los registros pertenezcan al usuario autenticado.
- **CI/CD:** nunca subas la API key a control de versiones. Usa secretos del proveedor para rellenar las variables.
- **Producción:** para builds de Vite, asegúrate de exportar las mismas variables en tu entorno de hosting (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

Con esto tendrás el backend listo y la app apuntando a tu proyecto real.
