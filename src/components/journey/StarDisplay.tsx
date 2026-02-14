interface StarDisplayProps {
  stars: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeMap = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-3xl',
};

export function StarDisplay({ stars, maxStars = 3, size = 'md', animated = false }: StarDisplayProps) {
  return (
    <span className={`inline-flex gap-0.5 ${sizeMap[size]}`}>
      {Array.from({ length: maxStars }, (_, i) => (
        <span
          key={i}
          className={`${
            i < stars ? 'text-retro-gold opacity-100' : 'text-gray-500 opacity-50'
          } ${animated && i < stars ? 'animate-bounce-in' : ''}`}
          style={animated && i < stars ? { animationDelay: `${i * 200}ms` } : undefined}
        >
          {i < stars ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}
