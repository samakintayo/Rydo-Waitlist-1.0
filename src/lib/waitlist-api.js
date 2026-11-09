/**
 * Sends a waitlist submission to the Google Apps Script web app (integrations/google-sheets).
 * Set VITE_WAITLIST_ENDPOINT in .env.local (development) or your host's environment (production).
 */
const ENDPOINT = (import.meta.env.VITE_WAITLIST_ENDPOINT || '').trim();

export const waitlistConnected = !!ENDPOINT;

export async function submitWaitlist(entry) {
  if (!ENDPOINT) {
    // Local previews without a sheet still walk through every step.
    if (import.meta.env.DEV) return { ok: true, reference: 'WL-PREVIEW', preview: true };
    throw new Error('The waitlist isn’t connected yet. Please try again later.');
  }
  let response;
  try {
    // text/plain keeps this a "simple" request: Apps Script can't answer CORS preflights.
    response = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(entry) });
  } catch {
    throw new Error('We couldn’t reach the waitlist. Check your connection and try again.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) throw new Error(result?.message || 'Your details didn’t send. Please try again.');
  return result;
}
