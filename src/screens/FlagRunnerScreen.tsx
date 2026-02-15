import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFlagRunner } from '../hooks/useFlagRunner';
import { getFlagEmoji } from '../utils/flagEmoji';
import { Celebration } from '../components/Celebration';

import abelRun0 from '../images/character-abel/run-north/frame_000.png';
import abelRun1 from '../images/character-abel/run-north/frame_001.png';
import abelRun2 from '../images/character-abel/run-north/frame_002.png';
import abelRun3 from '../images/character-abel/run-north/frame_003.png';

import edenRun0 from '../images/character-eden/run-north/frame_000.png';
import edenRun1 from '../images/character-eden/run-north/frame_001.png';
import edenRun2 from '../images/character-eden/run-north/frame_002.png';
import edenRun3 from '../images/character-eden/run-north/frame_003.png';

const CHARACTER_RUN_FRAMES: Record<string, string[]> = {
  boy: [abelRun0, abelRun1, abelRun2, abelRun3],
  girl: [edenRun0, edenRun1, edenRun2, edenRun3],
  nico: [abelRun0, abelRun1, abelRun2, abelRun3],     // TODO: replace with Nico's run frames
  amara: [edenRun0, edenRun1, edenRun2, edenRun3],    // TODO: replace with Amara's run frames
};
const RUN_FRAME_DURATION = 120;

interface FlagRunnerScreenProps {
  onBack: () => void;
}

const LANE_PERCENT = [0, 33.333, 66.666];

