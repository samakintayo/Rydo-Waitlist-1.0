import { S, F } from './assets/index.js';

/**
 * Landing copy and images for both audiences (Figma "RYDO LANDING CUSTOMER" 27:140 and
 * "RYDO LANDING DRIVERS" 87:6626). The hero uses the design's hand-held phone mockups; partner
 * section phones use driver screens so each card shows what it describes.
 */
export const D = {
  ride: {
    to: '/waitlist',
    cta: 'Join the waitlist',
    // Headline: words before the highlight, then the highlighted words (lime block behind them).
    h1: ['Move on your', 'Terms'],
    desc: 'Rides, deliveries and scheduled journeys in one app. Take the suggested fare or make an offer. Compare responses, agree on a price, choose your experience and get moving.',
    tags: ['Your fare', 'Your choice'],
    strip: ['Schedule ahead', 'Send a package', 'Ride now', 'Card & wallet', 'Agree your fare'],
    valueEye: 'More choice. Every journey.',
    valueH: 'Your fare. Your time. Your way.',
    value: [
      { n: '01 · Fare', title: 'Take the fare. Or make an offer.', text: 'Book at the suggested fare or propose your own. Drivers can accept or counter, and you choose whether to proceed.', img: F.screenFare, alt: 'Choosing a ride with a negotiable offer' },
      { n: '02 · Time', title: 'Go now. Plan for later.', text: 'Request a ride when you’re ready or schedule a journey ahead. Review the route, fare and payment method before confirming.', img: F.screenSchedule, alt: 'Scheduled trip review and payment', dark: true },
      { n: '03 · Way', title: 'Ride or send.', text: 'Get yourself across town or send a package from pickup to drop-off, all through RYDO.', img: F.screenTrack, alt: 'Package on the way' },
    ],
    howH: 'Set your route. Choose your fare. Go.',
    steps: [
      ['Choose what you need', 'Select a ride or delivery, then enter your pickup and destination.', F.screenHome, 'RYDO home with nearby cars, Ride and Delivery'],
      ['Choose how you book', 'Use the suggested fare for direct matching, or turn on negotiation and make an offer.', S.negotiate, 'Ride request with negotiate price on'],
      ['Agree and confirm', 'Review acceptances and counteroffers, compare details, and confirm the experience that suits you.', S.offers, 'Three driver offers to compare'],
      ['Follow your journey', 'Track progress on the map and stay in touch through in-app messaging and calling.', S.arriving, 'Driver arriving, with message and call'],
    ],
    featEye: 'Made for everyday movement',
    featH: 'Everything your trip needs. In one place.',
    feats: [
      { tone: 'lime', wide: true, title: 'Negotiation is your choice.', text: 'Want a straightforward booking? Use the suggested fare. Prefer to negotiate? Make an offer and review the responses.', img: S.fixed, alt: 'Fixed fare request', img2: S.negotiate, alt2: 'Negotiated request with an offer' },
      { tone: 'forest', title: 'Make room for later.', text: 'Schedule a journey ahead and review your booking details before confirming.', img: F.screenReview, alt: 'Scheduled trip review with card and wallet' },
      { tone: 'mint', title: 'Send with the details sorted.', text: 'Add pickup and drop-off locations, parcel information and recipient details, then follow the delivery’s progress.', img: F.screenLocations, alt: 'Delivery request confirming locations' },
      { tone: 'periwinkle', title: 'Pay your way.', text: 'Choose a card or your RYDO wallet and review the amount before confirming.', img: F.screenWallet, alt: 'Wallet with balance and history' },
      { tone: 'butter', title: 'Keep in touch.', text: 'Message or call your driver in the app to coordinate your pickup.', img: S.driverFound, alt: 'Driver found, with message and call buttons' },
    ],
    banner: { kind: 'photo', img: F.photoWoman, alt: 'A RYDO customer showing the app' },
    finH: 'Your next move starts here.',
    finP: 'Be among the first to hear when RYDO opens. Join the waitlist for rides, deliveries and more choice over how you move.',
  },
  drive: {
    to: '/waitlist?as=partner',
    cta: 'Join the partner waitlist',
    h1: ['Your work, earnings.', 'All yours.'],
    desc: 'Drive passengers or deliver packages with RYDO. Pay an access fee to use the platform and keep 100% of your trip and delivery earnings. No commission on each job.',
    tags: ['Your earnings', 'Your schedule'],
    strip: ['100% of your earnings', 'No trip commission', 'Access-fee plans', 'Passenger trips', 'Package deliveries'],
    valueEye: 'You do the work. You keep the earnings.',
    valueH: 'Every trip earned. Every naira yours.',
    value: [
      { n: '01 · Earnings', title: 'Keep 100% of your earnings.', text: 'RYDO takes no commission from your trips or deliveries. You pay an access fee to use the platform and keep what you earn.', img: S.driverEarnings, alt: 'Earnings screen' },
      { n: '02 · Access', title: 'Choose access that fits your work.', text: 'Pick a daily, weekly or monthly access plan that suits your schedule. Prices will be announced before launch.', img: S.driverPlans, alt: 'Access plans', dark: true },
      { n: '03 · Fare', title: 'Have a say in the fare.', text: 'Review requests before accepting. When a customer makes an offer, accept it or send a counteroffer. The job proceeds once the customer confirms.', img: S.driverCounter, alt: 'Counteroffer screen' },
      { n: '04 · Work', title: 'Drive passengers. Deliver packages.', text: 'Receive requests for your approved service and vehicle, with job details available before you accept.', img: S.dispatchRequest, alt: 'Delivery request', full: true },
    ],
    howH: 'Get verified. Get access. Get moving.',
    steps: [
      ['Join the partner waitlist', 'Tell us your location and whether you want to join as a driver or dispatch rider.', S.rolePick, 'Choose how you will use RYDO'],
      ['Complete onboarding', 'When onboarding opens, submit the identity and vehicle documents required for your service.', S.onboarding, 'Onboarding checklist'],
      ['Choose your access plan', 'Select daily, weekly or monthly access to receive requests through RYDO.', S.driverPlans, 'Access plans'],
      ['Go online and earn', 'Review incoming jobs, accept suitable requests or counter customer offers. Complete the work and keep 100% of your trip and delivery earnings.', S.driverRequest, 'Passenger request with accept, counter and skip'],
    ],
    featEye: 'Built around your working day',
    featH: 'More control over every ride and delivery.',
    feats: [
      { tone: 'lime', wide: true, title: 'Know the job. Agree the fare.', text: 'See the pickup, destination and offered fare before deciding. Accept or propose a different fare, then wait for the customer’s confirmation before starting.', photo: F.photoDriver, alt: 'A RYDO driver showing a ride request' },
      { tone: 'forest', title: 'Work on your terms.', text: 'Choose daily, weekly or monthly access. Go online to receive ride or delivery requests and offline when you’re done. Plan prices will be announced before launch.', img: S.driverOnline, alt: 'Driver online' },
      { tone: 'mint', title: 'Keep every job organised.', text: 'Review trip or parcel details, coordinate pickup and update progress from pickup to drop-off.', img: S.dispatchDone, alt: 'Delivery progress from pickup to drop-off' },
      { tone: 'periwinkle', title: 'Stay connected along the way.', text: 'Call or message passengers, senders and recipients within the app to coordinate each ride or delivery.', img: S.dispatchPickup, alt: 'Calling the sender and receiver at pickup' },
      { tone: 'butter', title: 'See what you’ve earned.', text: 'Review completed rides and deliveries, track your earnings and manage withdrawal requests in one place.', img: S.driverEarnings, alt: 'Earnings' },
    ],
    banner: { kind: 'vehicles', scooter: F.scooter, car: F.car },
    finH: 'Your next move starts here.',
    finP: 'Join the partner waitlist for onboarding updates, access-plan pricing and launch announcements.',
  },
};

