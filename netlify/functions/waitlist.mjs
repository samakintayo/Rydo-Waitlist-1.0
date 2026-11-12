/**
 * Waitlist sign-up → Brevo. Runs on Netlify, so the Brevo key never reaches the browser.
 * - Adds or updates the contact in the "RYDO WAITLIST" list (BREVO_LIST_ID, default 8).
 * - New sign-ups get their waitlist pass by email; the team gets the details (replies go to the person).
 *
 * Netlify environment variables: BREVO_API_KEY (required), BREVO_LIST_ID, EMAIL_FROM, TEAM_EMAIL.
 */
const API = 'https://api.brevo.com/v3';
const SITE = 'https://getrydo.app';
const LOGO = `${SITE}/email/rydo-icon.png`;

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const clean = (value, max = 200) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function brevo(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json', ...init.headers },
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, body: text ? JSON.parse(text) : {} };
}

function layout(title, inner) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F6F8F0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F8F0;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:24px;padding:32px 28px;font-family:Arial,Helvetica,sans-serif;color:#00170A">
<tr><td><img src="${LOGO}" width="48" height="48" alt="RYDO" style="display:block;border:0;border-radius:12px"></td></tr>
<tr><td style="padding-top:24px;font-size:24px;font-weight:800;line-height:1.2">${escape(title)}</td></tr>
${inner}
<tr><td style="padding-top:28px;border-top:1px solid #DCE2D1;font-size:12px;line-height:1.5;color:#5C6B61">RYDO · Move on your terms. · <a href="${SITE}" style="color:#12301F">getrydo.app</a></td></tr>
</table></td></tr></table></body></html>`;
}

function passEmail(entry) {
  const partner = entry.waitlist === 'Partner';
  const intro = partner
    ? 'You’re on the RYDO partner waitlist. We’ll share onboarding steps and access-plan details when they’re ready.'
    : 'You’re on the RYDO waitlist. We’ll let you know when bookings become available in your area.';
  const row = (label, value) => `<tr><td style="padding:6px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#435349">${label}</td></tr><tr><td style="padding-bottom:10px;font-size:17px;font-weight:700">${escape(value)}</td></tr>`;
  const inner = `<tr><td style="padding-top:12px;font-size:15px;line-height:1.55;color:#435349">Hi ${escape(entry.firstName)}, ${intro}</td></tr>
<tr><td style="padding-top:20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${partner ? '#DEFFCC' : '#D6DFFF'};border-radius:20px;padding:20px 22px">
${row('RYDO waitlist pass', entry.reference)}${row('Name', entry.name)}${row('Selected roles', entry.roles)}${row('City', entry.city)}
<tr><td style="padding-top:8px;font-size:17px;font-weight:800">Move on your terms.</td></tr></table></td></tr>
<tr><td style="padding-top:16px;font-size:12.5px;line-height:1.5;color:#5C6B61">Your waitlist pass confirms your registration of interest. It doesn’t guarantee early access or activate a driver or dispatch account.</td></tr>`;
  const text = `Hi ${entry.firstName}, ${intro}\n\nRYDO waitlist pass: ${entry.reference}\nName: ${entry.name}\nRoles: ${entry.roles}\nCity: ${entry.city}\n\nMove on your terms.\n${SITE}`;
  return { subject: 'You’re on the RYDO waitlist', html: layout('You’re on the RYDO waitlist', inner), text };
}

function teamEmail(entry) {
  const lines = [['Reference', entry.reference], ['Name', entry.name], ['Email', entry.email], ['Phone', entry.phone], ['City', entry.city], ['Roles', entry.roles], ['Waitlist', entry.waitlist], ['Page', entry.page]];
  const inner = `<tr><td style="padding-top:12px"><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6">${lines.map(([k, v]) => `<tr><td style="padding-right:16px;color:#5C6B61">${k}</td><td style="font-weight:700">${escape(v || '—')}</td></tr>`).join('')}</table></td></tr>`;
  return { subject: `New ${entry.waitlist.toLowerCase()} sign-up: ${entry.name} (${entry.city})`, html: layout('New waitlist sign-up', inner), text: lines.map(([k, v]) => `${k}: ${v || '—'}`).join('\n') };
}

