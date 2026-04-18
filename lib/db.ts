import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

// In-memory fallback for when Supabase isn't configured (dev mode)
const memStore: Record<string, any[]> = {
  drafts: [],
  brand_dna: [],
  connections: [],
  feedback: [],
  automations: [],
};

export const memDB = {
  insert: (table: string, row: any) => {
    const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), ...row, created_at: new Date().toISOString() };
    memStore[table] = memStore[table] || [];
    memStore[table].push(item);
    return item;
  },
  list: (table: string) => memStore[table] || [],
  update: (table: string, id: string, updates: any) => {
    const list = memStore[table] || [];
    const i = list.findIndex((x: any) => x.id === id);
    if (i >= 0) list[i] = { ...list[i], ...updates };
    return list[i];
  },
  remove: (table: string, id: string) => {
    memStore[table] = (memStore[table] || []).filter((x: any) => x.id !== id);
  },
};
