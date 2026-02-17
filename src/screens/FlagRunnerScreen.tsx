import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFlagRunner } from '../hooks/useFlagRunner';
import { getFlagEmoji } from '../utils/flagEmoji';
import { Celebration } from '../components/Celebration';
import { ContinentFilter } from '../components/ContinentFilter';
import { Difficulty, difficultyLabels } from '../data/countries';

import abelRun0 from '../images/character-abel/run-north/frame_000.png';
import abelRun1 from '../images/character-abel/run-north/frame_001.png';
import abelRun2 from '../images/character-abel/run-north/frame_002.png';
import abelRun3 from '../images/character-abel/run-north/frame_003.png';

import edenRun0 from '../images/character-eden/run-north/frame_000.png';
import edenRun1 from '../images/character-eden/run-north/frame_001.png';
import edenRun2 from '../images/character-eden/run-north/frame_002.png';
import edenRun3 from '../images/character-eden/run-north/frame_003.png';

import nicoRun0 from '../images/character-nico/run-north/frame_000.png';
import nicoRun1 from '../images/character-nico/run-north/frame_001.png';
import nicoRun2 from '../images/character-nico/run-north/frame_002.png';
import nicoRun3 from '../images/character-nico/run-north/frame_003.png';

import amaraRun0 from '../images/character-amara/run-north/frame_000.png';
import amaraRun1 from '../images/character-amara/run-north/frame_001.png';
import amaraRun2 from '../images/character-amara/run-north/frame_002.png';
import amaraRun3 from '../images/character-amara/run-north/frame_003.png';

import kitsuneRun0 from '../images/character-kitsune/run-north/frame_000.png';
import kitsuneRun1 from '../images/character-kitsune/run-north/frame_001.png';
import kitsuneRun2 from '../images/character-kitsune/run-north/frame_002.png';
import kitsuneRun3 from '../images/character-kitsune/run-north/frame_003.png';

import krakenRun0 from '../images/character-kraken/run-north/frame_000.png';
import krakenRun1 from '../images/character-kraken/run-north/frame_001.png';
import krakenRun2 from '../images/character-kraken/run-north/frame_002.png';
import krakenRun3 from '../images/character-kraken/run-north/frame_003.png';

import dragonRun0 from '../images/character-dragon/run-north/frame_000.png';
import dragonRun1 from '../images/character-dragon/run-north/frame_001.png';
import dragonRun2 from '../images/character-dragon/run-north/frame_002.png';
import dragonRun3 from '../images/character-dragon/run-north/frame_003.png';

import eagleRun0 from '../images/character-eagle/run-north/frame_000.png';
import eagleRun1 from '../images/character-eagle/run-north/frame_001.png';
import eagleRun2 from '../images/character-eagle/run-north/frame_002.png';
import eagleRun3 from '../images/character-eagle/run-north/frame_003.png';

import phoenixRun0 from '../images/character-phoenix/run-north/frame_000.png';
import phoenixRun1 from '../images/character-phoenix/run-north/frame_001.png';
import phoenixRun2 from '../images/character-phoenix/run-north/frame_002.png';
import phoenixRun3 from '../images/character-phoenix/run-north/frame_003.png';

const CHARACTER_RUN_FRAMES: Record<string, string[]> = {
  boy: [abelRun0, abelRun1, abelRun2, abelRun3],
  girl: [edenRun0, edenRun1, edenRun2, edenRun3],
  nico: [nicoRun0, nicoRun1, nicoRun2, nicoRun3],
  amara: [amaraRun0, amaraRun1, amaraRun2, amaraRun3],
  kitsune: [kitsuneRun0, kitsuneRun1, kitsuneRun2, kitsuneRun3],
  kraken: [krakenRun0, krakenRun1, krakenRun2, krakenRun3],
  dragon: [dragonRun0, dragonRun1, dragonRun2, dragonRun3],
  eagle: [eagleRun0, eagleRun1, eagleRun2, eagleRun3],
  phoenix: [phoenixRun0, phoenixRun1, phoenixRun2, phoenixRun3],
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
  const [showOptions, setShowOptions] = useState(false);

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

  // --- LOBBY PHASE ---
  if (game.phase === 'ready') {
    return (
      <div className="bg-retro-bg flex flex-col px-4 pb-4 pt-3" style={{ minHeight: 'calc(100dvh - 52px)' }}>
        <button
          onClick={onBack}
          className="self-start font-body text-sm text-retro-text-secondary hover:text-retro-text transition-colors flex items-center gap-1 mb-2"
        >
          <span>&#8592;</span> Back
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="font-retro text-lg text-retro-text mb-2">Flag Runner</h1>
              <p className="font-body text-sm text-retro-text-secondary">
                Dodge wrong flags, collect correct ones! Use arrow keys or tap lanes.
              </p>
            </div>

            {/* Flag count */}
            <div className="text-center mb-6">
              <div className="inline-block pixel-border bg-retro-surface rounded-lg px-6 py-3">
                <span className="font-retro text-sm text-retro-gold">{game.flagCount}</span>
                <span className="font-body text-sm text-retro-text ml-2">flags ready!</span>
              </div>
            </div>

            {/* Play button */}
            <button
              onClick={game.startGame}
              disabled={game.flagCount === 0}
              className="retro-btn w-full px-4 py-4 font-retro text-sm bg-retro-neon-green text-white mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Play
            </button>

            {/* Options toggle */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-surface text-retro-text mb-4"
            >
              {showOptions ? 'Hide Game Options' : 'Game Options'}
            </button>

            {/* Collapsible options */}
            {showOptions && (
              <div className="space-y-4">
                {/* Difficulty filter */}
                <div>
                  <h3 className="font-retro text-[0.6rem] text-retro-text-secondary mb-2">Difficulty</h3>
                  <div className="flex gap-2">
                    {([1, 2, 3, 4, 5] as Difficulty[]).map(level => {
                      const isEnabled = game.enabledDifficulties.includes(level);
                      return (
                        <button
                          key={level}
                          onClick={() => game.toggleDifficulty(level)}
                          className={`flex-1 rounded-full py-1.5 px-1 text-center transition-all ${
                            isEnabled
                              ? 'bg-retro-accent text-retro-text ring-2 ring-retro-gold'
                              : 'bg-white text-retro-text-secondary ring-1 ring-retro-border/20 hover:ring-retro-border/40'
                          }`}
                        >
                          <div className="text-xs font-medium truncate">
                            {difficultyLabels[level]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Continent filter */}
                <ContinentFilter
                  enabledContinents={game.enabledContinents}
                  onToggle={game.toggleContinent}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING / GAME-OVER PHASE ---
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

      <Celebration streak={game.combo} show={game.showCorrectFlash} hideText />

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
