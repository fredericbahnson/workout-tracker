import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// These will be replaced with actual values from environment or config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase', 'Supabase credentials not configured. Cloud sync disabled.');
}

// Using generic client for flexibility with our schema.
// Placeholder values keep createClient from throwing at module load when the
// env vars are absent (which previously blanked the whole app); every caller
// gates actual usage behind isSupabaseConfigured().
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
