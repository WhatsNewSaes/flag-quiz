import { playMenuSelectSound } from '../utils/sounds';
import Logo from '../logo/big-logo.svg';
import JourneyIcon from '../images/modes/journey.png';

// Pixel art mode icons
import ArcadeIcon from '../images/modes/arcade.png';
import FlagRunnerIcon from '../images/modes/flag-runner.png';
import JeopardyIcon from '../images/modes/jeopardy.png';
import GlobeIcon from '../images/modes/around-the-world.png';
import PracticeIcon from '../images/modes/practice.png';


export type GameMode = 'arcade' | 'around-the-world' | 'jeopardy' | 'presentation' | 'flag-runner';

interface GameModeSelectProps {
  onSelectMode: (mode: GameMode) => void;
  onJourney?: () => void;
}

interface ModeConfig {
  mode: GameMode;
  icon: string;
  title: string;
  description: string;
  titleBarColor: string;
  titleTextColor?: string;
}

// Rainbow forward from green (Journey at top): G → B → V → R → O → Y
const modes: ModeConfig[] = [
  {
    mode: 'jeopardy',
    icon: JeopardyIcon,
    title: 'Flag Jeopardy',
    description: 'Jeopardy-style board game. Pick by continent and difficulty.',
    titleBarColor: 'bg-retro-neon-blue',
  },
  {
    mode: 'arcade',
    icon: ArcadeIcon,
    title: 'Arcade Mode',
    description: 'Test your flag knowledge in an arcade style multiple choice game!',
    titleBarColor: 'bg-retro-neon-purple',
  },
  {
    mode: 'flag-runner',
    icon: FlagRunnerIcon,
    title: 'Flag Runner',
    description: 'Dodge wrong flags, grab correct ones! How long can you survive?',
    titleBarColor: 'bg-retro-neon-red',
  },
  {
    mode: 'around-the-world',
    icon: GlobeIcon,
    title: 'Around the World',
    description: 'Identify highlighted countries on a world map. Fill in the globe!',
    titleBarColor: 'bg-orange-500',
  },
  {
    mode: 'presentation',
    icon: PracticeIcon,
    title: 'Practice Mode',
    description: 'Flashcard-style study mode. Reveal answers at your own pace.',
    titleBarColor: 'bg-retro-accent',
    titleTextColor: 'text-retro-text',
  },
];

export function GameModeSelect({ onSelectMode, onJourney }: GameModeSelectProps) {
  return (
    <div className="min-h-screen-nav bg-retro-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src={Logo} alt="Flag Arcade" className="mx-auto w-64 sm:w-72 mb-3" />
          <p className="font-body text-sm text-retro-text">EXPLORE THE WORLD ONE FLAG AT A TIME</p>
        </div>

        <div className="space-y-4">
          {/* Journey mode button */}
          {onJourney && (
            <button
              onClick={() => { playMenuSelectSound(); onJourney(); }}
              className="w-full retro-window text-left hover:brightness-105 transition-transform"
            >
              <div className="retro-window-title bg-retro-neon-green text-white flex items-center justify-between">
                <span>✦</span><span>Journey Mode</span><span>✦</span>
              </div>
              <div className="retro-window-body !p-2">
                <div className="flex items-center gap-2">
                  <img src={JourneyIcon} alt="" className="w-12 h-12 sm:w-14 sm:h-14" style={{ imageRendering: 'pixelated' }} />
                  <p className="font-body text-sm sm:text-base text-retro-text leading-snug sm:leading-relaxed">
                    Progress through worlds, earn stars, and unlock achievements.
                  </p>
                </div>
              </div>
            </button>
          )}

          {modes.map(({ mode, icon, title, description, titleBarColor, titleTextColor = 'text-white' }) => (
              <button
                key={mode}
                onClick={() => { playMenuSelectSound(); onSelectMode(mode); }}
                className="w-full retro-window text-left transition-transform hover:brightness-105"
              >
                <div className={`retro-window-title ${titleBarColor} ${titleTextColor} flex items-center justify-between`}>
                  <span>✦</span><span>{title}</span><span>✦</span>
                </div>
                <div className="retro-window-body !p-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={icon}
                      alt=""
                      className="w-12 h-12 sm:w-14 sm:h-14"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <p className="font-body text-sm sm:text-base text-retro-text leading-snug sm:leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