export default async request => {
  if (request.method !== 'POST') return json(405, { error: 'Use POST.' });
  if (!process.env.BREVO_API_KEY) return json(503, { error: 'The waitlist isn’t connected yet. Please try again later.' });

  let input;
  try {
    input = await request.json();
  } catch {
    return json(400, { error: 'Something went wrong with the form. Refresh the page and try again.' });
  }
  // Bots fill the hidden field; tell them it worked and do nothing.
  if (clean(input.company)) return json(200, { ok: true });

  const entry = {
    reference: clean(input.reference, 20) || 'WL-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
    name: clean(input.name, 100),
    email: clean(input.email, 254).toLowerCase(),
    phone: clean(input.phone, 30),
    city: clean(input.city, 80),
    roles: clean(input.roles, 100),
    waitlist: clean(input.waitlist, 20) === 'Partner' ? 'Partner' : 'Customer',
    page: clean(input.page, 300),
  };
  if (!entry.name) return json(400, { error: 'Enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) return json(400, { error: 'Enter a valid email address.' });
  if (entry.phone.replace(/\D/g, '').length < 7) return json(400, { error: 'Enter a valid phone number.' });
  if (!entry.city) return json(400, { error: 'Tell us your city.' });
  if (input.consent !== 'Yes') return json(400, { error: 'Agree to receive updates to join the waitlist.' });
  const [firstName, ...rest] = entry.name.split(/\s+/);
  entry.firstName = firstName;
  const listId = Number(process.env.BREVO_LIST_ID || 8);

  try {
    // Already on the list? Update the details but don't email them twice.
    const existing = await brevo(`/contacts/${encodeURIComponent(entry.email)}`);
    const alreadyListed = existing.ok && Array.isArray(existing.body.listIds) && existing.body.listIds.includes(listId);
    if (alreadyListed) entry.reference = existing.body.attributes?.REFERENCE || entry.reference;

    const saved = await brevo('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        email: entry.email,
        listIds: [listId],
        updateEnabled: true,
        attributes: { FIRSTNAME: firstName, LASTNAME: rest.join(' '), PHONE: entry.phone, CITY: entry.city, ROLES: entry.roles, WAITLIST: entry.waitlist, REFERENCE: entry.reference, SIGNUP_PAGE: entry.page, OPT_IN: true },
      }),
    });
    if (!saved.ok) {
      console.error('Brevo contact failed', saved.status, JSON.stringify(saved.body).slice(0, 300));
      return json(502, { error: 'We couldn’t add you to the waitlist just now. Please try again in a minute.' });
    }
    if (alreadyListed) return json(200, { ok: true, reference: entry.reference, existing: true });

    const sender = { name: 'RYDO', email: process.env.EMAIL_FROM || 'noreply@getrydo.app' };
    const pass = passEmail(entry);
    const team = teamEmail(entry);
    const sends = await Promise.all([
      brevo('/smtp/email', { method: 'POST', body: JSON.stringify({ sender, to: [{ email: entry.email, name: entry.name }], subject: pass.subject, htmlContent: pass.html, textContent: pass.text, tags: ['waitlist-pass'] }) }),
      brevo('/smtp/email', { method: 'POST', body: JSON.stringify({ sender, to: [{ email: process.env.TEAM_EMAIL || 'getrydoapp@gmail.com' }], replyTo: { email: entry.email, name: entry.name }, subject: team.subject, htmlContent: team.html, textContent: team.text, tags: ['waitlist-team'] }) }),
    ]);
    // The sign-up is saved even if an email fails; log it for follow-up.
    sends.forEach((send, index) => { if (!send.ok) console.error(index ? 'Team email failed' : 'Pass email failed', send.status, JSON.stringify(send.body).slice(0, 300)); });
    return json(200, { ok: true, reference: entry.reference });
  } catch (error) {
    console.error('Waitlist error', error?.message);
    return json(502, { error: 'We couldn’t add you to the waitlist just now. Please try again in a minute.' });
  }
};
