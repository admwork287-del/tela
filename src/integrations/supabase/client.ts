import { createClient } from "@supabase/supabase-js";

// Chaves públicas do seu projeto Supabase (seguras para o navegador — protegidas por RLS).
const SUPABASE_URL = "https://xoqgxbkbfdwcqeflrusl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcWd4YmtiZmR3Y3FlZmxydXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTEwNjEsImV4cCI6MjEwMDg2NzA2MX0.3MPGTF55-jnTu5njYiyfZYan9T1qF_XYRP7b1VlpuBo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "olx-clone-auth",
  },
});
