import { PresentationType } from '../hooks/usePresentation';

interface PresentationTypeSelectProps {
  onSelect: (type: PresentationType) => void;
  onBack: () => void;
}

export function PresentationTypeSelect({ onSelect, onBack }: PresentationTypeSelectProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📖</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Presentation Mode</h1>
          <p className="text-gray-600">Study flags at your own pace</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelect('flag-to-name')}
            className="w-full bg-white rounded-2xl shadow-lg p-5 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-300"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🏳️</div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Flag → Name</h2>
                <p className="text-gray-500 text-sm">See a flag, reveal the country name</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('name-to-flag')}
            className="w-full bg-white rounded-2xl shadow-lg p-5 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-300"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🌍</div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Name → Flag</h2>
                <p className="text-gray-500 text-sm">See a country name, reveal the flag</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 text-gray-500 font-medium hover:text-gray-700 transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
