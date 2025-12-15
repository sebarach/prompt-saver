import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Accedemos a las variables de forma segura usando un objeto vacío como fallback
// Esto evita el error "Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')"
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Faltan variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). La aplicación iniciará en modo desconectado.");
}

// Inicializamos el cliente con valores fallback si no existen las variables
// Esto permite que la UI cargue y muestre el AuthScreen con el mensaje de error apropiado en lugar de crashear
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);