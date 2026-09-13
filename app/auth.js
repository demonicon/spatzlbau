// Login with e-mail and password (docs/changes/001). No self sign-up, no password reset
// from the app: accounts are created and reset by Sebastian in the Supabase dashboard.
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

/** Wire the login form. Success is observed via onAuthChange. */
export function initLoginForm() {
  const form = $('#login-form');
  const email = $('#login-email');
  const password = $('#login-password');
  const toggle = $('#login-toggle');
  const submit = $('#login-submit');
  const msg = $('#login-msg');
  try {
    email.value = localStorage.getItem(EMAIL_KEY) || '';
  } catch {}

  const say = (text, err = false) => {
    msg.textContent = text;
    msg.classList.toggle('err', err);
  };

  toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Verbergen' : 'Anzeigen';
    toggle.setAttribute('aria-pressed', String(show));
    password.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const addr = email.value.trim().toLowerCase();
    const pw = password.value;
    if (!addr.includes('@') || !pw) return say('Bitte E-Mail und Passwort eingeben.', true);
    submit.disabled = true;
    say('Anmelden …');
    const { error } = await supabase.auth.signInWithPassword({ email: addr, password: pw });
    submit.disabled = false;
    if (error) {
      // one message for wrong password and unknown address alike; backend text never shown
      const rejected = error.status === 400 || error.status === 401 || error.status === 403 || error.status === 422;
      return say(rejected ? 'E-Mail oder Passwort stimmt nicht.' : 'Anmeldung gerade nicht möglich. Bitte später noch einmal versuchen.', true);
    }
    try {
      localStorage.setItem(EMAIL_KEY, addr);
    } catch {}
    password.value = '';
    say('');
  });
}
