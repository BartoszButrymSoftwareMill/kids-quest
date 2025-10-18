/// <reference types="astro/client" />

import type { SupabaseClient } from './db/supabase.client';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly OPENROUTER_API_KEY?: string;
  readonly APP_VERSION?: string;
  readonly NODE_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
