import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { AroundTheWorldScreen } from '../screens/AroundTheWorldScreen';
import { ModeGuard } from './ModeGuard';

export function AroundTheWorldRoute() {
  const navigate = useNavigate();

  return (
    <ModeGuard modeKey="around-the-world">
      <NavBar />
      <AroundTheWorldScreen onBack={() => navigate('/play/modes')} />
    </ModeGuard>
  );
}
