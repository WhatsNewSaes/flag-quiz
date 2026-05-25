import { useState, useEffect, useLayoutEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useNavigationType, useParams, useLocation } from 'react-router-dom';
import { AchievementToast } from './components/journey/AchievementToast';
import { SiteLayout } from './layouts/SiteLayout';
import { GameProvider, useGameContext } from './contexts/GameContext';
import { CONTENT_SLUGS } from './data/contentSlugs';

// Devmode-only — never on the critical path for real users.
const CelebrationTest = lazy(() => import('./components/CelebrationTest').then(m => ({ default: m.CelebrationTest })));

// Lazy-loaded site pages (SEO/content pages)
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const CountryFlagPage = lazy(() => import('./pages/CountryFlagPage').then(m => ({ default: m.CountryFlagPage })));
const ContentPage = lazy(() => import('./pages/ContentPage').then(m => ({ default: m.ContentPage })));
const FlagsDirectoryPage = lazy(() => import('./pages/FlagsDirectoryPage').then(m => ({ default: m.FlagsDirectoryPage })));
const FlagsTablePage = lazy(() => import('./pages/FlagsTablePage').then(m => ({ default: m.FlagsTablePage })));
const ContinentFlagsPage = lazy(() => import('./pages/ContinentFlagsPage').then(m => ({ default: m.ContinentFlagsPage })));
const QuizLandingPage = lazy(() => import('./pages/QuizLandingPage').then(m => ({ default: m.QuizLandingPage })));
const ContinentQuizPage = lazy(() => import('./pages/ContinentQuizPage').then(m => ({ default: m.ContinentQuizPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const EmojiFlagsPage = lazy(() => import('./pages/EmojiFlagsPage').then(m => ({ default: m.EmojiFlagsPage })));
const OrganizationsPage = lazy(() => import('./pages/OrganizationsPage').then(m => ({ default: m.OrganizationsPage })));
const OrganizationPage = lazy(() => import('./pages/OrganizationPage').then(m => ({ default: m.OrganizationPage })));
const TerritoriesPage = lazy(() => import('./pages/TerritoriesPage').then(m => ({ default: m.TerritoriesPage })));
const TerritoryFlagPage = lazy(() => import('./pages/TerritoryFlagPage').then(m => ({ default: m.TerritoryFlagPage })));
const PatternsPage = lazy(() => import('./pages/PatternsPage').then(m => ({ default: m.PatternsPage })));
const ReligionPage = lazy(() => import('./pages/ReligionPage').then(m => ({ default: m.ReligionPage })));
const ReligionsIndexPage = lazy(() => import('./pages/ReligionsIndexPage').then(m => ({ default: m.ReligionsIndexPage })));

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

// Embed routes
const EmbedPage = lazy(() => import('./pages/EmbedPage').then(m => ({ default: m.EmbedPage })));
const EmbedArcadeRoute = lazy(() => import('./routes/EmbedArcadeRoute').then(m => ({ default: m.EmbedArcadeRoute })));

// Minimal loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="font-retro text-xs text-retro-text animate-blink-arcade">LOADING...</p>
    </div>
  );
}

// Scroll manager — #root is the scroll container (overflow-y: auto), not window.
// Forward nav (PUSH/REPLACE) → scroll to top. Back/forward (POP) → restore saved.
// We save the scroll continuously on scroll events so the latest position is
// always captured before the user navigates away.
function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  const positionsRef = useRef<Map<string, number>>(new Map());
  const currentKeyRef = useRef<string>(location.key);

  // Track scrolling of the #root element and save under the current key.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const onScroll = () => {
      positionsRef.current.set(currentKeyRef.current, root.scrollTop);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    currentKeyRef.current = location.key;
    if (navType === 'POP') {
      const saved = positionsRef.current.get(location.key) ?? 0;
      root.scrollTo(0, saved);
    } else {
      root.scrollTo(0, 0);
    }
  }, [location.key, navType]);

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
  'journey-map': '/play/journey',
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
  const { pendingAchievements, setPendingAchievements } = useGameContext();

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

  if (showTestPage) {
    return (
      <CelebrationTest
        onBack={() => setShowTestPage(false)}
        onNavigate={(screen) => {
          setShowTestPage(false);
          const path = SCREEN_TO_PATH[screen] || '/play/modes';
          navigate(path);
        }}
      />
    );
  }

  return (
    <>
      <main>
        <Outlet />
      </main>
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
      <ScrollManager />
      <Routes>
        {/* Site pages with persistent nav */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/flags" element={<FlagsDirectoryPage />} />
          <Route path="/flags/table" element={<FlagsTablePage />} />
          <Route path="/flags/continent/:slug" element={<ContinentFlagsPage />} />
          <Route path="/flags/emoji" element={<EmojiFlagsPage />} />
          <Route path="/flags/territories" element={<TerritoriesPage />} />
          <Route path="/flags/territories/:slug" element={<TerritoryFlagPage />} />
          <Route path="/flags/:slug" element={<FlagSlugRouter />} />
          <Route path="/quiz" element={<QuizLandingPage />} />
          <Route path="/quiz/:slug" element={<ContinentQuizPageWrapper />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/organizations/:slug" element={<OrganizationPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/religions" element={<ReligionsIndexPage />} />
          <Route path="/religions/:slug" element={<ReligionPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/embed" element={<EmbedPage />} />
        </Route>
        {/* Embed route — bare-bones, no SiteLayout, intended for iframes */}
        <Route path="/embed/arcade" element={<EmbedArcadeRoute />} />
        {/* Game routes with shared game state */}
        <Route path="/play" element={<GameLayout />}>
          <Route index element={<ModesRoute />} />
          <Route path="journey" element={<JourneyScreen />} />
          <Route path="modes" element={<ModesRoute />} />
          <Route path="arcade" element={<ArcadeRoute />} />
          <Route path="around-the-world" element={<AroundTheWorldRoute />} />
          <Route path="jeopardy" element={<JeopardyRoute />} />
          <Route path="presentation" element={<PresentationRoute />} />
          <Route path="flag-runner" element={<FlagRunnerRoute />} />
          <Route path="achievements" element={<AchievementsRoute />} />
          <Route path="characters" element={<CharactersRoute />} />
          <Route path="*" element={<Navigate to="/play/modes" replace />} />
        </Route>
        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
