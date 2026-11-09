/**
 * RYDO waitlist → Google Sheets + confirmation email.
 *
 * Paste this into the sheet's Extensions → Apps Script, run setup() once, then deploy as a
 * Web app (Execute as: Me, Who has access: Anyone). The website posts each submission here.
 * Full steps: integrations/google-sheets/SETUP.md
 */

// ---- Settings -------------------------------------------------------------------------------
const SHEET_NAME = 'Submissions';
/** Team inbox: gets every submission in full (reply goes straight to the person). '' turns it off. */
const TEAM_EMAIL = 'getrydoapp@gmail.com';
/** Name shown as the sender of the confirmation email. */
const SENDER_NAME = 'RYDO';
/** Where "Back to RYDO" in the email points. */
const SITE_URL = 'https://getrydo.app';

const HEADERS = ['Submitted at', 'Reference', 'Full name', 'Email', 'Phone', 'City', 'Roles', 'Waitlist', 'Consent', 'Page', 'Email sent'];
const ROLES = ['Ride', 'Send', 'Drive', 'Dispatch'];

/** Run once from the editor: creates the Submissions tab with headers and formatting. */
function setup() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#03291D').setFontColor('#C1FF2A');
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, HEADERS.length, 150);
  sheet.setColumnWidth(3, 200);
  sheet.setColumnWidth(4, 240);
  // Ask for permission to send email now, so the first real submission doesn't fail.
  MailApp.getRemainingDailyQuota();
}

/** Opening the web-app URL in a browser shows that it is live. */
function doGet() {
  return json({ ok: true, message: 'RYDO waitlist endpoint is running.' });
}

/** The website posts one submission as JSON (sent as text/plain to avoid a CORS preflight). */
function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return json({ ok: false, message: 'The request was not valid.' });
  }

  // Bots fill every field, including the hidden "company" one; people never see it.
  if (data.company) return json({ ok: true, reference: 'WL-OK' });

  const entry = clean(data);
  const problem = validate(entry);
  if (problem) return json({ ok: false, message: problem });

  // One request per email per minute (stops double-clicks and simple floods).
  const cache = CacheService.getScriptCache();
  const key = 'wl:' + entry.email;
  if (cache.get(key)) return json({ ok: true, reference: cache.get(key), duplicate: true });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return json({ ok: false, message: 'The waitlist sheet is not set up yet.' });

    // Already on the list: return their reference, no second row or email.
    const existing = findByEmail(sheet, entry.email);
    if (existing) {
      cache.put(key, existing, 60);
      return json({ ok: true, reference: existing, duplicate: true });
    }

    const reference = 'WL-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const row = [new Date(), reference, entry.name, entry.email, "'" + entry.phone, entry.city, entry.roles.join(', '), entry.partner ? 'Partner' : 'Customer', 'Yes', entry.page, 'Sending…'];
    sheet.appendRow(row);
    const rowIndex = sheet.getLastRow();
    cache.put(key, reference, 60);

    let emailStatus = 'Sent';
    try {
      sendPassEmail(entry, reference);
      if (TEAM_EMAIL) notifyTeam(entry, reference);
    } catch (error) {
      emailStatus = 'Failed: ' + String(error).slice(0, 120);
    }
    sheet.getRange(rowIndex, HEADERS.indexOf('Email sent') + 1).setValue(emailStatus);
    return json({ ok: true, reference: reference });
  } finally {
    lock.releaseLock();
  }
}

function clean(data) {
  const text = (value, max) => String(value || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  const roles = Array.isArray(data.roles) ? data.roles.filter(role => ROLES.indexOf(role) !== -1) : [];
  return {
    name: text(data.name, 120),
    email: text(data.email, 200).toLowerCase(),
    phone: text(data.phone, 30),
    city: text(data.city, 80),
    roles: roles,
    partner: roles.indexOf('Drive') !== -1 || roles.indexOf('Dispatch') !== -1,
    consent: data.consent === true,
    page: text(data.page, 200),
  };
}

function validate(entry) {
  if (!entry.name) return 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) return 'Enter a valid email address.';
  if (entry.phone.replace(/\D/g, '').length < 7) return 'Enter a valid phone number.';
  if (!entry.city) return 'Tell us your city.';
  if (!entry.roles.length) return 'Choose at least one way you will use RYDO.';
  if (!entry.consent) return 'Agree to receive updates to join the waitlist.';
  return '';
}

function findByEmail(sheet, email) {
  const last = sheet.getLastRow();
  if (last < 2) return '';
  const emailCol = HEADERS.indexOf('Email') + 1;
  const refCol = HEADERS.indexOf('Reference') + 1;
  const emails = sheet.getRange(2, emailCol, last - 1, 1).getValues();
  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).toLowerCase() === email) return String(sheet.getRange(i + 2, refCol).getValue());
  }
  return '';
}

