import { Rank } from '../../hooks/useJourneyProgress';

interface RankBadgeProps {
  rank: Rank;
}

const rankConfig: Record<Rank, { emoji: string; color: string }> = {
  'Novice': { emoji: '🌱', color: 'text-green-600' },
  'Explorer': { emoji: '🧭', color: 'text-blue-600' },
  'Cartographer': { emoji: '🗺️', color: 'text-purple-600' },
  'Diplomat': { emoji: '🎖️', color: 'text-yellow-600' },
  'Ambassador': { emoji: '🏅', color: 'text-orange-600' },
  'World Leader': { emoji: '👑', color: 'text-retro-gold' },
};

export function RankBadge({ rank }: RankBadgeProps) {
  const config = rankConfig[rank];

  return (
    <span className={`inline-flex items-center gap-1 font-retro text-xs px-2 py-1 rounded bg-retro-surface/80 border border-retro-border/30 ${config.color}`}>
      <span>{config.emoji}</span>
      <span>{rank}</span>
    </span>
  );
}
