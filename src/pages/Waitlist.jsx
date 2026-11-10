import { useState } from 'react';
import { Link } from '../lib/router.jsx';
import { F } from '../assets/index.js';
import Img from '../components/Img.jsx';
import { newReference, submitWaitlist } from '../lib/waitlist-api.js';
import '../styles/waitlist.css';

/** Waitlist flow (Figma 76:1641, 76:1714, 76:1845, 76:1944): name → roles → contact → pass. */

const ROLES = [
  { id: 'ride', title: 'Ride', sub: 'Book journeys for yourself.', icon: F.roleCar },
  { id: 'send', title: 'Send', sub: 'Arrange package deliveries.', icon: F.roleScooter },
  { id: 'drive', title: 'Drive', sub: 'Earn from passenger trips.', icon: F.roleCar },
  { id: 'dispatch', title: 'Dispatch', sub: 'Earn from package deliveries.', icon: F.roleScooter },
];

function initialRoles() {
  return new URLSearchParams(window.location.search).get('as') === 'partner' ? { drive: true } : { ride: true };
}

/** Dark pill with the lime arrow dot. */
function Primary({ children, type = 'submit', to, busy = false }) {
  const inner = <><span className="wl-btn-t">{children}</span><span className={`wl-dot${busy ? ' busy' : ''}`} aria-hidden="true">{busy ? '' : '→'}</span></>;
  return to ? <Link className="wl-btn" to={to}>{inner}</Link> : <button type={type} className="wl-btn" disabled={busy} aria-busy={busy}>{inner}</button>;
}

function Field({ id, label, error, ...input }) {
  return (
    <div className="wl-fld">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...input} />
      {error && <span className="wl-err" id={`${id}-err`} role="alert">{error}</span>}
    </div>
  );
}

