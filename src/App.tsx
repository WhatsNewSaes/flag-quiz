import { useState, useEffect, useLayoutEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { CelebrationTest } from './components/CelebrationTest';
import { Onboarding } from './components/Onboarding';
import { AchievementToast } from './components/journey/AchievementToast';
import { HomePage } from './pages/HomePage';
import { SiteLayout } from './layouts/SiteLayout';
import { GameProvider, useGameContext } from './contexts/GameContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CONTENT_SLUGS } from './data/contentSlugs';

// Lazy-loaded site pages (SEO/content pages)
const CountryFlagPage = lazy(() => import('./pages/CountryFlagPage').then(m => ({ default: m.CountryFlagPage })));
const ContentPage = lazy(() => import('./pages/ContentPage').then(m => ({ default: m.ContentPage })));
const FlagsDirectoryPage = lazy(() => import('./pages/FlagsDirectoryPage').then(m => ({ default: m.FlagsDirectoryPage })));
const ContinentFlagsPage = lazy(() => import('./pages/ContinentFlagsPage').then(m => ({ default: m.ContinentFlagsPage })));
const QuizLandingPage = lazy(() => import('./pages/QuizLandingPage').then(m => ({ default: m.QuizLandingPage })));
const ContinentQuizPage = lazy(() => import('./pages/ContinentQuizPage').then(m => ({ default: m.ContinentQuizPage })));

// Lazy-loaded game routes
const JourneyScreen = lazy(() => import('./routes/JourneyScreen').then(m => ({ default: m.JourneyScreen })));
const ModesRoute = lazy(() => import('./routes/ModesRoute').then(m => ({ default: m.ModesRoute })));
const ArcadeRoute = lazy(() => import('./routes/ArcadeRoute').then(m => ({ default: m.ArcadeRoute })));
const AroundTheWorldRoute = lazy(() => import('./routes/AroundTheWorldRoute').then(m => ({ default: m.AroundTheWorldRoute })));
const JeopardyRoute = lazy(() => import('./routes/JeopardyRoute').then(m => ({ default: m.JeopardyRoute })));
const PresentationRoute = lazy(() => import('./routes/PresentationRoute').then(m => ({ default: m.PresentationRoute })));
const FlagRunnerRoute = lazy(() => import('./routes/FlagRunnerRoute').then(m => ({ default: m.FlagRunnerRoute })));
const AchievementsRoute = lazy(() => import('./routes/AchievementsRoute').then(m => ({ default: m.AchievementsRoute })));
const CharactersRoute = lazy(() => import('./routes/CharactersRoute').then(m => ({ default: m.CharactersRoute })));

// Minimal loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="font-retro text-xs text-retro-text animate-blink-arcade">LOADING...</p>
    </div>
  );
}

// Scroll to top on route change — #root is the scroll container (overflow-y: auto),
// not window, so we scroll that element directly.
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    document.getElementById('root')?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Route slug to ContentPage or CountryFlagPage
function FlagSlugRouter() {
  const { slug } = useParams<{ slug: string }>();
  if (slug && CONTENT_SLUGS.has(slug)) {
    return <ContentPage />;
  }
  return <CountryFlagPage />;
}

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
  const onNavigateToPlay = useCallback(() => {}, []);
  const onNavigateToComplete = useCallback(() => {}, []);

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
    <Suspense fallback={<LoadingFallback />}>
      <ScrollToTop />
      <Routes>
        {/* Site pages with persistent nav */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/flags" element={<FlagsDirectoryPage />} />
          <Route path="/flags/continent/:slug" element={<ContinentFlagsPage />} />
          <Route path="/flags/:slug" element={<FlagSlugRouter />} />
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
    </Suspense>
  );
}

export default App;
