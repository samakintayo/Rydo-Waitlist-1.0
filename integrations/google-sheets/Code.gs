/**
 * RYDO waitlist → Google Form → Google Sheet, with confirmation emails.
 *
 * Needs no public web app: the website submits to a Google Form linked to this sheet, and a
 * form-submit trigger (running as you) sends the emails.
 *
 * Setup: paste into Extensions → Apps Script, run setupForm() once, copy the website setting it
 * writes to the "Website setup" tab into Netlify. Full steps: integrations/google-sheets/SETUP.md
 */

// ---- Settings -------------------------------------------------------------------------------
/** Team inbox: gets every submission in full (reply goes straight to the person). '' turns it off. */
const TEAM_EMAIL = 'getrydoapp@gmail.com';
/** Name shown as the sender of the emails. */
const SENDER_NAME = 'RYDO';
/** Where "Back to RYDO" in the email points. */
const SITE_URL = 'https://getrydo.app';

const SHEET_NAME = 'Submissions';
/** Form questions, in order. With the form's Timestamp first, they fill columns A–J; the script writes K. */
const QUESTIONS = ['Reference', 'Full name', 'Email', 'Phone', 'City', 'Roles', 'Waitlist', 'Consent', 'Page'];
/** The keys the website sends for each question (see src/lib/waitlist-api.js). */
const KEYS = ['reference', 'name', 'email', 'phone', 'city', 'roles', 'waitlist', 'consent', 'page'];
const STATUS_HEADER = 'Email sent';

/**
 * Run once from the editor. Creates the form, links it to this sheet as "Submissions", adds the
 * email trigger and the Summary tab, and writes the website setting to the "Website setup" tab.
 * Safe to run again: it reuses the same form.
 */
function setupForm() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();

  let form = null;
  const savedId = props.getProperty('FORM_ID');
  if (savedId) { try { form = FormApp.openById(savedId); } catch (error) { form = null; } }
  if (!form) {
    form = FormApp.create('RYDO Waitlist (website)');
    form.setDescription('Filled in by the getrydo.app waitlist. Answers go to the RYDO Waitlist sheet.');
    QUESTIONS.forEach(title => form.addTextItem().setTitle(title));
    form.setDestination(FormApp.DestinationType.SPREADSHEET, book.getId());
    props.setProperty('FORM_ID', form.getId());
  }
  form.setCollectEmail(false);
  form.setAcceptingResponses(true);
  // Anyone can submit without signing in. (A company Google account may block this.)
  try { form.setRequireLogin(false); } catch (error) { console.warn('Could not turn off sign-in: ' + error); }

  SpreadsheetApp.flush();
  const linked = linkedSheet(book, form);
  if (!linked) throw new Error('The form isn’t linked to this sheet yet. Wait a few seconds and run setupForm again.');

  // The form's tab becomes "Submissions". An older, empty Submissions tab is removed.
  const old = book.getSheetByName(SHEET_NAME);
  if (old && old.getSheetId() !== linked.getSheetId()) {
    if (old.getLastRow() <= 1) book.deleteSheet(old);
    else old.setName(SHEET_NAME + ' (old) ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));
  }
  linked.setName(SHEET_NAME);
  const width = QUESTIONS.length + 2;
  linked.getRange(1, width).setValue(STATUS_HEADER);
  linked.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#03291D').setFontColor('#C1FF2A');
  linked.setFrozenRows(1);
  linked.setColumnWidths(1, width, 150);
  linked.setColumnWidth(3, 200);
  linked.setColumnWidth(4, 240);
  linked.getRange('E2:E').setNumberFormat('@');

  // The email trigger runs as you whenever the form adds a row.
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'onWaitlistSubmit').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onWaitlistSubmit').forSpreadsheet(book).onFormSubmit().create();

  buildSummary(book);

  // What the website needs: the form's submit address and the field id for each question.
  const fields = {};
  form.getItems().forEach(item => {
    const index = QUESTIONS.indexOf(item.getTitle());
    if (index !== -1) fields[KEYS[index]] = 'entry.' + item.getId();
  });
  const setting = JSON.stringify({ action: form.getPublishedUrl().replace(/\/viewform.*$/, '/formResponse'), fields: fields });
  const info = book.getSheetByName('Website setup') || book.insertSheet('Website setup');
  info.clear();
  info.getRange('A1:B1').setValues([['Netlify environment variable', 'Value (copy the whole cell)']]).setFontWeight('bold');
  info.getRange('A2:B2').setValues([['VITE_WAITLIST_FORM', setting]]);
  info.getRange('A4').setValue('Form (check it opens without signing in, in a private window):');
  info.getRange('B4').setValue(form.getPublishedUrl());
  info.setColumnWidth(1, 260);
  info.setColumnWidth(2, 900);
  info.getRange('B2').setWrap(true);

  // Ask for permission to send email now, so the first sign-up doesn't fail.
  MailApp.getRemainingDailyQuota();
  console.log('VITE_WAITLIST_FORM=' + setting);
}

