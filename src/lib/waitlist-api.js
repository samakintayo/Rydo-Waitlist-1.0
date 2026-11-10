/**
 * Sends a waitlist sign-up to the RYDO Google Form (integrations/google-sheets). The form saves it
 * to the sheet, and a script trigger emails the person and the team.
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

export async function submitWaitlist(entry) {
  if (!CONFIG) {
    // Local previews without the form still walk through every step.
    if (import.meta.env.DEV) return { ok: true, preview: true };
    throw new Error('The waitlist isn’t connected yet. Please try again later.');
  }
  const body = new URLSearchParams();
  for (const [key, field] of Object.entries(CONFIG.fields)) body.append(field, String(entry[key] ?? ''));
  try {
    // Google Forms doesn't send CORS headers, so the reply can't be read ("no-cors"). A network
    // failure still throws; otherwise the form has accepted the answers.
    await fetch(CONFIG.action, { method: 'POST', mode: 'no-cors', body });
  } catch {
    throw new Error('We couldn’t reach the waitlist. Check your connection and try again.');
  }
  return { ok: true };
}
