import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { GameModeSelect, type GameMode } from '../components/GameModeSelect';
import { SEOHead } from '../components/seo/SEOHead';

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
      <SEOHead
        title="Play - Pick a Game Mode | Flag Arcade"
        description="Choose a game mode — Journey, Arcade, Around the World, Jeopardy, Practice, or Flag Runner. Free flag quizzes with all 197 country flags."
        canonical="https://flagarcade.com/play/modes"
      />
      <NavBar />
      <GameModeSelect
        onSelectMode={handleSelectMode}
        onJourney={() => navigate('/play/journey')}
      />
    </>
  );
}