/** The tab this form writes to. */
function linkedSheet(book, form) {
  const id = form.getId();
  const matches = book.getSheets().filter(sheet => {
    const url = sheet.getFormUrl();
    return url && url.indexOf(id) !== -1;
  });
  if (matches.length) return matches[0];
  // Fallback: the newest "Form Responses" tab.
  const responses = book.getSheets().filter(sheet => /^Form Responses/.test(sheet.getName()));
  return responses.length ? responses[responses.length - 1] : null;
}

/** Runs for every new form row: checks it, then emails the person and the team. */
function onWaitlistSubmit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;
  const row = e.range.getRow();
  const statusCell = sheet.getRange(row, QUESTIONS.length + 2);
  const named = e.namedValues || {};
  const read = title => String((named[title] && named[title][0]) || '').trim();

  const entry = {
    reference: read('Reference') || 'WL-' + Utilities.getUuid().slice(0, 8).toUpperCase(),
    name: read('Full name').slice(0, 120),
    email: read('Email').toLowerCase().slice(0, 200),
    phone: read('Phone').slice(0, 30),
    city: read('City').slice(0, 80),
    roles: read('Roles').split(',').map(role => role.trim()).filter(role => ['Ride', 'Send', 'Drive', 'Dispatch'].indexOf(role) !== -1),
    page: read('Page').slice(0, 200),
  };
  entry.partner = entry.roles.indexOf('Drive') !== -1 || entry.roles.indexOf('Dispatch') !== -1;

  // Keep the phone exactly as typed (a leading 0 would otherwise be dropped).
  sheet.getRange(row, QUESTIONS.indexOf('Phone') + 2).setNumberFormat('@').setValue(entry.phone);

  if (!entry.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email) || !entry.roles.length) {
    statusCell.setValue('Skipped: incomplete');
    return;
  }
  // The same email again: keep the row, but don't email twice.
  const emailCol = QUESTIONS.indexOf('Email') + 2;
  if (row > 2) {
    const earlier = sheet.getRange(2, emailCol, row - 2, 1).getValues();
    if (earlier.some(value => String(value[0]).trim().toLowerCase() === entry.email)) {
      statusCell.setValue('Duplicate: no email sent');
      return;
    }
  }

  try {
    sendPassEmail(entry, entry.reference);
    if (TEAM_EMAIL) notifyTeam(entry, entry.reference);
    statusCell.setValue('Sent');
  } catch (error) {
    statusCell.setValue('Failed: ' + String(error).slice(0, 120));
  }
}

/** Live counts on the Summary tab (rebuilt by setupForm). */
function buildSummary(book) {
  const summary = book.getSheetByName('Summary') || book.insertSheet('Summary');
  summary.clear();
  const S = SHEET_NAME + '!';
  const rows = [
    ['RYDO waitlist summary', ''],
    ['Updates by itself as sign-ups arrive.', ''],
    ['', ''],
    ['Totals', ''],
    ['All sign-ups', '=COUNTA(' + S + 'C2:C)'],
    ['Customers', '=COUNTIF(' + S + 'H2:H,"Customer")'],
    ['Partners', '=COUNTIF(' + S + 'H2:H,"Partner")'],
    ['Joined in the last 7 days', '=COUNTIF(' + S + 'A2:A,">="&(TODAY()-7))'],
    ['Joined today', '=COUNTIF(' + S + 'A2:A,">="&TODAY())'],
    ['', ''],
    ['Roles chosen (a person can choose several)', ''],
    ['Ride', '=COUNTIF(' + S + 'G2:G,"*Ride*")'],
    ['Send', '=COUNTIF(' + S + 'G2:G,"*Send*")'],
    ['Drive', '=COUNTIF(' + S + 'G2:G,"*Drive*")'],
    ['Dispatch', '=COUNTIF(' + S + 'G2:G,"*Dispatch*")'],
    ['', ''],
    ['Confirmation emails', ''],
    ['Sent', '=COUNTIF(' + S + 'K2:K,"Sent")'],
    ['Failed', '=COUNTIF(' + S + 'K2:K,"Failed*")'],
    ['Duplicates (no email)', '=COUNTIF(' + S + 'K2:K,"Duplicate*")'],
    ['', ''],
    ['Sign-ups by city (type a city in column A)', ''],
  ];
  ['Abuja', 'Lagos', 'Port Harcourt', 'Ibadan', 'Kano'].forEach(city => rows.push([city, '=COUNTIF(' + S + 'F2:F,A' + (rows.length + 1) + ')']));
  summary.getRange(1, 1, rows.length, 2).setValues(rows);
  summary.getRange('A1').setFontSize(16).setFontWeight('bold');
  [4, 11, 17, 22].forEach(r => summary.getRange(r, 1).setFontWeight('bold').setFontColor('#03291D'));
  summary.setColumnWidth(1, 320);
  summary.setColumnWidth(2, 120);
}

/** The person's confirmation: their waitlist pass, as on the site's final step. */
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
