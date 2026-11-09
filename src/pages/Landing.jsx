import { useState } from 'react';
import { D } from '../data.js';
import { Banner, Faqs, Features, FinalCta, Footer, Header, Hero, How, Strip, Value } from '../components/Sections.jsx';

/** One landing page for both audiences; `?as=partner` opens the partner view. */
export default function Landing() {
  const [aud, setAud] = useState(() => (new URLSearchParams(window.location.search).get('as') === 'partner' ? 'drive' : 'ride'));
  const [tick, setTick] = useState(0);
  const a = D[aud];
  const partner = aud === 'drive';
  // Alternating class names restart the swap animation on each change.
  const swap = tick % 2 ? 'a' : 'b';
  const pick = value => {
    if (value === aud) return;
    setAud(value);
    setTick(t => t + 1);
    window.history.replaceState({}, '', value === 'drive' ? '/?as=partner' : '/');
  };
  return (
    <>
      <Header partner={partner} onPick={pick} />
      <main>
        <Hero a={a} swap={swap} />
        <Strip key={aud} items={a.strip} />
        <Value a={a} swap={swap} />
        <How a={a} swap={swap} audience={aud} />
        <Features a={a} swap={swap} />
        <Faqs />
        <Banner a={a} swap={swap} />
        <FinalCta a={a} />
      </main>
      <Footer onPick={pick} />
    </>
  );
}
