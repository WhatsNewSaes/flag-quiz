import { Link } from 'react-router-dom';
import boySouth from '../images/character/boy-south.png';

export function JourneyModeCallout() {
  return (
    <aside className="max-w-md mx-auto mt-10 mb-2">
      <div className="relative bg-retro-surface border-2 border-retro-border shadow-pixel-lg overflow-hidden">
        {/* Title bar */}
        <div className="bg-retro-neon-green border-b-2 border-retro-border px-3 py-1.5 flex items-center justify-between">
          <span className="font-retro text-[10px] sm:text-xs text-white">★ NEW ADVENTURE</span>
          <span className="font-retro text-[10px] sm:text-xs text-white">★</span>
        </div>

        <div className="p-4 sm:p-5 flex items-center gap-4">
          {/* Character */}
          <img
            src={boySouth}
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Copy + CTA */}
          <div className="flex-1 min-w-0">
            <h3 className="font-retro text-xs sm:text-sm text-retro-text mb-1.5 leading-snug">
              Learn every flag in the world
            </h3>
            <p className="font-body text-xs sm:text-sm text-retro-text-secondary mb-3 leading-snug">
              Pick a hero, climb worlds, earn stars — the fun way to master all 197 flags.
            </p>
            <Link
              to="/play/journey"
              className="inline-block font-retro text-[10px] sm:text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel-sm px-3 py-1.5 sm:px-4 sm:py-2 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Start Journey Mode &rarr;
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
