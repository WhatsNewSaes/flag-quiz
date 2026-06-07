import { useCallback, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { countries, type Country } from '../data/countries';
import { countryFacts } from '../data/countryFacts';

export type PassportCategoryKey =
  | 'population'
  | 'gdp'
  | 'land-area'
  | 'highest-point'
  | 'smallest'
  | 'neighbors'
  | 'density'
  | 'oldest'
  | 'youngest-country'
  | 'coastline';

export interface PassportCategory {
  key: PassportCategoryKey;
  title: string;
  prompt: string;
  shortLabel: string;
  direction: 'high' | 'low';
  getValue: (country: Country) => number | null;
  formatValue: (value: number) => string;
}

export interface PassportOption {
  country: Country;
  value: number;
  strength: number;
  rank: number;
  rankTotal: number;
}

export interface PassportPick extends PassportOption {
  category: PassportCategory;
  isBestAvailable: boolean;
  bestAvailable: PassportOption;
}

export interface PassportSummary {
  wins: number;
  losses: number;
  scoreLabel: string;
  averageStrength: number;
  bestPicks: number;
  draftLuck: number;
  passportGrade: string;
  luckGrade: string;
  title: string;
  challengeUrl: string;
  shareText: string;
}

type PassportPhase = 'lobby' | 'drafting' | 'summary';

interface PassportState {
  phase: PassportPhase;
  seed: string;
  seedLabel: string;
  roundIndex: number;
  options: PassportOption[];
  picks: PassportPick[];
  selectedPick: PassportPick | null;
  rerollsRemaining: number;
  spinNumber: number;
}

const COUNTRY_COUNT = countries.length;
const OPTIONS_PER_SPIN = 6;
const REROLLS_PER_RUN = 2;

function numberFormat(value: number): string {
  return Math.round(value).toLocaleString();
}

function compactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return numberFormat(value);
}

