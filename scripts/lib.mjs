// Shared helpers for the Node scripts: .env loading and a minimal PostgREST client
// using the service role key (bypasses RLS – local use only, never ship this key).
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv() {
  let text;
  try {
    text = readFileSync(resolve(ROOT, '.env'), 'utf8');
  } catch {
    throw new Error('.env not found – see SETUP.md step 6');
  }
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) if (!env[k]) throw new Error(`.env: ${k} missing`);
  return env;
}

export function restClient(env) {
  const base = env.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/';
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
  };
  async function call(method, path, body, prefer) {
    const res = await fetch(base + path, {
      method,
      headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  }
  return {
    select: (table, query = 'select=*') => call('GET', `${table}?${query}`),
    insert: (table, rows, prefer = 'return=representation') => call('POST', table, rows, prefer),
    upsertIgnore: (table, rows, onConflict) =>
      call('POST', `${table}?on_conflict=${onConflict}`, rows, 'resolution=ignore-duplicates,return=minimal'),
    upsertMerge: (table, rows, onConflict) =>
      call('POST', `${table}?on_conflict=${onConflict}`, rows, 'resolution=merge-duplicates,return=minimal'),
    update: (table, filter, patch) => call('PATCH', `${table}?${filter}`, patch, 'return=minimal'),
  };
}
