import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { ArcadeScreen } from '../screens/ArcadeScreen';
import { ModeGuard } from './ModeGuard';

export function ArcadeRoute() {
  const navigate = useNavigate();

  return (
    <ModeGuard modeKey="free-play">
      <NavBar />
      <ArcadeScreen onBack={() => navigate('/play/modes')} />
    </ModeGuard>
  );
}
