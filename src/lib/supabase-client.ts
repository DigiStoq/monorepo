import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// User provided 'VITE_SUPABASE_PUBLISABLE_KEY' instead of 'VITE_SUPABASE_ANON_KEY'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Supabase Client Initialization Error: Missing Environment Variables"
  );
  console.error({
    VITE_SUPABASE_URL: SUPABASE_URL ? "Defined" : "Undefined",
    VITE_SUPABASE_PUBLISABLE_KEY: SUPABASE_KEY ? "Defined" : "Undefined",
  });

  throw new Error(
    `Supabase Environment Variables missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISABLE_KEY are set.`
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false, // We handle persistence in Tauri store
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
