import { useEffect, useState } from 'react';
import { Link } from '../lib/router.jsx';
import { F } from '../assets/index.js';
import { FAQ } from '../data.js';
import Phone from './Phone.jsx';
import Img from './Img.jsx';

/** Lime pill with the round arrow (Figma "Link"); `dark` is the forest version used on lime. */
export function JoinButton({ to, children, dark = false }) {
  return (
    <Link className={`btn join${dark ? ' dark' : ''}`} to={to}>
      <span>{children}</span>
      <span className="dot"><img src={dark ? F.arrowOnLime : F.arrowOnDark} alt="" width="16" height="16" /></span>
    </Link>
  );
}

export function HowButton({ dark = false }) {
  return <a className={`btn ghost${dark ? ' on-lime' : ''}`} href="#how">See how it works</a>;
}

/** Sticky header: logo and the Customers / Partner switch. */
export function Header({ partner, onPick }) {
  return (
    <header className="hdr">
      <div className="hdr-in">
        <a href="#top" aria-label="RYDO home"><img src={F.logoDark} alt="RYDO" className="hdr-logo" /></a>
        <div className="mode" role="group" aria-label="Choose your view">
          <button type="button" aria-pressed={!partner} className={!partner ? 'on' : ''} onClick={() => onPick('ride')}>Customers</button>
          <button type="button" aria-pressed={partner} className={partner ? 'on' : ''} onClick={() => onPick('drive')}>Partner</button>
        </div>
      </div>
    </header>
  );
}

/** Hero: headline with the lime highlight, intro and buttons, then the green band with the hand-held phones. */
export function Hero({ a, swap }) {
  return (
    <section className="hero" id="top">
      <div className={`hero-top wrap sw ${swap}`}>
        <h1 className="hero-h1">
          {a.h1[0]} <mark>{a.h1[1]}</mark>
        </h1>
        <div className="hero-side">
          <p>{a.desc}</p>
          <div className="btns">
            <JoinButton to={a.to}>{a.cta}</JoinButton>
            <HowButton />
          </div>
        </div>
      </div>
      <div className="band">
        <div className="band-word" aria-hidden="true"><span>RYDO</span><span>RYDO</span></div>
        <Img className="hand left" img={F.handLeft} alt="A hand holding RYDO showing ride options and a negotiated fare" sizes="(max-width: 720px) 70vw, 44vw" priority />
        <Img className="hand right" img={F.handRight} alt="A hand holding RYDO showing the home screen with nearby cars" sizes="(max-width: 720px) 43vw, 27vw" priority />
        <span className="tag t1">{a.tags[0]}</span>
        <span className="tag t2">{a.tags[1]}</span>
      </div>
    </section>
  );
}

