export type CharacterKey =
  | 'boy'
  | 'girl'
  | 'nico'
  | 'amara'
  | 'kitsune'
  | 'kraken'
  | 'dragon'
  | 'eagle'
  | 'phoenix';

export interface CharacterDef {
  key: CharacterKey;
  name: string;
  kind: 'human' | 'creature';
  /** null = always available, 0-4 = unlocked by completing that region */
  unlockRegion: number | null;
  storyText: string;
  emoji: string;
}

export const CHARACTERS: CharacterDef[] = [
  { key: 'amara', name: 'Amara', kind: 'human', unlockRegion: null, storyText: '', emoji: '' },
  { key: 'boy', name: 'Abel', kind: 'human', unlockRegion: null, storyText: '', emoji: '' },
  { key: 'girl', name: 'Eden', kind: 'human', unlockRegion: null, storyText: '', emoji: '' },
  { key: 'nico', name: 'Nico', kind: 'human', unlockRegion: null, storyText: '', emoji: '' },
  { key: 'kitsune', name: 'Kitsune', kind: 'creature', unlockRegion: 0, storyText: 'Fox spirit guides you to Sandy Shores', emoji: '' },
  { key: 'kraken', name: 'Kraken', kind: 'creature', unlockRegion: 1, storyText: 'Sea creature carries you to Misty Forest', emoji: '' },
  { key: 'dragon', name: 'Dragon', kind: 'creature', unlockRegion: 2, storyText: 'Dragon flies you up Rocky Mountains', emoji: '' },
  { key: 'eagle', name: 'Eagle', kind: 'creature', unlockRegion: 3, storyText: 'Eagle soars with you to Volcanic Peak', emoji: '' },
  { key: 'phoenix', name: 'Phoenix', kind: 'creature', unlockRegion: 4, storyText: 'Phoenix rises as ultimate companion', emoji: '' },
];

export const CHARACTER_MAP: Record<CharacterKey, CharacterDef> =
  Object.fromEntries(CHARACTERS.map(c => [c.key, c])) as Record<CharacterKey, CharacterDef>;

export function getCreatureForRegion(regionIndex: number): CharacterDef | undefined {
  return CHARACTERS.find(c => c.kind === 'creature' && c.unlockRegion === regionIndex);
}
