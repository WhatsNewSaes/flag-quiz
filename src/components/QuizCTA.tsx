import { Link } from 'react-router-dom';

interface QuizCTAProps {
  countryName?: string;
  heading?: string;
  message?: string;
  linkTo?: string;
  buttonLabel?: string;
}

export function QuizCTA({ countryName, heading: headingProp, message, linkTo = '/play', buttonLabel = 'Play Flag Quiz' }: QuizCTAProps) {
  const heading = headingProp || (countryName
    ? `Can you spot the flag of ${countryName}?`
    : 'Can You Identify These Flags?');
  const subtitle = message
    || (countryName
      ? `Put your flag knowledge to the test — ${countryName} and 196 other countries are waiting!`
      : 'Test your knowledge of flags from 197 countries across 6 game modes!');

  return (
    <section className="relative mt-6 overflow-hidden border-2 border-retro-border shadow-pixel-lg">
      {/* Animated pixel background */}
      <div className="absolute inset-0 bg-gradient-to-br from-retro-accent via-amber-300 to-orange-400" />

      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Floating pixel stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '8%', top: '18%', delay: '0s', size: 'text-lg' },
          { left: '85%', top: '12%', delay: '0.8s', size: 'text-xl' },
          { left: '15%', top: '72%', delay: '1.6s', size: 'text-sm' },
          { left: '78%', top: '68%', delay: '0.4s', size: 'text-lg' },
          { left: '50%', top: '8%', delay: '1.2s', size: 'text-sm' },
          { left: '92%', top: '45%', delay: '2s', size: 'text-xs' },
          { left: '3%', top: '45%', delay: '1.8s', size: 'text-xs' },
        ].map((star, i) => (
          <span
            key={i}
            className={`absolute ${star.size} animate-pulse select-none`}
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              animationDuration: '2s',
            }}
          >
            ✦
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-8 text-center">
        {/* Decorative top pixel bar */}
        <div className="mx-auto mb-5 flex items-center justify-center gap-1.5">
          {['bg-retro-neon-green', 'bg-red-500', 'bg-blue-500', 'bg-retro-neon-green', 'bg-red-500'].map((color, i) => (
            <span
              key={i}
              className={`inline-block h-2 w-2 ${color} border border-retro-border`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <div className="mb-1 font-retro text-[10px] uppercase tracking-widest text-retro-border/60">
          Flag Arcade
        </div>

        <h2 className="font-retro text-sm md:text-base text-retro-text mb-3 leading-relaxed">
          {heading}
        </h2>

        <p className="font-body text-sm text-retro-text/80 mb-6 max-w-md mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* Animated button */}
        <Link
          to={linkTo}
          className="group relative inline-block"
        >
          {/* Button shadow (pixel effect) */}
          <span className="absolute inset-0 translate-x-1 translate-y-1 bg-retro-border transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          {/* Button face */}
          <span className="relative flex items-center gap-2 bg-retro-neon-green border-2 border-retro-border px-7 py-3 font-retro text-xs text-white transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5">
            <span className="inline-block animate-bounce" style={{ animationDuration: '2s' }}>🎮</span>
            {buttonLabel}
            <span className="inline-block animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.3s' }}>🏆</span>
          </span>
        </Link>

        {/* Stats bar */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] font-body text-retro-text/60">
          <span>🌍 197 Countries</span>
          <span className="text-retro-border/30">|</span>
          <span>🕹️ 6 Game Modes</span>
          <span className="text-retro-border/30">|</span>
          <span>🆓 100% Free</span>
        </div>
      </div>
    </section>
  );
}
