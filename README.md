# RYDO — landing page & waitlist (v1.0)

React + Vite build of the new RYDO landing page (Customers / Partner switch) and the 4-step waitlist flow (name → roles → contact → pass). Designs: Figma "rydo-landing-page" (customers 27:140, partners 87:6626, waitlist 76:1641–76:1944).

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Routes
- `/` landing page (`/?as=partner` opens the partner view)
- `/waitlist` waitlist flow (`/waitlist?as=partner` preselects Drive)

## Waitlist submissions
Submissions go to a Google Sheet, and each person gets a confirmation email. Setup: `integrations/google-sheets/SETUP.md`. Set `VITE_WAITLIST_ENDPOINT` (see `.env.example`).

## Structure
- `src/data.js` landing copy and images for both audiences, plus FAQs
- `src/components/Sections.jsx` every landing section; `Phone.jsx` the iPhone frame
- `src/pages/Landing.jsx`, `src/pages/Waitlist.jsx`
- `src/lib/waitlist-api.js` sends a submission to the sheet
- `src/assets/` `figma/` (new design assets, WebP) and `screens/` (app screenshots); `index.js` is the single import point
- `src/styles/` global, landing and waitlist CSS

## Deploy (Netlify)
`netlify.toml` holds the settings: build `npm run build`, publish `dist`, every path served by the app (so `/waitlist` works), long caching for `/assets`.
1. Netlify → **Add new site → Import an existing project → GitHub** → pick `Rydo-Waitlist-1.0`.
2. Netlify reads the settings from `netlify.toml`; click **Deploy**.
3. **Domain management → Add a domain** → `getrydo.app`, then follow Netlify's DNS steps.

The waitlist sheet URL is in `.env.production`. To change it without a commit, set `VITE_WAITLIST_ENDPOINT` in Netlify → **Site configuration → Environment variables** and redeploy.
