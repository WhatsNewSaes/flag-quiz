import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { JeopardyDifficultySelect, type JeopardyQuizMode } from '../components/JeopardyDifficultySelect';
import { JeopardyScreen } from '../screens/JeopardyScreen';
import { ModeGuard } from './ModeGuard';

export function JeopardyRoute() {
  const navigate = useNavigate();
  const [quizMode, setQuizMode] = useState<JeopardyQuizMode | null>(null);

  return (
    <ModeGuard modeKey="jeopardy">
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
