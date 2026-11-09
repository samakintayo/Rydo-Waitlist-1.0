// Single place for every image and SVG used by the site.
// Photos and screenshots come as { src, avif, webp, width, height }: the <Img> component serves
// AVIF (smallest) with WebP as the fallback, at the right width for the screen.
import logoDark from './figma/logo-dark.svg';
import logoLight from './figma/logo-light.svg';
import arrowOnDark from './figma/arrow-on-dark.svg';
import arrowOnLime from './figma/arrow-on-lime.svg';
import appIconTile from './figma/app-icon.svg';
import footerWordmark from './figma/footer-wordmark.svg';
import aurora1 from './figma/aurora-1.svg';
import aurora2 from './figma/aurora-2.svg';
import roleCar from './figma/role-car.webp';
import roleScooter from './figma/role-scooter.webp';

const files = import.meta.glob(['./screens/*.{webp,avif}', './figma/*.{webp,avif}'], { eager: true, import: 'default' });
const file = path => {
  if (!files[path]) throw new Error(`Missing image ${path}`);
  return files[path];
};

/** A phone screenshot: 600 px wide (shown at most ~330 px), AVIF + WebP. */
const screen = path => ({ src: file(`${path}.webp`), avif: file(`${path}.avif`), webp: file(`${path}.webp`), width: 600, height: 1298 });

/** A photo at a small and a large width; `ratio` is height ÷ width. */
const photo = (name, widths, ratio) => {
  const set = ext => widths.map(w => `${file(`./figma/${name}-${w}.${ext}`)} ${w}w`).join(', ');
  const max = widths[widths.length - 1];
  return { src: file(`./figma/${name}-${max}.webp`), avif: set('avif'), webp: set('webp'), width: max, height: Math.round(max * ratio) };
};

// App screenshots from the previous site.
export const S = {
  negotiate: screen('./screens/negotiate'), fixed: screen('./screens/fixed'), offers: screen('./screens/offers'),
  driverFound: screen('./screens/driver-found'), arriving: screen('./screens/arriving'),
  driverOnline: screen('./screens/driver-online'), driverRequest: screen('./screens/driver-request'), driverCounter: screen('./screens/driver-counter'),
  driverPlans: screen('./screens/driver-plans'), driverEarnings: screen('./screens/driver-earnings'),
  dispatchRequest: screen('./screens/dispatch-request'), dispatchPickup: screen('./screens/dispatch-pickup'), dispatchDone: screen('./screens/dispatch-done'),
  rolePick: screen('./screens/role-pick'), onboarding: screen('./screens/onboarding'),
};

// New landing design (Figma 27:140 / 87:6626) and waitlist (76:1641).
export const F = {
  logoDark, logoLight, arrowOnDark, arrowOnLime, appIconTile, footerWordmark, aurora1, aurora2, roleCar, roleScooter,
  screenFare: screen('./figma/screen-fare'), screenSchedule: screen('./figma/screen-schedule'), screenTrack: screen('./figma/screen-track'),
  screenHome: screen('./figma/screen-home'), screenReview: screen('./figma/screen-review'), screenLocations: screen('./figma/screen-locations'),
  screenWallet: screen('./figma/screen-wallet'),
  handLeft: photo('hand-left', [640, 1100], 1208 / 1300),
  handRight: photo('hand-right', [420, 760], 1847 / 1300),
  photoWoman: photo('photo-woman', [640, 1000], 1086 / 1100),
  photoDriver: photo('photo-driver', [520, 900], 1),
  waitlistHero: photo('waitlist-hero', [640, 1100], 800 / 1200),
  scooter: photo('scooter', [360, 600], 1),
  car: photo('car', [480, 640], 1),
};
