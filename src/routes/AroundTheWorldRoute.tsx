import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { AroundTheWorldScreen } from '../screens/AroundTheWorldScreen';
import { ModeGuard } from './ModeGuard';
import { SEOHead } from '../components/seo/SEOHead';
import { MODE_OG_IMAGES } from '../utils/modeOgImages';

export function AroundTheWorldRoute() {
  const navigate = useNavigate();

  return (
    <ModeGuard modeKey="around-the-world">
      <SEOHead
        title="Around the World - Flag Quiz | Flag Arcade"
        description="Race through flags from every continent in one run. Free Around the World flag quiz — see how far you can travel before you slip up."
        canonical="https://flagarcade.com/play/around-the-world"
        ogImage={MODE_OG_IMAGES.aroundTheWorld}
      />
      <NavBar />
      <AroundTheWorldScreen onBack={() => navigate('/play/modes')} />
    </ModeGuard>
  );
}
