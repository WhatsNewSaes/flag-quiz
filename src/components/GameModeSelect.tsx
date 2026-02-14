import { playMenuSelectSound } from '../utils/sounds';
import { AuthButton } from './AuthButton';
import ArcadeIcon from '../icons/entertainment-events-hobbies-game-machines-arcade-1--Streamline-Pixel.svg';
import Logo from '../logo/big-logo.svg';
import TrophyIcon from '../icons/interface-essential-trophy--Streamline-Pixel.svg';
import GlobeIcon from '../icons/ecology-global-warming-globe--Streamline-Pixel.svg';
import DiceIcon from '../icons/entertainment-events-hobbies-board-game-dice--Streamline-Pixel.svg';
import BookIcon from '../icons/content-files-open-book--Streamline-Pixel.svg';
import RocketIcon from '../icons/business-product-startup-2--Streamline-Pixel.svg';


export type GameMode = 'free-play' | 'campaign' | 'around-the-world' | 'jeopardy' | 'presentation';

interface GameModeSelectProps {
  onSelectMode: (mode: GameMode) => void;
  unlockedModes?: string[];
  onJourney?: () => void;
}

interface ModeConfig {
  mode: GameMode;
  icon: string;
  title: string;
  description: string;
  titleBarColor: string;
  unlockRequirement?: string;
}

const modes: ModeConfig[] = [
  {
    mode: 'free-play',
    icon: ArcadeIcon,
    title: 'Free Play',
    description: 'Practice with custom filters. Choose difficulty, continents, and quiz type.',
    titleBarColor: 'bg-retro-accent',
    unlockRequirement: 'Complete World 1 - Green Meadows to unlock',
  },
  {
    mode: 'campaign',
    icon: TrophyIcon,
    title: 'Campaign Mode',
    description: 'Progress through 5 difficulty levels, from well-known to obscure flags.',
    titleBarColor: 'bg-orange-400',
  },
  {
    mode: 'around-the-world',
    icon: GlobeIcon,
    title: 'Around the World',
    description: 'Identify highlighted countries on a world map. Fill in the globe!',
    titleBarColor: 'bg-teal-400',
    unlockRequirement: 'Complete World 4 - Rocky Mountains to unlock',
  },
  {
    mode: 'jeopardy',
    icon: DiceIcon,
    title: 'Flag Jeopardy',
    description: 'Jeopardy-style board game. Pick by continent and difficulty. Daily Doubles included!',
    titleBarColor: 'bg-retro-neon-blue',
    unlockRequirement: 'Complete World 3 - Misty Forest to unlock',
  },
  {
    mode: 'presentation',
    icon: BookIcon,
    title: 'Flashcard Mode',
    description: 'Flashcard-style study mode. Reveal flags or names at your own pace.',
    titleBarColor: 'bg-purple-400',
  },
];

export function GameModeSelect({ onSelectMode, unlockedModes, onJourney }: GameModeSelectProps) {
  function isModeUnlocked(mode: GameMode): boolean {
    if (!unlockedModes) return true;
    if (mode === 'campaign' || mode === 'presentation') return true;
    return unlockedModes.includes(mode);
  }

  return (
    <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex justify-end mb-4">
          <AuthButton />
        </div>
        <div className="text-center mb-8">
          <img src={Logo} alt="Flag Arcade" className="mx-auto w-64 sm:w-72 mb-3" />
          <p className="text-retro-text-secondary">Test your knowledge of flags from around the world!</p>
        </div>

        <div className="space-y-4">
          {/* Journey mode button */}
          {onJourney && (
            <button
              onClick={() => { playMenuSelectSound(); onJourney(); }}
              className="w-full retro-window text-left hover:brightness-105 transition-transform"
            >
              <div className="retro-window-title bg-retro-neon-green text-white flex items-center justify-between">
                <span>✦</span><span>Continue Journey</span><span>✦</span>
              </div>
              <div className="retro-window-body">
                <div className="flex items-center gap-4">
                  <img src={RocketIcon} alt="" className="w-10 h-10" />
                  <p className="font-body text-base text-retro-text leading-relaxed">
                    Progress through worlds, earn stars, and unlock achievements.
                  </p>
                </div>
              </div>
            </button>
          )}

          {modes.map(({ mode, icon, title, description, titleBarColor, unlockRequirement }) => {
            const unlocked = isModeUnlocked(mode);

            return (
              <button
                key={mode}
                onClick={() => { if (unlocked) { playMenuSelectSound(); onSelectMode(mode); } }}
                disabled={!unlocked}
                className={`w-full retro-window text-left transition-transform relative overflow-hidden ${
                  unlocked
                    ? 'hover:brightness-105'
                    : 'cursor-not-allowed grayscale-[30%]'
                }`}
              >
                {/* Diagonal lock banner */}
                {!unlocked && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-retro-text text-white text-[10px] font-retro px-6 py-0.5 transform rotate-45 translate-x-5 translate-y-2 shadow-md">
                      🔒 LOCKED
                    </div>
                  </div>
                )}
                <div className={`retro-window-title ${unlocked ? titleBarColor : 'bg-gray-400'} text-white flex items-center justify-between ${!unlocked ? 'opacity-50' : ''}`}>
                  <span>✦</span><span>{title}</span><span>✦</span>
                </div>
                <div className="retro-window-body">
                  {!unlocked && unlockRequirement && (
                    <p className="font-body text-sm text-amber-700 bg-amber-100 rounded px-2 py-0.5 mb-2 inline-flex items-center gap-1">
                      🔒 {unlockRequirement}
                    </p>
                  )}
                  <div className={`flex items-center gap-4 ${!unlocked ? 'opacity-40' : ''}`}>
                    <img
                      src={icon}
                      alt=""
                      className="w-10 h-10"
                    />
                    <p className="font-body text-base text-retro-text leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
