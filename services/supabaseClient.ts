
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access environment variables directly.
// These must be set in your .env file and exposed via vite.config.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client only if credentials are available
// This prevents "supabaseUrl is required" errors during development or if env vars are missing
let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
} else {
  console.warn("Supabase URL or Key is missing. The app will run in offline/mock mode.");
}

export const supabase = supabaseInstance;
