/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISABLE_KEY: string;
  readonly VITE_SUPABASE_SECRET_KEY: string;
  readonly VITE_POWERSYNC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
