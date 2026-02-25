import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const getEnvVar = (key: string): string | undefined => {
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof window !== 'undefined' && (window as any).ENV) {
    return (window as any).ENV[key];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
