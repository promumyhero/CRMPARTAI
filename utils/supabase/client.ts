import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://hsxzsvnhdomkhxtzuoff.supabase.co";
const DEFAULT_SUPABASE_PUB_KEY = atob("c2JfcHVibGlzaGFibGVfYndFZzBRbGVmaUNvMHFfOEh0TmFaZ19fN3hVb1JmNQ==");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUB_KEY;

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
