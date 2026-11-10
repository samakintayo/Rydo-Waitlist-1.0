# Connect the waitlist to Google Sheets (with confirmation emails)

Every sign-up becomes a row in your sheet. The person gets an email with their RYDO waitlist pass, and getrydoapp@gmail.com gets the full details. No public web app is needed, so this works even when Apps Script doesn't offer "Anyone". Takes about 10 minutes, once.

How it works: the website sends each sign-up to a Google Form linked to your sheet. A script trigger, running as you, sends the emails.

## 1. Create the sheet
Sign in to the Google account that should own the waitlist (ideally getrydoapp@gmail.com).
1. Upload `RYDO Waitlist.xlsx` (in this folder) to Google Drive, open it, then **File → Save as Google Sheets**. Or start from a blank Google Sheet.

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**.
2. Delete everything in `Code.gs` and paste the whole of `integrations/google-sheets/Code.gs`. Click **Save**.

## 3. Run setupForm once
1. In the function menu next to **Run**, choose **setupForm**, then click **Run**.
2. Google asks for permission: **Review permissions** → your account → **Advanced → Go to … (unsafe) → Allow**. ("Unsafe" only means Google hasn't reviewed your own script.)
3. When it finishes, the sheet has:
   - **Submissions**: where sign-ups arrive (linked to the new form);
   - **Summary**: live counts;
   - **Website setup**: the value for the website, in cell **B2**.

You don't need **Deploy** at all.

## 4. Check the form is open to everyone
Open the form link from **Website setup → B4** in a private window (Cmd + Shift + N) that isn't signed in to Google. It should open the form without asking you to sign in. If it asks to sign in, the account blocks public forms: in the form, open **Settings → Responses** and turn off **Restrict to users in …**, or use a regular Gmail account.

## 5. Connect the website (Netlify)
1. Copy cell **B2** from the **Website setup** tab (it starts with `{"action":`).
2. In Netlify: **Site configuration → Environment variables → Add a variable**. Key `VITE_WAITLIST_FORM`, value: paste B2 exactly.
3. Remove the old `VITE_WAITLIST_ENDPOINT` variable if it's there.
4. **Deploys → Trigger deploy → Clear cache and deploy site**.

On your computer, put the same line in `.env.local`: `VITE_WAITLIST_FORM={…}`.

## 6. Test
Join the waitlist on getrydo.app with your own email. Within a minute:
- a new row appears in **Submissions** (the **Email sent** column says `Sent`);
- you get "You’re on the RYDO waitlist" with your pass;
- getrydoapp@gmail.com gets the sign-up details.

## Good to know
- **Changing the script later:** edit and **Save**; no redeploy needed. Run **setupForm** again only if you change the questions.
- **Email limits:** about **100 emails a day** from a personal Gmail account (each sign-up sends two), **1,500** with Google Workspace. Rows are still saved when the limit is reached; **Email sent** shows the error.
- **Duplicates:** the same email gets a row marked `Duplicate: no email sent`, so nobody is emailed twice.
- **Don't edit the form's questions** (titles or order). The website and script rely on them.
- **Data:** the sheet holds personal details (name, email, phone). Share it only with people who need it.