function compactMoney(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${numberFormat(value)}`;
}

function getDensity(country: Country): number | null {
  const facts = countryFacts[country.code];
  if (!facts?.population || !facts.area || facts.area <= 0) return null;
  return facts.population / facts.area;
}

export const PASSPORT_CATEGORIES: PassportCategory[] = [
  {
    key: 'population',
    title: 'Largest Population',
    shortLabel: 'Population',
    prompt: 'Pick the most populous country.',
    direction: 'high',
    getValue: (country) => countryFacts[country.code]?.population ?? null,
    formatValue: (value) => `${compactNumber(value)} people`,
  },
  {
    key: 'gdp',
    title: 'Biggest Economy',
    shortLabel: 'GDP',
    prompt: 'Pick the country with the biggest economy.',
    direction: 'high',
    getValue: (country) => countryFacts[country.code]?.gdpPpp ?? null,
    formatValue: (value) => compactMoney(value),
  },
  {
    key: 'land-area',
    title: 'Largest Area',
    shortLabel: 'Area',
    prompt: 'Pick the largest country by area.',
    direction: 'high',
    getValue: (country) => countryFacts[country.code]?.area ?? null,
    formatValue: (value) => `${numberFormat(value)} km2`,
  },
  {
    key: 'highest-point',
    title: 'Highest Peak',
    shortLabel: 'Highest',
    prompt: 'Pick the country with the highest point.',
    direction: 'high',
    getValue: (country) => countryFacts[country.code]?.highestPointMeters ?? null,
    formatValue: (value) => `${numberFormat(value)} m`,
  },
  {
    key: 'smallest',
    title: 'Smallest Country',
    shortLabel: 'Smallest',
    prompt: 'Pick the smallest country by area.',
    direction: 'low',
    getValue: (country) => countryFacts[country.code]?.area ?? null,
    formatValue: (value) => `${numberFormat(value)} km2`,
  },
  {
    key: 'neighbors',
    title: 'Most Borders',
    shortLabel: 'Neighbors',
    prompt: 'Pick the country with the most land-border neighbors.',
    direction: 'high',
    getValue: (country) => countryFacts[country.code]?.borders?.length ?? 0,
    formatValue: (value) => `${value} borders`,
  },
  {
    key: 'density',
    title: 'Most Crowded',
    shortLabel: 'Density',
    prompt: 'Pick the most crowded country.',
    direction: 'high',
    getValue: getDensity,
    formatValue: (value) => `${numberFormat(value)} people/km2`,
  },
  {
    key: 'youngest-country',
    title: 'Youngest Country',
    shortLabel: 'Youngest',
    prompt: 'Pick the most recently independent country.',
    direction: 'high',
    getValue: (country) => {
      const year = countryFacts[country.code]?.independence;
      return year ? Number(year) : null;
    },
    formatValue: (value) => `since ${Math.round(value)}`,
  },
  {
    key: 'coastline',
    title: 'Most Coastline',
    shortLabel: 'Coastline',
    prompt: 'Pick the country with the longest coastline.',
    direction: 'high',
    getValue: (country) => countryFacts[country.code]?.coastlineKm ?? null,
    formatValue: (value) => `${numberFormat(value)} km`,
  },
  {
    key: 'oldest',
    title: 'Oldest Population',
    shortLabel: 'Oldest',
    prompt: 'Pick the country with the oldest population.',
    direction: 'high',
    getValue: (country) => countryFacts[country.code]?.medianAge ?? null,
    formatValue: (value) => `${value.toFixed(1)} years`,
  },
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const rand = mulberry32(hashString(seed));
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getTodaySeed(): { seed: string; label: string } {
  const date = new Date();
  const key = date.toLocaleDateString('en-CA');
  return { seed: `daily-${key}`, label: `Daily ${key}` };
}

function getCategoryOptions(category: PassportCategory, seed: string, excludedCodes: Set<string>): PassportOption[] {
  const ranked = getRankedOptions(category);
  const available = ranked.filter((option) => !excludedCodes.has(option.country.code));
  return seededShuffle(available, seed).slice(0, OPTIONS_PER_SPIN);
}

function getRankedOptions(category: PassportCategory): PassportOption[] {
  const values = countries
    .map((country) => {
      const value = category.getValue(country);
      return value === null || !Number.isFinite(value) ? null : { country, value };
    })
    .filter((item): item is { country: Country; value: number } => item !== null);

  values.sort((a, b) => (
    category.direction === 'high' ? b.value - a.value : a.value - b.value
  ));

  const total = values.length;
  const distinctValues = [...new Set(values.map((item) => item.value))];
  const valueRank = new Map(distinctValues.map((value, index) => [value, index]));
  return values.map((item, index) => ({
    ...item,
    rank: index + 1,
    rankTotal: total,
    strength: distinctValues.length <= 1
      ? 100
      : Math.round(100 - ((valueRank.get(item.value) ?? index) / (distinctValues.length - 1)) * 100),
  }));
}

function optionGrade(strength: number): string {
  if (strength >= 97) return 'S+';
  if (strength >= 90) return 'S';
  if (strength >= 82) return 'A';
  if (strength >= 72) return 'B';
  if (strength >= 60) return 'C';
  if (strength >= 45) return 'D';
  return 'F';
}

function resultTitle(wins: number): string {
  if (wins === COUNTRY_COUNT) return 'Perfect Passport';
  if (wins >= 190) return 'World Beater';
  if (wins >= 175) return 'Global Power';
  if (wins >= 150) return 'Seasoned Traveler';
  if (wins >= 120) return 'Passport Stamped';
  return 'Tourist Mode';
}

function buildSummary(picks: PassportPick[], seed: string, seedLabel: string): PassportSummary {
  const averageStrength = Math.round(
    picks.reduce((sum, pick) => sum + pick.strength, 0) / Math.max(1, picks.length)
  );
  const bestPicks = picks.filter((pick) => pick.isBestAvailable).length;
  const draftLuck = Math.round(
    picks.reduce((sum, pick) => sum + pick.bestAvailable.strength, 0) / Math.max(1, picks.length)
  );
  const missedBest = picks.length - bestPicks;
  const losses = averageStrength >= 97 && missedBest === 0
    ? 0
    : Math.min(COUNTRY_COUNT, Math.round(Math.pow(Math.max(0, 100 - averageStrength), 1.22) / 2.35 + missedBest * 5));
  const wins = Math.max(0, COUNTRY_COUNT - losses);
  const title = resultTitle(wins);
  const passportGrade = optionGrade(averageStrength);
  const luckGrade = optionGrade(draftLuck);
  const challengeUrl = buildChallengeUrl({ wins, bestPicks, passportGrade, title, seed, seedLabel });
  const scoreLabel = `${wins}/${COUNTRY_COUNT}`;

  return {
    wins,
    losses,
    scoreLabel,
    averageStrength,
    bestPicks,
    draftLuck,
    passportGrade,
    luckGrade,
    title,
    challengeUrl,
    shareText: buildShareText({ scoreLabel, bestPicks, passportGrade, luckGrade, title, picks }),
  };
}

function getPlayUrl(): string {
  if (typeof window === 'undefined' || Capacitor.isNativePlatform()) {
    return 'https://flagarcade.com/play/perfect-passport';
  }
  return `${window.location.origin}/play/perfect-passport`;
}

function buildChallengeUrl({
  wins,
  bestPicks,
  passportGrade,
  title,
  seed,
  seedLabel,
}: {
  wins: number;
  bestPicks: number;
  passportGrade: string;
  title: string;
  seed: string;
  seedLabel: string;
}): string {
  const params = new URLSearchParams({
    challenge: '1',
    score: `${wins}/${COUNTRY_COUNT}`,
    best: String(bestPicks),
    grade: passportGrade,
    title,
    seed,
    label: seedLabel,
  });

  return `${getPlayUrl()}?${params.toString()}`;
}

function buildShareText({
  scoreLabel,
  bestPicks,
  passportGrade,
  luckGrade,
  title,
  picks,
}: {
  scoreLabel: string;
  bestPicks: number;
  passportGrade: string;
  luckGrade: string;
  title: string;
  picks: PassportPick[];
}): string {
  const roster = picks
    .slice(0, 6)
    .map((pick) => `${pick.category.shortLabel}: ${pick.country.name}`)
    .join('\n');

  return `I scored ${scoreLabel} in Perfect Passport\n${title}\n\nCan you beat my score?\n\nBest Picks: ${bestPicks}/10\nPassport Grade: ${passportGrade}\nDraft Luck: ${luckGrade}\n\n${roster}\n\nPlay now and try to beat it.`;
}

function makeInitialState(): PassportState {
  return {
    phase: 'lobby',
    seed: '',
    seedLabel: '',
    roundIndex: 0,
    options: [],
    picks: [],
    selectedPick: null,
    rerollsRemaining: REROLLS_PER_RUN,
    spinNumber: 0,
  };
}

export function usePerfectPassport() {
  const [state, setState] = useState<PassportState>(makeInitialState);

  const category = PASSPORT_CATEGORIES[state.roundIndex] ?? PASSPORT_CATEGORIES[0];
  const summary = useMemo(
    () => state.phase === 'summary' ? buildSummary(state.picks, state.seed, state.seedLabel) : null,
    [state.phase, state.picks, state.seed, state.seedLabel]
  );

  const startRun = useCallback((kind: 'daily' | 'random' = 'daily', challenge?: { seed: string; seedLabel: string }) => {
    const daily = getTodaySeed();
    const seed = challenge?.seed ?? (kind === 'daily' ? daily.seed : `free-${Date.now()}`);
    const seedLabel = challenge?.seedLabel ?? (kind === 'daily' ? daily.label : 'Free Run');
    const firstCategory = PASSPORT_CATEGORIES[0];
    const firstOptions = getCategoryOptions(firstCategory, `${seed}-0-0`, new Set());
    setState({
      phase: 'drafting',
      seed,
      seedLabel,
      roundIndex: 0,
      options: firstOptions,
      picks: [],
      selectedPick: null,
      rerollsRemaining: REROLLS_PER_RUN,
      spinNumber: 0,
    });
  }, []);

  const reset = useCallback(() => setState(makeInitialState()), []);

  const choose = useCallback((countryCode: string) => {
    setState((prev) => {
      if (prev.phase !== 'drafting' || prev.selectedPick) return prev;
      const currentCategory = PASSPORT_CATEGORIES[prev.roundIndex];
      const selected = prev.options.find((option) => option.country.code === countryCode);
      if (!selected) return prev;
      const bestAvailable = [...prev.options].sort((a, b) => b.strength - a.strength)[0];
      const bestStrength = bestAvailable.strength;
      return {
        ...prev,
        selectedPick: {
          ...selected,
          category: currentCategory,
          isBestAvailable: selected.strength === bestStrength,
          bestAvailable,
        },
      };
    });
  }, []);

  const continueRun = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedPick) return prev;
      const nextPicks = [...prev.picks, prev.selectedPick];
      const nextRound = prev.roundIndex + 1;
      if (nextRound >= PASSPORT_CATEGORIES.length) {
        return {
          ...prev,
          phase: 'summary',
          picks: nextPicks,
          selectedPick: null,
          options: [],
        };
      }
      const excludedCodes = new Set(nextPicks.map((pick) => pick.country.code));
      const nextCategory = PASSPORT_CATEGORIES[nextRound];
      const nextOptions = getCategoryOptions(nextCategory, `${prev.seed}-${nextRound}-0`, excludedCodes);
      return {
        ...prev,
        roundIndex: nextRound,
        options: nextOptions,
        picks: nextPicks,
        selectedPick: null,
        spinNumber: 0,
      };
    });
  }, []);

  const reroll = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'drafting' || prev.selectedPick || prev.rerollsRemaining <= 0) return prev;
      const excludedCodes = new Set(prev.picks.map((pick) => pick.country.code));
      const spinNumber = prev.spinNumber + 1;
      return {
        ...prev,
        options: getCategoryOptions(category, `${prev.seed}-${prev.roundIndex}-${spinNumber}`, excludedCodes),
        rerollsRemaining: prev.rerollsRemaining - 1,
        spinNumber,
      };
    });
  }, [category]);

  return {
    ...state,
    category,
    categories: PASSPORT_CATEGORIES,
    summary,
    totalRounds: PASSPORT_CATEGORIES.length,
    countryCount: COUNTRY_COUNT,
    optionGrade,
    startRun,
    reset,
    choose,
    continueRun,
    reroll,
  };
}
