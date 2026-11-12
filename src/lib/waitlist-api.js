/**
 * Sends a waitlist sign-up to Brevo through the site's Netlify function (netlify/functions/waitlist.mjs):
 * it joins the "RYDO WAITLIST" list, and Brevo emails the person their pass and the team the details.
 * When VITE_WAITLIST_FORM is set, the Google Sheet gets a copy too (no emails from there).
 *
 * VITE_WAITLIST_FORM is the value setupForm() writes to the sheet's "Website setup" tab:
 * {"action":"https://docs.google.com/forms/d/e/…/formResponse","fields":{"name":"entry.123",…}}
 */
function readConfig() {
  const raw = (import.meta.env.VITE_WAITLIST_FORM || '').trim();
  if (!raw) return null;
  try {
    const config = JSON.parse(raw);
    return config.action && config.fields ? config : null;
  } catch {
    console.error('VITE_WAITLIST_FORM is not valid JSON. Copy the whole cell from the sheet’s "Website setup" tab.');
    return null;
  }
}
const CONFIG = readConfig();

export const waitlistConnected = !!CONFIG;

/** A short reference shown on the pass and in the emails, e.g. WL-3F9A1C2B. */
export function newReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return 'WL-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function toGoogleSheet(entry) {
  const body = new URLSearchParams();
  for (const [key, field] of Object.entries(CONFIG.fields)) body.append(field, String(entry[key] ?? ''));
  // Google Forms doesn't send CORS headers, so the reply can't be read ("no-cors"). A network
  // failure still throws; otherwise the form has accepted the answers.
  await fetch(CONFIG.action, { method: 'POST', mode: 'no-cors', body });
}

const FUNCTION_URL = '/.netlify/functions/waitlist';

export async function submitWaitlist(entry, honeypot = '') {
  const sheet = CONFIG ? toGoogleSheet(entry).then(() => true, () => false) : Promise.resolve(false);
  let response;
  try {
    response = await fetch(FUNCTION_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...entry, company: honeypot }) });
  } catch {
    if (await sheet) return { ok: true };
    throw new Error('We couldn’t reach the waitlist. Check your connection and try again.');
  }
  if (response.ok) {
    const result = await response.json().catch(() => ({}));
    await sheet;
    return { ok: true, reference: result.reference, existing: !!result.existing };
  }
  // No function here (local Vite preview) or Brevo not set up yet: fall back to the sheet or a preview.
  if (response.status === 404 || response.status === 503) {
    if (await sheet) return { ok: true };
    if (import.meta.env.DEV) return { ok: true, preview: true };
  }
  const failure = await response.json().catch(() => ({}));
  throw new Error(failure.error || 'We couldn’t add you to the waitlist just now. Please try again in a minute.');
}
