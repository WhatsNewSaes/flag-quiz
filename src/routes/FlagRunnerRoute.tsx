import { useNavigate } from 'react-router-dom';
import { FlagRunnerScreen } from '../screens/FlagRunnerScreen';
import { ModeGuard } from './ModeGuard';

export function FlagRunnerRoute() {
  const navigate = useNavigate();

  return (
    <ModeGuard modeKey="flag-runner">
      <FlagRunnerScreen onBack={() => navigate('/play/modes')} />
    </ModeGuard>
  );
}
