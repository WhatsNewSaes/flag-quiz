import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { GameModeSelect, type GameMode } from '../components/GameModeSelect';

export function ModesRoute() {
  const navigate = useNavigate();

  const handleSelectMode = (mode: GameMode) => {
    if (mode === 'arcade') navigate('/play/arcade');
    else if (mode === 'around-the-world') navigate('/play/around-the-world');
    else if (mode === 'jeopardy') navigate('/play/jeopardy');
    else if (mode === 'presentation') navigate('/play/presentation');
    else if (mode === 'flag-runner') navigate('/play/flag-runner');
  };

  return (
    <>
      <NavBar />
      <GameModeSelect
        onSelectMode={handleSelectMode}
        onJourney={() => navigate('/play/journey')}
      />
    </>
  );
}
