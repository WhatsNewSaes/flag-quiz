import { QuizMode } from '../hooks/useQuiz';
import { playMenuSelectSound } from '../utils/sounds';

interface CampaignQuizTypeSelectProps {
  onSelect: (quizType: QuizMode) => void;
  onBack: () => void;
}

export function CampaignQuizTypeSelect({ onSelect, onBack }: CampaignQuizTypeSelectProps) {
  return (
    <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-retro text-retro-gold mb-2">Campaign Mode</h1>
          <p className="text-retro-text-secondary">Choose how you want to play</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { playMenuSelectSound(); onSelect('multiple-choice'); }}
            className="w-full retro-window text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <div className="retro-window-title bg-retro-accent text-retro-text flex items-center justify-between">
              <span>✦</span><span>Pick the Name</span><span>✦</span>
            </div>
            <div className="retro-window-body">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🏳️</div>
                <div>
                  <h2 className="text-lg font-bold text-retro-text">Pick the Name</h2>
                  <p className="text-retro-text-secondary text-base">See a flag, pick the country name</p>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('flag-picker'); }}
            className="w-full retro-window text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <div className="retro-window-title bg-orange-400 text-white flex items-center justify-between">
              <span>✦</span><span>Pick the Flag</span><span>✦</span>
            </div>
            <div className="retro-window-body">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🌍</div>
                <div>
                  <h2 className="text-lg font-bold text-retro-text">Pick the Flag</h2>
                  <p className="text-retro-text-secondary text-base">See a country name, pick the flag</p>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('type-ahead'); }}
            className="w-full retro-window text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <div className="retro-window-title bg-teal-400 text-white flex items-center justify-between">
              <span>✦</span><span>Type Answer</span><span>✦</span>
            </div>
            <div className="retro-window-body">
              <div className="flex items-center gap-4">
                <div className="text-3xl">⌨️</div>
                <div>
                  <h2 className="text-lg font-bold text-retro-text">Type Answer</h2>
                  <p className="text-retro-text-secondary text-base">See a flag, type the country name</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 text-retro-text-secondary font-medium hover:text-retro-text transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
