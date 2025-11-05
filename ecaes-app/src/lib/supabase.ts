// lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

// 1. Leemos las variables de entorno aquí
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Comprobación de seguridad
//    Si las variables no se cargaron, la aplicación debe fallar
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Error: Faltan las variables de entorno de Supabase (URL o Anon Key)."
  );
}

// 3. Cliente para uso en Componentes de Servidor
//    (Puedes dejarlo si lo usas en otro lado)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 4. ESTA ES LA FUNCIÓN IMPORTANTE que usan tus páginas "use client"
export const createSupabaseClient = () => {
  // Simplemente devolvemos un cliente nuevo con las variables que ya leímos
  return createClient(supabaseUrl, supabaseAnonKey);
};
