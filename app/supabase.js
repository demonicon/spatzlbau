// Single Supabase client for the whole app (supabase-js via CDN ESM, no build step).
// Version pinned on purpose (docs/changes/008): bump it here deliberately, then smoke-test.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // password login only (docs/changes/001): no auth tokens ever arrive via URL
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
