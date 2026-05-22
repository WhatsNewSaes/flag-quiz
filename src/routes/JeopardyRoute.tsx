import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { JeopardyDifficultySelect, type JeopardyQuizMode } from '../components/JeopardyDifficultySelect';
import { JeopardyScreen } from '../screens/JeopardyScreen';
import { ModeGuard } from './ModeGuard';
import { SEOHead } from '../components/seo/SEOHead';

export function JeopardyRoute() {
  const navigate = useNavigate();
  const [quizMode, setQuizMode] = useState<JeopardyQuizMode | null>(null);

  return (
    <ModeGuard modeKey="jeopardy">
      <SEOHead
        title="Jeopardy Mode - Country to Flag Quiz | Flag Arcade"
        description="See the country name and pick the correct flag. Five difficulty levels in this free Jeopardy-style flag quiz from Flag Arcade."
        canonical="https://flagarcade.com/play/jeopardy"
      />
      <NavBar variant="dark" />
      {quizMode ? (
        <JeopardyScreen quizMode={quizMode} />
      ) : (
        <JeopardyDifficultySelect
          onSelect={(mode) => setQuizMode(mode)}
          onBack={() => navigate('/play/modes')}
        />
      )}
    </ModeGuard>
  );
}