export default function Waitlist() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: '', email: '', phone: '', city: '' });
  const [sel, setSel] = useState(initialRoles);
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  // Hidden from people; bots fill it, and the sheet script ignores those submissions.
  const [company, setCompany] = useState('');
  const set = key => event => { setF({ ...f, [key]: event.target.value }); if (err[key]) setErr({ ...err, [key]: '' }); };

  const tags = ROLES.filter(r => sel[r.id]).map(r => r.title);
  const partner = !!(sel.drive || sel.dispatch);
  const go = n => { setErr({}); setStep(n); window.scrollTo({ top: 0 }); };

  const next = () => {
    if (step === 0) return f.name.trim() ? go(1) : setErr({ name: 'Enter your name to continue.' });
    if (step === 1) return tags.length ? go(2) : setErr({ roles: 'Choose at least one option to continue.' });
    if (step === 2) {
      const e = {
        email: /^\S+@\S+\.\S+$/.test(f.email.trim()) ? '' : 'Enter a valid email address.',
        phone: f.phone.replace(/\D/g, '').length >= 7 ? '' : 'Enter a valid phone number.',
        city: f.city.trim() ? '' : 'Tell us your city.',
        consent: consent ? '' : 'Agree to receive updates to join the waitlist.',
      };
      if (Object.values(e).some(Boolean)) return setErr(e);
      if (busy) return;
      setBusy(true);
      // Bots fill the hidden field; skip them quietly.
      if (company) return go(3);
      const ref = reference || newReference();
      setReference(ref);
      submitWaitlist({ reference: ref, name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), city: f.city.trim(), roles: tags.join(', '), waitlist: partner ? 'Partner' : 'Customer', consent: 'Yes', page: window.location.href })
        .then(() => go(3), failure => setErr({ submit: failure.message }))
        .finally(() => setBusy(false));
    }
  };
  const restart = () => { setF({ name: '', email: '', phone: '', city: '' }); setSel(initialRoles()); setConsent(false); setReference(''); go(0); };
  const submit = event => { event.preventDefault(); next(); };
  const back = () => go(step - 1);

  return (
    <div className="wl">
      <aside className="wl-side">
        <img className="wl-au a1" src={F.aurora1} alt="" aria-hidden="true" />
        <img className="wl-au a2" src={F.aurora2} alt="" aria-hidden="true" />
        <div className="wl-top">
          <Link to="/" aria-label="RYDO home"><img src={F.logoLight} alt="RYDO" className="wl-logo" /></Link>
          <Link to={partner ? '/?as=partner' : '/'} className="wl-backsite" aria-label="Back to site" title="Back to site">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          </Link>
        </div>
        <Img className="wl-hero" img={F.waitlistHero} alt="A RYDO driver beside a RYDO car, with the app open" sizes="(max-width: 980px) 0px, 46vw" priority />
        <div className="wl-intro">
          <p className="wl-eye lime">RYDO waitlist</p>
          <h2>Your next move starts here.</h2>
          <p className="wl-lead">Join the waitlist for rides, deliveries and scheduled journeys, or to drive and deliver with RYDO. It takes about a minute.</p>
        </div>
      </aside>

      <main className="wl-main">
        <form className="wl-card" onSubmit={submit} noValidate>
          <div className="wl-body">
            <div className="wl-bars" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of 4`}>
              {[0, 1, 2, 3].map(i => <i key={i} className={i <= step ? 'on' : ''} />)}
            </div>

            {step > 0 && step < 3 && <button type="button" className="wl-back" onClick={back}>←&nbsp;&nbsp;Back</button>}

            {step === 0 && <>
              <Head eye="Step 1 of 4" title="Let’s start with your name." sub="Tell us what to call you." />
              <Field id="name" label="Full name" type="text" autoComplete="name" placeholder="Enter your full name" value={f.name} onChange={set('name')} error={err.name} autoFocus />
            </>}

            {step === 1 && <>
              <Head eye="Step 2 of 4" title="How will you use RYDO?" sub="Choose all that apply." />
              <div className="wl-roles" role="group" aria-label="How you will use RYDO">
                {ROLES.map(r => {
                  const on = !!sel[r.id];
                  return (
                    <button type="button" key={r.id} className={`wl-role${on ? ' on' : ''}`} aria-pressed={on} onClick={() => { setSel({ ...sel, [r.id]: !on }); setErr({}); }}>
                      <span className="wl-ico"><img src={r.icon} alt="" /></span>
                      <span className="wl-rt"><b>{r.title}</b><span>{r.sub}</span></span>
                      <span className="wl-tick" aria-hidden="true">{on ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
              {err.roles && <span className="wl-err" role="alert">{err.roles}</span>}
            </>}

            {step === 2 && <>
              <Head eye="Step 3 of 4" title="Where can we reach you?" sub="Get launch and onboarding updates for your area." />
              <div className="wl-row">
                <Field id="email" label="Email address" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={set('email')} error={err.email} />
                <Field id="phone" label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="Enter your phone number" value={f.phone} onChange={set('phone')} error={err.phone} />
              </div>
              <Field id="city" label="City" type="text" autoComplete="address-level2" placeholder="Enter your city" value={f.city} onChange={set('city')} error={err.city} />
            </>}

            {step === 3 && <>
              <Head eye="You’re on the list" title="Your next move is getting closer." sub={partner
                ? 'You’re on the RYDO partner waitlist. We’ll share onboarding steps and access-plan details when they’re ready.'
                : 'You’re on the RYDO waitlist. We’ll let you know when bookings become available in your area.'} />
              <div className={`wl-pass${partner ? ' partner' : ''}`}>
                <div className="wl-pass-top"><span className="wl-lbl">RYDO waitlist pass{reference ? ` · ${reference}` : ''}</span><span className="wl-r" aria-hidden="true">R</span></div>
                <div><span className="wl-lbl">Name</span><p className="wl-pname">{f.name.trim()}</p></div>
                <div className="wl-meta">
                  <div><span className="wl-lbl">Selected roles</span><div className="wl-chips">{tags.map(t => <span key={t}>{t}</span>)}</div></div>
                  <div><span className="wl-lbl">City</span><p className="wl-city">{f.city.trim()}</p></div>
                </div>
                <hr />
                <p className="wl-motto">Move on your terms.</p>
              </div>
              <p className="wl-fine">Your waitlist pass confirms your registration of interest. It does not guarantee early access or activate a driver or dispatch account.</p>
            </>}
          </div>

          <div className="wl-foot">
            {step === 2 && (
              <label className="wl-consent">
                <input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); setErr({ ...err, consent: '' }); }} />
                <span className="wl-box" aria-hidden="true">✓</span>
                <span>I agree to receive RYDO waitlist, launch and onboarding updates. I can unsubscribe at any time.</span>
              </label>
            )}
            {step === 2 && err.consent && <span className="wl-err" role="alert">{err.consent}</span>}
            {step === 2 && err.submit && <span className="wl-err" role="alert">{err.submit}</span>}
            {step === 2 && <input className="wl-hp" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" value={company} onChange={event => setCompany(event.target.value)} />}
            {step < 2 && <Primary>Continue</Primary>}
            {step === 2 && <Primary busy={busy}>{busy ? 'Joining…' : 'Join the waitlist'}</Primary>}
            {step === 3 && (
              <div className="wl-actions">
                <Primary to={partner ? '/?as=partner' : '/'}>Back to RYDO</Primary>
                <button type="button" className="wl-alt" onClick={restart}>Start over</button>
              </div>
            )}
          </div>
        </form>
        <p className="wl-note">Prelaunch preview. Joining the waitlist registers your interest only.</p>
      </main>
    </div>
  );
}

function Head({ eye, title, sub }) {
  return (
    <div className="wl-head">
      <p className="wl-eye">{eye}</p>
      <h1>{title}</h1>
      <p className="wl-sub">{sub}</p>
    </div>
  );
}
