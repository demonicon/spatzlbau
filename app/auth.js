// Login: magic link by e-mail, or the 6-digit code from the same e-mail (works inside the
// home-screen PWA on iOS, where the link would open in Safari instead).
import { supabase } from './supabase.js';
import { $ } from './ui/dom.js';

const EMAIL_KEY = 'umzug-email';

export function getSession() {
  return supabase.auth.getSession().then((r) => r.data.session);
}

export function onAuthChange(fn) {
  supabase.auth.onAuthStateChange((_event, session) => fn(session));
}

export async function whoAmI() {
  // person code from the allowlist; null = logged in but not allowed
  const { data, error } = await supabase.rpc('current_person');
  if (error) throw error;
  return data || null;
}

export function signOut() {
  return supabase.auth.signOut();
}

/** Wire the login form. Returns nothing; success is observed via onAuthChange. */
export function initLoginForm() {
  const form = $('#login-form');
  const email = $('#login-email');
  const code = $('#login-code');
  const msg = $('#login-msg');
  const codeStep = $('#login-code-step');
  try {
    email.value = localStorage.getItem(EMAIL_KEY) || '';
  } catch {}

  const say = (text, err = false) => {
    msg.textContent = text;
    msg.classList.toggle('err', err);
  };
  const busy = (b) => form.querySelectorAll('button').forEach((x) => (x.disabled = b));

  $('#login-send').addEventListener('click', async () => {
    const addr = email.value.trim().toLowerCase();
    if (!addr.includes('@')) return say('Bitte eine E-Mail-Adresse eingeben.', true);
    busy(true);
    say('Mail wird verschickt …');
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: location.origin + location.pathname },
    });
    busy(false);
    if (error) return say('Das hat nicht geklappt: ' + error.message, true);
    try {
      localStorage.setItem(EMAIL_KEY, addr);
    } catch {}
    codeStep.hidden = false;
    code.focus();
    say('Mail ist raus. Entweder den Link in der Mail antippen – oder den 6-stelligen Code hier eingeben.');
  });

  $('#login-verify').addEventListener('click', async () => {
    const addr = email.value.trim().toLowerCase();
    const token = code.value.replace(/\D/g, '');
    if (token.length < 6) return say('Der Code hat 6 Ziffern.', true);
    busy(true);
    say('Code wird geprüft …');
    const { error } = await supabase.auth.verifyOtp({ email: addr, token, type: 'email' });
    busy(false);
    if (error) return say('Code ungültig oder abgelaufen: ' + error.message, true);
    say('Eingeloggt.');
  });

  form.addEventListener('submit', (e) => e.preventDefault());
  code.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#login-verify').click();
  });
  email.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#login-send').click();
  });
}
