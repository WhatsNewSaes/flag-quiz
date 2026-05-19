import boySouth from '../../images/character/boy-south.png';
import girlSouth from '../../images/character/girl-south.png';
import nicoSouth from '../../images/character/nico-south.png';
import amaraSouth from '../../images/character/amara-south.png';

export type HumanCharacterKey = 'boy' | 'girl' | 'nico' | 'amara';

const CHARACTERS: { key: HumanCharacterKey; name: string; img: string }[] = [
  { key: 'amara', name: 'Amara', img: amaraSouth },
  { key: 'boy', name: 'Abel', img: boySouth },
  { key: 'girl', name: 'Eden', img: girlSouth },
  { key: 'nico', name: 'Nico', img: nicoSouth },
];

interface CharacterSelectProps {
  onSelect: (key: HumanCharacterKey) => void;
  title?: string;
}

export function CharacterSelect({ onSelect, title = 'Choose Your Character' }: CharacterSelectProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl mb-3">&#x1F3AE;</div>
      <h2 className="font-retro text-center mb-6" style={{ fontSize: '1.25rem' }}>
        <span
          className="bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
          style={{ WebkitTextStroke: '1px #2D2D2D' }}
        >
          {title}
        </span>
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {CHARACTERS.map(({ key, name, img }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="w-32 sm:w-40 flex flex-col items-center focus:outline-none rounded-lg border-3 border-retro-border shadow-pixel"
            style={{ backgroundColor: '#FFF8E7', borderWidth: 3 }}
          >
            <div className="font-retro text-xs text-retro-text text-center pt-3 pb-1">{name}</div>
            <div className="flex items-center justify-center py-3 overflow-hidden">
              <img
                src={img}
                alt={name}
                className="w-24 h-24 sm:w-32 sm:h-32"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export const CHARACTER_IMAGES: Record<HumanCharacterKey, string> = {
  boy: boySouth,
  girl: girlSouth,
  nico: nicoSouth,
  amara: amaraSouth,
};
