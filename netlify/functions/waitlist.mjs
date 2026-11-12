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

function layout(title, intro, inner = '', preview = intro) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escape(title)}</title>
<style>
@media (prefers-color-scheme: dark) {
  .bg { background:#0A0C0B !important; } .card { background:#141716 !important; }
  .ink { color:#F1F3F0 !important; } .muted { color:#8C948E !important; } .rule { border-color:#222724 !important; }
}
@media (max-width:520px) { .card { padding:28px 22px !important; } .title { font-size:24px !important; } }
</style></head>
<body class="bg" style="margin:0;padding:0;background:#F3F4F1;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden">${escape(preview).slice(0, 120)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:#F3F4F1"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 4px 18px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle"><img src="${LOGO}" width="36" height="36" alt="" style="display:block;border:0;border-radius:10px"></td>
<td class="ink" style="vertical-align:middle;padding-left:10px;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.3px;color:#0B120D">RYDO</td>
</tr></table></td></tr>
<tr><td class="card" style="background:#FFFFFF;border-radius:24px;padding:36px 32px;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td class="ink title" style="font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.5px;color:#0B120D">${escape(title)}</td></tr>
<tr><td class="muted" style="padding-top:12px;font-size:15px;line-height:1.6;color:#4E5751">${escape(intro)}</td></tr>
${inner}
</table></td></tr>
<tr><td class="muted" style="padding:20px 4px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6A726C">RYDO · Move on your terms · <a href="${SITE}" style="color:#6A726C">getrydo.app</a></td></tr>
</table></td></tr></table></body></html>`;
}

function passEmail(entry) {
  const partner = entry.waitlist === 'Partner';
  const intro = partner
    ? `Hi ${entry.firstName}, you’re on the RYDO partner waitlist. We’ll share onboarding steps and access-plan details when they’re ready.`
    : `Hi ${entry.firstName}, you’re on the RYDO waitlist. We’ll let you know when bookings open in your area.`;
  const cell = (label, value) => `<td style="vertical-align:top;padding-top:16px"><div style="font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#8C948E">${label}</div><div style="padding-top:4px;font-size:15px;font-weight:700;color:#F1F3F0">${escape(value)}</div></td>`;
  // The pass: a dark ticket with the reference in lime, the same look in light and dark mail apps.
  const inner = `<tr><td style="padding-top:24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B120D;border-radius:20px"><tr><td style="padding:22px 24px">
<div style="font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#8C948E">${partner ? 'Partner waitlist pass' : 'Waitlist pass'}</div>
<div style="padding-top:6px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:24px;font-weight:700;letter-spacing:2px;color:#C1FF2A">${escape(entry.reference)}</div>
<div style="padding-top:14px;font-size:20px;font-weight:800;letter-spacing:-0.3px;color:#F1F3F0">${escape(entry.name)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cell('Roles', entry.roles)}${cell('City', entry.city)}</tr></table>
</td></tr></table></td></tr>
<tr><td style="padding-top:24px"><a href="${SITE}" style="display:inline-block;background:#C1FF2A;color:#00170A;font-size:15px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px">Visit getrydo.app</a></td></tr>
<tr><td class="muted rule" style="padding-top:24px;font-size:12.5px;line-height:1.55;color:#6A726C">Your waitlist pass confirms your registration of interest. It doesn’t guarantee early access or activate a driver or dispatch account.</td></tr>`;
  const text = `${intro}\n\nWaitlist pass: ${entry.reference}\nName: ${entry.name}\nRoles: ${entry.roles}\nCity: ${entry.city}\n\nMove on your terms.\n${SITE}`;
  return { subject: 'You’re on the RYDO waitlist', html: layout('You’re on the list', intro, inner), text };
}

function teamEmail(entry) {
  const lines = [['Reference', entry.reference], ['Name', entry.name], ['Email', entry.email], ['Phone', entry.phone], ['City', entry.city], ['Roles', entry.roles], ['Waitlist', entry.waitlist], ['Page', entry.page]];
  const inner = `<tr><td style="padding-top:20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5">${lines.map(([k, v]) => `<tr><td class="muted rule" style="padding:10px 0;border-top:1px solid #ECEEEA;color:#6A726C;width:96px">${k}</td><td class="ink rule" style="padding:10px 0;border-top:1px solid #ECEEEA;font-weight:700;color:#0B120D;word-break:break-word">${escape(v || '—')}</td></tr>`).join('')}</table></td></tr>
<tr><td class="muted" style="padding-top:16px;font-size:13px;color:#6A726C">Reply to this email to write to ${escape(entry.firstName)} directly.</td></tr>`;
  return { subject: `New ${entry.waitlist.toLowerCase()} sign-up: ${entry.name} (${entry.city})`, html: layout('New waitlist sign-up', `${entry.name} joined the ${entry.waitlist.toLowerCase()} waitlist from ${entry.city}.`, inner), text: lines.map(([k, v]) => `${k}: ${v || '—'}`).join('\n') };
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
