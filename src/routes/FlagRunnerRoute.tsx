import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { FlagRunnerScreen } from '../screens/FlagRunnerScreen';
import { ModeGuard } from './ModeGuard';
import { SEOHead } from '../components/seo/SEOHead';
import { MODE_OG_IMAGES } from '../utils/modeOgImages';

export function FlagRunnerRoute() {
  const navigate = useNavigate();

  return (
    <ModeGuard modeKey="flag-runner">
      <SEOHead
        title="Flag Runner - Pixel-Art Platformer | Flag Arcade"
        description="Run, jump, and collect country flags in this retro pixel-art platformer. Free Flag Runner game from Flag Arcade."
        canonical="https://flagarcade.com/play/flag-runner"
        ogImage={MODE_OG_IMAGES.flagRunner}
      />
      <NavBar />
      <FlagRunnerScreen onBack={() => navigate('/play/modes')} />
    </ModeGuard>
  );
}