export const FAQ = [
  ['What can I do with RYDO?', 'RYDO brings rides, package deliveries and scheduled journeys into one app. Drivers and dispatch riders can also use it to receive and manage work.'],
  ['Do I have to negotiate?', 'No. You can use the suggested fare for direct matching. Negotiation is optional.'],
  ['How do offers and counteroffers work?', 'You propose a fare. A driver or dispatch rider can accept it or suggest another price. You review the response and confirm before the booking proceeds.'],
  ['Does a counteroffer automatically confirm my booking?', 'No. You must accept the counteroffer and confirm the booking.'],
  ['Can I schedule a journey?', 'Yes. Choose your route and preferred time, then review the booking details before confirming.'],
  ['How can I pay?', 'The planned payment options are card and RYDO wallet.'],
  ['Does RYDO take a commission from drivers or dispatch riders?', 'No. Drivers and dispatch riders keep 100% of their trip and delivery earnings. They pay an access fee to use the platform.'],
  ['What access plans will be available?', 'Daily, weekly and monthly plans are planned. Prices will be announced before launch.'],
  ['Can I use RYDO as both a customer and a driver?', 'Yes. Use the same app and switch to your approved driver or dispatch mode from the menu.'],
  ['Does joining the waitlist activate my account?', 'No. It registers your interest. We’ll share launch and onboarding updates using your chosen contact details.'],
];
