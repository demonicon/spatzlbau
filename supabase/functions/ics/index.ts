// Edge Function "ics" (docs/changes/022): the deadline-critical tasks and the five gates as a
// calendar anyone can subscribe to.
//
//   GET /ics?token=<settings.ics_token>&person=S|A   ->  text/calendar
//   wrong or missing token                           ->  401, no explanation
//
// It reads with the service role, because a calendar client has no login. The token is the whole
// secret. Nothing here writes. Every decision (token check, status, headers) sits in ics.js, so
// it can be tested without Deno; this file is only the wiring.
//
// Deploy (Sebastian, not Claude Code):
//   supabase functions deploy ics --no-verify-jwt --project-ref <ref>
// --no-verify-jwt is the point: a calendar app sends no Authorization header.
// Optional env: APP_URL (the address the links in the events point to).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleIcs } from './ics.js';

const APP_URL = Deno.env.get('APP_URL') || 'https://sylv83.github.io/pwa-spatzlbau/';

Deno.serve(async (req: Request) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const res = await handleIcs({
    url: req.url,
    method: req.method,
    appUrl: APP_URL,
    load: async () => {
      const { data: rows, error } = await supabase.from('settings').select('key,value');
      if (error) throw error;
      const settings = Object.fromEntries((rows ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
      const { data: tasks, error: taskErr } = await supabase.from('tasks').select('*').is('deleted_at', null);
      if (taskErr) throw taskErr;
      return { settings, tasks: tasks ?? [] };
    },
  });

  return new Response(req.method === 'HEAD' ? null : res.body, { status: res.status, headers: res.headers });
});