export function FlagRunnerScreen({ onBack }: FlagRunnerScreenProps) {
  const game = useFlagRunner();

  const runFrames = useMemo(() => {
    const stored = localStorage.getItem('selected-character')?.replace(/"/g, '') || '';
    return CHARACTER_RUN_FRAMES[stored] || CHARACTER_RUN_FRAMES.boy;
  }, []);

  const [runFrameIdx, setRunFrameIdx] = useState(0);

  useEffect(() => {
    if (game.phase !== 'playing') return;
    const interval = setInterval(() => {
      setRunFrameIdx(prev => (prev + 1) % runFrames.length);
    }, RUN_FRAME_DURATION);
    return () => clearInterval(interval);
  }, [game.phase, runFrames]);

  // Keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (game.phase === 'ready') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        game.startGame();
      }
      return;
    }
    if (game.phase === 'game-over') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        game.startGame();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        game.moveLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        game.moveRight();
        break;
    }
  }, [game, onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch/click input: tap left/center/right third of game area
  const handleGameAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (game.phase !== 'playing') return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const relX = (clientX - rect.left) / rect.width;
    if (relX < 0.333) game.movePlayer(0);
    else if (relX < 0.666) game.movePlayer(1);
    else game.movePlayer(2);
  }, [game]);

  return (
    <div className="h-[100dvh] bg-retro-bg flex flex-col items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      <div className="max-w-sm w-full flex flex-col gap-2">
        {/* HUD */}
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-xl ${i < game.lives ? 'opacity-100' : 'opacity-20'}`}>
                {i < game.lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
          <div className="font-retro text-xs text-retro-text bg-retro-surface border-2 border-retro-border rounded px-2 py-1 shadow-pixel-sm">
            LV {game.level}
          </div>
          <div className="font-retro text-sm text-retro-text">
            {String(game.score).padStart(6, '0')}
          </div>
        </div>

        {/* Country prompt */}
        {game.phase === 'playing' && game.currentCountry && (
          <div className="retro-window">
            <div className="retro-window-title bg-emerald-500 text-white text-center text-[10px]">
              FIND THE FLAG OF
            </div>
            <div className="retro-window-body py-2 text-center">
              <span className="font-retro text-sm text-retro-text leading-relaxed">
                {game.currentCountry.name}
              </span>
            </div>
          </div>
        )}

        {/* Combo indicator */}
        {game.phase === 'playing' && game.combo > 1 && (
          <div className="text-center font-retro text-xs text-retro-neon-green animate-bounce">
            {game.combo}x COMBO!
          </div>
        )}

        {/* Game area */}
        <div
          className="relative w-full overflow-hidden rounded-lg border-4 border-retro-border shadow-pixel-lg bg-gray-700"
          style={{ aspectRatio: '3/5', maxHeight: 'calc(100dvh - 11rem)' }}
          onClick={handleGameAreaClick}
          onTouchStart={handleGameAreaClick}
        >
          {/* Road surface */}
          <div className="absolute inset-0 bg-gray-600" />

          {/* Lane dividers */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-yellow-400 opacity-60"
            style={{ left: '33.333%', backgroundImage: 'repeating-linear-gradient(to bottom, #FACC15 0px, #FACC15 20px, transparent 20px, transparent 40px)', animation: 'roadScroll 0.8s linear infinite' }}
          />
          <div
            className="absolute top-0 bottom-0 w-1 bg-yellow-400 opacity-60"
            style={{ left: '66.666%', backgroundImage: 'repeating-linear-gradient(to bottom, #FACC15 0px, #FACC15 20px, transparent 20px, transparent 40px)', animation: 'roadScroll 0.8s linear infinite' }}
          />

          {/* Road edge lines */}
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-white opacity-40" />
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-white opacity-40" />

          {/* Flag rows */}
          {game.flagRows.filter(r => !r.resolved).map(row => (
            <div
              key={row.id}
              className="absolute left-0 right-0 flex"
              style={{
                top: `${row.y}%`,
                willChange: 'transform',
              }}
            >
              {row.lanes.map((country, laneIdx) => (
                <div
                  key={laneIdx}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="text-4xl sm:text-5xl drop-shadow-lg">
                    {getFlagEmoji(country.code)}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Player */}
          <div
            className="absolute bottom-[1%] transition-all duration-150 ease-out flex items-center justify-center"
            style={{
              left: `${LANE_PERCENT[game.playerLane]}%`,
              width: '33.333%',
            }}
          >
            <img
              src={runFrames[runFrameIdx]}
              alt="Player"
              style={{ height: '10rem', imageRendering: 'pixelated' }}
            />
          </div>

          {/* Player lane highlight */}
          <div
            className="absolute bottom-0 h-[18%] transition-all duration-150 ease-out bg-white opacity-5 rounded-t"
            style={{
              left: `${LANE_PERCENT[game.playerLane]}%`,
              width: '33.333%',
            }}
          />

          {/* Start overlay */}
          {game.phase === 'ready' && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-10">
              <div className="font-retro text-xl text-white text-center leading-loose">
                FLAG<br />RUNNER
              </div>
              <div className="font-body text-sm text-gray-300 text-center px-6 leading-relaxed">
                Dodge wrong flags, collect correct ones!<br />
                Use ← → arrow keys or tap lanes.
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); game.startGame(); }}
                className="retro-btn bg-retro-neon-green text-white font-retro text-sm px-8 py-3 rounded-lg"
              >
                START
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onBack(); }}
                className="font-body text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Back to menu
              </button>
            </div>
          )}

          {/* Game Over overlay */}
          {game.phase === 'game-over' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10">
              <div className="font-retro text-lg text-retro-neon-red text-center">
                GAME OVER
              </div>
              <div className="retro-window max-w-[80%]">
                <div className="retro-window-title bg-retro-accent text-retro-text text-center text-[10px]">
                  RESULTS
                </div>
                <div className="retro-window-body text-center space-y-2">
                  <div className="font-retro text-xs text-retro-text">
                    SCORE: {String(game.score).padStart(6, '0')}
                  </div>
                  <div className="font-retro text-xs text-retro-text">
                    BEST: {String(Math.max(game.score, game.highScore)).padStart(6, '0')}
                  </div>
                  <div className="font-body text-xs text-retro-text-secondary">
                    Level {game.level}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-[70%]">
                <button
                  onClick={(e) => { e.stopPropagation(); game.startGame(); }}
                  className="retro-btn bg-retro-neon-green text-white font-retro text-xs px-6 py-2 rounded-lg w-full"
                >
                  RETRY
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onBack(); }}
                  className="retro-btn bg-retro-neon-blue text-white font-retro text-xs px-6 py-2 rounded-lg w-full"
                >
                  MENU
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint (desktop) */}
        {game.phase === 'playing' && (
          <div className="text-center font-body text-xs text-retro-text-secondary hidden sm:block">
            ← → or A/D to move &bull; Tap lanes on mobile
          </div>
        )}
      </div>

      <Celebration streak={game.combo} show={game.showCorrectFlash} />

      {/* Road scroll keyframes injected via style tag */}
      <style>{`
        @keyframes roadScroll {
          0% { background-position-y: 0px; }
          100% { background-position-y: 40px; }
        }
      `}</style>
    </div>
  );
}
