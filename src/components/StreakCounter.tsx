interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg">
      <span className="text-xl">🔥</span>
      <span
        key={streak}
        className={`text-2xl font-bold ${streak > 0 ? 'animate-pulse-grow' : ''}`}
      >
        {streak}
      </span>
    </div>
  );
}
