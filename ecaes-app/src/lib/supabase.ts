import { createClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente básico para uso general (solo en servidor)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente para componentes de cliente (use client)
export const createSupabaseClient = () => {
  return createClientComponentClient();
};
