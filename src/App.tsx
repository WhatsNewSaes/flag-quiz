import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { CelebrationTest } from './components/CelebrationTest';
import { Onboarding } from './components/Onboarding';
import { AchievementToast } from './components/journey/AchievementToast';
import { CountryFlagPage } from './pages/CountryFlagPage';
import { FlagsDirectoryPage } from './pages/FlagsDirectoryPage';
import { ContinentFlagsPage } from './pages/ContinentFlagsPage';
import { QuizLandingPage } from './pages/QuizLandingPage';
import { ContinentQuizPage } from './pages/ContinentQuizPage';
import { HomePage } from './pages/HomePage';
import { SiteLayout } from './layouts/SiteLayout';
import { GameProvider, useGameContext } from './contexts/GameContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import { JourneyScreen } from './routes/JourneyScreen';
import { ModesRoute } from './routes/ModesRoute';
import { ArcadeRoute } from './routes/ArcadeRoute';
import { AroundTheWorldRoute } from './routes/AroundTheWorldRoute';
import { JeopardyRoute } from './routes/JeopardyRoute';
import { PresentationRoute } from './routes/PresentationRoute';
import { FlagRunnerRoute } from './routes/FlagRunnerRoute';
import { AchievementsRoute } from './routes/AchievementsRoute';
import { CharactersRoute } from './routes/CharactersRoute';

// One-time migration from old localStorage screen state to URL
const SCREEN_TO_PATH: Record<string, string> = {
  'journey-map': '/play',
  'mode-select': '/play/modes',
  'arcade': '/play/arcade',
  'free-play': '/play/arcade',
  'around-the-world': '/play/around-the-world',
  'jeopardy-difficulty-select': '/play/jeopardy',
  'jeopardy': '/play/jeopardy',
  'presentation': '/play/presentation',
  'flag-runner': '/play/flag-runner',
  'achievements': '/play/achievements',
  'characters': '/play/characters',
  'campaign': '/play/arcade',
  'campaign-quiz-select': '/play/arcade',
};

function GameLayoutInner() {
  const navigate = useNavigate();
  const { pendingAchievements, setPendingAchievements, allLevels, handleSelectLevel } = useGameContext();

  // Onboarding state
  const [onboardingComplete, setOnboardingComplete] = useLocalStorage<string>('onboarding-complete', '');
  const [, setSelectedCharacter] = useLocalStorage<string>('selected-character', '');
  const [, setFavoriteFlag] = useLocalStorage<string>('favorite-flag', '');

  // Hidden test page — type "devmode" anywhere to toggle
  const [showTestPage, setShowTestPage] = useState(false);
  const secretBuffer = useRef('');

  useEffect(() => {
    const SECRET = 'devmode';
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      secretBuffer.current = (secretBuffer.current + e.key).slice(-SECRET.length);
      if (secretBuffer.current === SECRET) {
        setShowTestPage(prev => !prev);
        secretBuffer.current = '';
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // One-time localStorage migration
  useEffect(() => {
    const oldScreen = localStorage.getItem('app-screen');
    if (oldScreen) {
      const cleaned = oldScreen.replace(/^"|"$/g, '');
      const path = SCREEN_TO_PATH[cleaned];
      if (path) {
        navigate(path, { replace: true });
      }
      localStorage.removeItem('app-screen');
    }
  }, [navigate]);

  const handleOnboardingComplete = useCallback((character: string, flag: string) => {
    setSelectedCharacter(character);
    setFavoriteFlag(flag);
    setOnboardingComplete('true');
    handleSelectLevel(allLevels[0]);
  }, [setSelectedCharacter, setFavoriteFlag, setOnboardingComplete, handleSelectLevel, allLevels]);

  if (showTestPage) {
    return (
      <CelebrationTest
        onBack={() => setShowTestPage(false)}
        onNavigate={(screen) => {
          setShowTestPage(false);
          const path = SCREEN_TO_PATH[screen] || '/play';
          navigate(path);
        }}
      />
    );
  }

  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <Outlet />
      {pendingAchievements.length > 0 && (
        <AchievementToast
          achievementIds={pendingAchievements}
          onDone={() => setPendingAchievements([])}
        />
      )}
    </>
  );
}

function GameLayout() {
  // Callbacks for GameProvider to drive journey phase transitions
  // These are called when the context needs to signal navigation,
  // but JourneyScreen manages its own local phase state in-memory.
  const onNavigateToPlay = useCallback(() => {
    // Journey play phase is handled within JourneyScreen's local state
    // No URL change needed — stays at /play
  }, []);

  const onNavigateToComplete = useCallback(() => {
    // Journey complete phase is handled within JourneyScreen's local state
    // No URL change needed — stays at /play
  }, []);

  return (
    <GameProvider onNavigateToPlay={onNavigateToPlay} onNavigateToComplete={onNavigateToComplete}>
      <GameLayoutInner />
    </GameProvider>
  );
}

function ContinentQuizPageWrapper() {
  const { slug } = useParams<{ slug: string }>();
  return <ContinentQuizPage key={slug} />;
}

function App() {
  return (
    <Routes>
      {/* Site pages with persistent nav */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/flags" element={<FlagsDirectoryPage />} />
        <Route path="/flags/continent/:slug" element={<ContinentFlagsPage />} />
        <Route path="/flags/:slug" element={<CountryFlagPage />} />
        <Route path="/quiz" element={<QuizLandingPage />} />
        <Route path="/quiz/:slug" element={<ContinentQuizPageWrapper />} />
      </Route>
      {/* Game routes with shared game state */}
      <Route path="/play" element={<GameLayout />}>
        <Route index element={<JourneyScreen />} />
        <Route path="modes" element={<ModesRoute />} />
        <Route path="arcade" element={<ArcadeRoute />} />
        <Route path="around-the-world" element={<AroundTheWorldRoute />} />
        <Route path="jeopardy" element={<JeopardyRoute />} />
        <Route path="presentation" element={<PresentationRoute />} />
        <Route path="flag-runner" element={<FlagRunnerRoute />} />
        <Route path="achievements" element={<AchievementsRoute />} />
        <Route path="characters" element={<CharactersRoute />} />
        <Route path="*" element={<Navigate to="/play" replace />} />
      </Route>
      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
