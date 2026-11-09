# Connect the waitlist to Google Sheets (with a confirmation email)

Every submission becomes a row in your sheet, and the person gets an email with their RYDO waitlist pass. About 10 minutes, once.

## 1. Create the sheet
1. Go to sheets.google.com and click **Blank spreadsheet**. Name it **RYDO Waitlist**.
2. Or upload `RYDO Waitlist.xlsx` (in this folder) to Google Drive and open it with Google Sheets (**File → Save as Google Sheets**). It has the Submissions, Summary and How to use tabs ready.

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**.
2. Delete everything in `Code.gs` and paste the whole of `integrations/google-sheets/Code.gs`.
3. At the top of the script you can change:
   - `TEAM_EMAIL`: gets every submission in full (set to getrydoapp@gmail.com). Replying answers the person who signed up.
   - `SENDER_NAME`: the sender name people see (default `RYDO`).
   - `SITE_URL`: where the email's "Back to RYDO" button goes.
4. Click **Save** (disk icon).

## 3. Run setup once
1. In the function menu next to **Run**, pick **setup**, then click **Run**.
2. Google asks for permission. Click **Review permissions**, pick your account, then **Advanced → Go to (project name) (unsafe) → Allow**. The script only touches this sheet and sends email as you.
3. Back in the sheet, the **Submissions** tab now has dark-green headers.

## 4. Publish it as a web app
1. In Apps Script: **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. ("Anyone" lets the website send submissions; nobody can read your sheet through it.)
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Optional check: open that URL in your browser. It should say `RYDO waitlist endpoint is running.`

## 5. Point the website at it
- **On your computer:** create `.env.local` in the project folder with
  `VITE_WAITLIST_ENDPOINT=https://script.google.com/macros/s/…/exec`
  then restart `npm run dev`.
- **On your host (Vercel, Netlify and similar):** add the same `VITE_WAITLIST_ENDPOINT` variable in the project settings and redeploy.

## 6. Test
Join the waitlist on the site with your own email. Within a few seconds:
- a new row appears in **Submissions** (the **Email sent** column says `Sent`);
- you receive "You’re on the RYDO waitlist" with your pass.

## Good to know
- **Changing the script later:** use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL. A *new* deployment gets a new URL, which you'd have to update on the site.
- **Email limits:** Google sends about **100 emails a day** from a personal Gmail account, or **1,500** with Google Workspace. Rows are still saved when the limit is reached; the **Email sent** column then shows the error.
- **Duplicates:** the same email address isn't added twice and doesn't get a second email.
- **Spam:** a hidden form field catches most bots, and repeat submissions within a minute are ignored.
- **Data:** the sheet holds personal details (name, email, phone). Share it only with people who need it.
