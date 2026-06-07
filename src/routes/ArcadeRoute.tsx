import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { ArcadeScreen } from '../screens/ArcadeScreen';
import { ModeGuard } from './ModeGuard';
import { SEOHead } from '../components/seo/SEOHead';
import { MODE_OG_IMAGES } from '../utils/modeOgImages';

export function ArcadeRoute() {
  const navigate = useNavigate();

  return (
    <ModeGuard modeKey="free-play">
      <SEOHead
        title="Arcade Mode - Free Flag Quiz | Flag Arcade"
        description="Arcade-style flag quiz. Pick your difficulty and continent, then guess as many country flags as you can. Free to play, no signup."
        canonical="https://flagarcade.com/play/arcade"
        ogImage={MODE_OG_IMAGES.arcade}
      />
      <NavBar />
      <ArcadeScreen onBack={() => navigate('/play/modes')} />
    </ModeGuard>
  );
}
