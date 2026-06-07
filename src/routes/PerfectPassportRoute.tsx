import { useLocation, useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { SEOHead } from '../components/seo/SEOHead';
import { ModeGuard } from './ModeGuard';
import { PerfectPassportScreen } from '../screens/PerfectPassportScreen';
import { MODE_OG_IMAGES } from '../utils/modeOgImages';

export function PerfectPassportRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const isChallengeShare = new URLSearchParams(location.search).has('challenge');

  return (
    <ModeGuard modeKey="perfect-passport">
      <SEOHead
        title="Perfect Passport - Can You Score 197/197? | Flag Arcade"
        description="Draft 10 countries from random spins, simulate a world tour, and see if your roster can score 197/197 in Perfect Passport."
        canonical="https://flagarcade.com/play/perfect-passport"
        ogImage={isChallengeShare ? `${MODE_OG_IMAGES.perfectPassportChallenge}${location.search}` : MODE_OG_IMAGES.perfectPassport}
      />
      <NavBar />
      <PerfectPassportScreen onBack={() => navigate('/play/modes')} />
    </ModeGuard>
  );
}
