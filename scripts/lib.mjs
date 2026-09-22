// Shared helpers for the Node scripts: .env loading and a minimal PostgREST client
// using the service role key (bypasses RLS – local use only, never ship this key).
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const KEYS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'EXPORT_TOKEN', 'BACKUP_KEY'];

// Process environment wins (GitHub Actions secrets); the local .env fills in the rest.
export function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env – fine when the variables come from the environment */
  }
  for (const k of KEYS) if (process.env[k]) env[k] = process.env[k];
  for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!env[k]) throw new Error(`${k} missing – set it in .env (SETUP.md step 6) or in the environment`);
  }
  return env;
}

export function restClient(env) {
  const base = env.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/';
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
  };
  async function call(method, path, body, prefer, extra = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}), ...extra },
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
    remove: (table, filter) => call('DELETE', `${table}?${filter}`, undefined, 'return=minimal'),
    // every row of a table, in pages (PostgREST caps a single response at 1000 rows)
    all: async (table, query = 'select=*') => {
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const page = (await call('GET', `${table}?${query}`, undefined, undefined, { Range: `${from}-${from + 999}` })) || [];
        rows.push(...page);
        if (page.length < 1000) return rows;
      }
    },
  };
}