/** The submitter's confirmation: their waitlist pass, as in the site's final step. */
function sendPassEmail(entry, reference) {
  const first = entry.name.split(/\s+/)[0];
  const lead = entry.partner
    ? 'You’re on the RYDO partner waitlist. We’ll share onboarding steps and access-plan details when they’re ready.'
    : 'You’re on the RYDO waitlist. We’ll let you know when bookings become available in your area.';
  const pass = entry.partner ? '#DEFFCC' : '#D6DFFF';
  const chips = entry.roles.map(role => '<span style="display:inline-block;margin:0 6px 6px 0;padding:5px 12px;border-radius:99px;background:rgba(0,23,10,.08);font-weight:700;font-size:13px">' + esc(role) + '</span>').join('');
  const html =
    '<div style="background:#F8FAF0;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#00170A">' +
      '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1.5px solid #D9E0CE;border-radius:28px;padding:32px">' +
        '<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.6px;color:#4D6B3A">YOU’RE ON THE LIST</p>' +
        '<h1 style="margin:0 0 12px;font-size:28px;line-height:1.1">Your next move is getting closer, ' + esc(first) + '.</h1>' +
        '<p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#34463A">' + lead + '</p>' +
        '<div style="background:' + pass + ';border-radius:22px;padding:22px 24px">' +
          '<p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:1.5px">RYDO WAITLIST PASS · ' + esc(reference) + '</p>' +
          '<p style="margin:0;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#34463A">NAME</p>' +
          '<p style="margin:2px 0 14px;font-size:24px;font-weight:800">' + esc(entry.name) + '</p>' +
          '<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#34463A">SELECTED ROLES</p>' +
          '<div>' + chips + '</div>' +
          '<p style="margin:8px 0 2px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#34463A">CITY</p>' +
          '<p style="margin:0 0 14px;font-size:15px;font-weight:700">' + esc(entry.city) + '</p>' +
          '<p style="margin:0;padding-top:14px;border-top:2px solid rgba(0,23,10,.25);font-size:17px;font-weight:800">Move on your terms.</p>' +
        '</div>' +
        '<p style="margin:20px 0 24px;font-size:13px;line-height:1.5;color:#4D5A50">Your waitlist pass confirms your registration of interest. It does not guarantee early access or activate a driver or dispatch account.</p>' +
        '<a href="' + SITE_URL + '" style="display:inline-block;background:#00170A;color:#F8FAF0;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px">Back to RYDO</a>' +
      '</div>' +
      '<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#4D5A50;text-align:center">You’re receiving this because you joined the RYDO waitlist. Reply “unsubscribe” to stop updates.</p>' +
    '</div>';
  MailApp.sendEmail({
    to: entry.email,
    subject: 'You’re on the RYDO waitlist',
    name: SENDER_NAME,
    htmlBody: html,
    body: 'You’re on the RYDO waitlist, ' + first + '. Reference ' + reference + '. Roles: ' + entry.roles.join(', ') + '. City: ' + entry.city + '. ' + lead,
  });
}

/** Every submission, in full, to the team inbox. Replying answers the person who signed up. */
function notifyTeam(entry, reference) {
  const rows = [
    ['Reference', reference],
    ['Full name', entry.name],
    ['Email', entry.email],
    ['Phone', entry.phone],
    ['City', entry.city],
    ['Roles', entry.roles.join(', ')],
    ['Waitlist', entry.partner ? 'Partner' : 'Customer'],
    ['Consent to updates', 'Yes'],
    ['Joined from', entry.page],
    ['Submitted at', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')],
  ];
  const table = rows.map(([label, value]) =>
    '<tr><td style="padding:8px 12px;color:#4D5A50;font-size:13px;border-bottom:1px solid #E6EBDD">' + esc(label) + '</td>' +
    '<td style="padding:8px 12px;font-size:14px;font-weight:700;border-bottom:1px solid #E6EBDD">' + esc(value) + '</td></tr>').join('');
  MailApp.sendEmail({
    to: TEAM_EMAIL,
    replyTo: entry.email,
    subject: 'New waitlist sign-up: ' + entry.name + ' · ' + entry.roles.join(', ') + ' · ' + entry.city,
    name: SENDER_NAME + ' Waitlist',
    htmlBody: '<div style="font-family:Arial,Helvetica,sans-serif;color:#00170A">' +
      '<p style="margin:0 0 12px;font-size:16px;font-weight:700">New ' + (entry.partner ? 'partner' : 'customer') + ' on the RYDO waitlist</p>' +
      '<table style="border-collapse:collapse;min-width:320px">' + table + '</table>' +
      '<p style="margin:12px 0 0;font-size:12px;color:#4D5A50">Reply to this email to answer ' + esc(entry.name.split(/\s+/)[0]) + ' directly. All sign-ups are in the RYDO Waitlist sheet.</p></div>',
    body: rows.map(([label, value]) => label + ': ' + value).join('\n'),
  });
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