/** Dark marquee of what RYDO does, separated by lime dots. */
export function Strip({ items }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="strip" role="region" aria-label={items.join(', ')}>
      <div className="strip-track" aria-hidden="true">
        {[0, 1].map(copy => (
          <div className="strip-set" key={copy}>
            {row.map((item, index) => <span key={`${copy}-${index}`}><b>{item}</b><i /></span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Phones in a fixed-height zone at the bottom of a card (the previous site's layout): the frame's
 * top sits inside the zone and the card edge cuts it cleanly. Two images show two phones.
 */
function PhoneZone({ img, alt, img2, alt2, className = '' }) {
  return (
    <div className={`pz ${className}`.trim()}>
      <Phone img={img} alt={alt} style={{ '--l': img2 ? '31%' : '50%' }} />
      {img2 && <Phone className="p2" img={img2} alt={alt2} style={{ '--l': '69%', rotate: '3deg' }} />}
    </div>
  );
}

export function SectionHead({ eye, title, light = false }) {
  return (
    <div className={`shead${light ? ' light' : ''}`}>
      {eye && <p className="eye">{eye}</p>}
      <h2>{title}</h2>
    </div>
  );
}

/** Value cards: numbered pill, title, copy and a phone cropped by the card's bottom edge. */
export function Value({ a, swap }) {
  return (
    <section className="wrap sec value" id="why">
      <SectionHead eye={a.valueEye} title={a.valueH} />
      <div className={`value-grid sw ${swap}`}>
        {a.value.map(card => (
          <article key={card.n} className={`vcard${card.full ? ' full' : ''}`}>
            <span className={`pill${card.dark ? ' dark' : ''}`}>{card.n}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <PhoneZone img={card.img} alt={card.alt} />
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * "Set your route..." on dark green: four clickable steps, each showing its own screen on the
 * phone below. The steps advance on their own until someone picks one.
 */
export function How({ a, swap, audience }) {
  const [state, setState] = useState({ i: 0, aud: audience, manual: false });
  const current = state.aud === audience ? state.i : 0;
  const manual = state.aud === audience && state.manual;
  useEffect(() => {
    if (manual) return;
    const timer = setInterval(() => setState(s => ({ i: ((s.aud === audience ? s.i : 0) + 1) % a.steps.length, aud: audience, manual: false })), 5000);
    return () => clearInterval(timer);
  }, [manual, audience, a.steps.length]);
  const [, , img, alt] = a.steps[current];
  return (
    <section className="how" id="how">
      <h2 className={`sw ${swap}`}>{a.howH}</h2>
      <div className="steps" role="tablist" aria-label="How it works">
        {a.steps.map(([title, text], index) => (
          <button key={title} type="button" role="tab" id={`how-tab-${index}`} aria-selected={index === current} aria-controls="how-phone" className={index === current ? 'on' : ''} onClick={() => setState({ i: index, aud: audience, manual: true })}>
            <span className="num">{String(index + 1).padStart(2, '0')}</span>
            <b>{title}</b>
            <span className="txt">{text}</span>
            {index === current && !manual && <span className="bar" key={`${audience}-${current}`} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="how-stage">
        <span className="ring r1" aria-hidden="true" />
        <span className="ring r2" aria-hidden="true" />
        <div className="how-phone" id="how-phone" role="tabpanel" aria-labelledby={`how-tab-${current}`}>
          <Phone key={`${audience}-${current}`} className="fade" img={img} alt={alt} />
        </div>
      </div>
    </section>
  );
}

/** Feature bento: a wide lime card and a forest card, then three tinted cards with phones. */
export function Features({ a, swap }) {
  return (
    <section className="wrap sec feats" id="features">
      <SectionHead eye={a.featEye} title={a.featH} />
      <div className={`feat-grid sw ${swap}`}>
        {a.feats.map(card => (
          <article key={card.title} className={`fcard ${card.tone}${card.wide ? ' wide' : ''}${card.photo ? ' has-photo' : ''}`}>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            {card.photo ? <Img className="fphoto" img={card.photo} alt={card.alt} sizes="(max-width: 720px) 90vw, 517px" /> : <PhoneZone img={card.img} alt={card.alt} img2={card.img2} alt2={card.alt2} />}
          </article>
        ))}
      </div>
    </section>
  );
}

/** FAQ accordion: one open at a time, the first open by default. */
export function Faqs() {
  const [open, setOpen] = useState(0);
  return (
    <section className="wrap sec faq" id="faq">
      <div className="faq-left">
        <p className="eye">FAQ</p>
        <h2>Good to know.</h2>
        <p className="faq-sub">Straight answers about fares, payments and how partners earn with RYDO.</p>
      </div>
      <div className="faq-list">
        {FAQ.map(([q, answer], index) => {
          const isOpen = open === index;
          return (
            <div key={q} className={`qa${isOpen ? ' open' : ''}`}>
              <button type="button" aria-expanded={isOpen} aria-controls={`faq-${index}`} onClick={() => setOpen(isOpen ? -1 : index)}>
                <span>{q}</span>
                <i aria-hidden="true">{isOpen ? '×' : '+'}</i>
              </button>
              <div id={`faq-${index}`} role="region" className="ans" hidden={!isOpen}>{answer}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Lime banner: "Ride. Send. Drive. Deliver." with a customer photo or the partner vehicles. */
export function Banner({ a, swap }) {
  return (
    <section className={`banner ${a.banner.kind}`}>
      <div className="banner-copy">
        <h2>Ride.&nbsp; Send.<br />Drive.&nbsp; Deliver.</h2>
        <p>Switch between customer and rider experiences anytime. One account, one clear way to move through your day.</p>
        <div className="btns">
          <JoinButton to={a.to} dark>{a.cta}</JoinButton>
          <HowButton dark />
        </div>
      </div>
      <div className={`banner-art sw ${swap}`}>
        {a.banner.kind === 'photo'
          ? <Img className="woman" img={a.banner.img} alt={a.banner.alt} sizes="(max-width: 1180px) 100vw, 53vw" />
          : <>
            <Img className="scooter" img={a.banner.scooter} alt="RYDO dispatch scooter" sizes="(max-width: 1180px) 44vw, 29vw" />
            <Img className="car" img={a.banner.car} alt="RYDO car" sizes="(max-width: 1180px) 66vw, 45vw" />
          </>}
      </div>
    </section>
  );
}

/** Dark rounded call to action with the tilted app icon. */
export function FinalCta({ a }) {
  return (
    <section className="wrap final-wrap">
      <div className="final">
        <img className="final-icon" src={F.appIconTile} alt="" />
        <div className="final-copy">
          <h2>{a.finH}</h2>
          <p>{a.finP}</p>
        </div>
        <JoinButton to={a.to}>{a.cta}</JoinButton>
      </div>
    </section>
  );
}

export function Footer({ onPick }) {
  const pick = mode => event => { event.preventDefault(); onPick(mode); document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' }); };
  const cols = [
    ['Explore', [['How it works', '#how'], ['Features', '#features'], ['Why RYDO', '#why'], ['Inside the app', '#how']]],
    ['Customers', [['Ride', '#top', 'ride'], ['Send a package', '#top', 'ride'], ['Schedule a journey', '#top', 'ride'], ['Card and wallet', '#top', 'ride']]],
    ['Partners', [['Drive', '#top', 'drive'], ['Deliver', '#top', 'drive'], ['Access plans', '#top', 'drive']]],
  ];
  return (
    <footer className="foot">
      <div className="foot-top">
        <div className="foot-brand">
          <img src={F.logoLight} alt="RYDO" />
          <p>Ride. Send. Drive. Deliver. No trip commission.</p>
        </div>
        <nav className="foot-cols" aria-label="Footer">
          {cols.map(([title, links]) => (
            <div key={title}>
              <p>{title}</p>
              {links.map(([label, href, mode]) => <a key={label} href={href} onClick={mode ? pick(mode) : undefined}>{label}</a>)}
            </div>
          ))}
          <div>
            <p>Waitlist</p>
            <Link to="/waitlist">Join the waitlist</Link>
            <a href="#faq">FAQs</a>
          </div>
        </nav>
      </div>
      <img className="foot-word" src={F.footerWordmark} alt="" aria-hidden="true" />
      <div className="foot-legal">
        <span>© 2026 RYDO.</span>
        <span>Privacy Policy · Terms</span>
      </div>
    </footer>
  );
}
