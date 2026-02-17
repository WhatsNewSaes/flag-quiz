import { PresentationType } from '../hooks/usePresentation';
import { playMenuSelectSound } from '../utils/sounds';

interface PresentationTypeSelectProps {
  onSelect: (type: PresentationType) => void;
  onBack: () => void;
}

export function PresentationTypeSelect({ onSelect, onBack }: PresentationTypeSelectProps) {
  return (
    <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📖</div>
          <h1 className="text-3xl font-retro text-retro-text mb-2">Practice Mode</h1>
          <p className="text-retro-text">Study flags at your own pace</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { playMenuSelectSound(); onSelect('flag-to-name'); }}
            className="w-full retro-window text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <div className="retro-window-title bg-retro-accent text-retro-text flex items-center justify-between">
              <span>✦</span><span>Flag → Name</span><span>✦</span>
            </div>
            <div className="retro-window-body">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🏳️</div>
                <div>
                  <h2 className="text-lg font-bold text-retro-text">Flag → Name</h2>
                  <p className="text-retro-text-secondary text-base">See a flag, reveal the country name</p>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('name-to-flag'); }}
            className="w-full retro-window text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <div className="retro-window-title bg-purple-600 text-white flex items-center justify-between">
              <span>✦</span><span>Name → Flag</span><span>✦</span>
            </div>
            <div className="retro-window-body">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🌍</div>
                <div>
                  <h2 className="text-lg font-bold text-retro-text">Name → Flag</h2>
                  <p className="text-retro-text-secondary text-base">See a country name, reveal the flag</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 text-retro-text font-medium hover:text-retro-border transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
