import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = 'https://wqbysotxdyynxmjbbhkk.supabase.co';
const defaultKey = 'sb_publishable_mvpebkyGXF3Wbiv3auahuQ_wthMKbS6';

export function getSupabaseConfig(): { url: string; anonKey: string; isReady: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const winConfig = typeof window !== 'undefined' ? (window as unknown as { RITIM_CONFIG?: { supabaseUrl?: string; supabaseAnonKey?: string } }).RITIM_CONFIG : undefined;

  const url = (envUrl || winConfig?.supabaseUrl || defaultUrl).trim();
  const anonKey = (envKey || winConfig?.supabaseAnonKey || defaultKey).trim();

  const isReady = url.startsWith('https://') && !!anonKey && !anonKey.includes('SUPABASE_');
  return { url, anonKey, isReady };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  const { url, anonKey, isReady } = getSupabaseConfig();
  if (!isReady) return null;
  supabaseInstance = createClient(url, anonKey);
  return supabaseInstance;
}
