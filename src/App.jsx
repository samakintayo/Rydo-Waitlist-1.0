import { usePath } from './lib/router.jsx';
import Landing from './pages/Landing.jsx';
import Waitlist from './pages/Waitlist.jsx';

export default function App() {
  const path = usePath().replace(/\/+$/, '') || '/';
  if (path === '/waitlist') return <Waitlist />;
  return <Landing />;
}
