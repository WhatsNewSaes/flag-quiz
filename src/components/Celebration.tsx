import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationProps {
  streak: number;
  show: boolean;
  hideText?: boolean;
}

type TextColor = 'gold' | 'green' | 'red' | 'blue' | 'purple';

interface EncouragingMessage {
  text: string;
  color: TextColor;
}

const encouragingMessages: EncouragingMessage[] = [
  { text: 'Nice!', color: 'green' },
  { text: 'Great job!', color: 'gold' },
  { text: 'Awesome!', color: 'red' },
  { text: 'You got it!', color: 'green' },
  { text: 'Correct!', color: 'red' },
  { text: 'Well done!', color: 'blue' },
  { text: 'Perfect!', color: 'gold' },
  { text: 'Excellent!', color: 'purple' },
  { text: 'Nailed it!', color: 'blue' },
  { text: 'Brilliant!', color: 'gold' },
  { text: 'Superb!', color: 'red' },
  { text: 'Fantastic!', color: 'purple' },
  { text: 'Way to go!', color: 'green' },
  { text: 'Crushing it!', color: 'blue' },
  { text: 'On fire!', color: 'red' },
  { text: 'Yes!', color: 'gold' },
  { text: 'Boom!', color: 'purple' },
  { text: 'Amazing!', color: 'gold' },
  { text: 'So smart!', color: 'purple' },
  { text: 'Genius!', color: 'gold' },
];

const milestoneMessages: Record<number, string> = {
  5: '5 in a row!',
  10: '10 streak! Amazing!',
  25: '25 streak! Incredible!',
  50: '50 streak! Flag Master!',
  100: '100 streak! LEGENDARY!',
};

const textColors: Record<TextColor, string> = {
  gold: 'text-retro-gold',
  green: 'text-retro-neon-green',
  red: 'text-retro-neon-red',
  blue: 'text-retro-neon-blue',
  purple: 'text-retro-neon-purple',
};

export function Celebration({ streak, show, hideText }: CelebrationProps) {
  const [message, setMessage] = useState<EncouragingMessage | null>(null);
  const [milestoneText, setMilestoneText] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;

    setVisible(true);
    setFading(false);

    // Set message
    if (milestoneMessages[streak]) {
      setMilestoneText(milestoneMessages[streak]);
      setMessage(null);
    } else {
      setMilestoneText(null);
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setMessage(randomMessage);
    }

    // Start fade out after a delay
    const fadeTimer = setTimeout(() => setFading(true), 800);
    const hideTimer = setTimeout(() => setVisible(false), 1400);

    // Fire confetti
    const isMilestone = streak in milestoneMessages;
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isMilestone) {
      // Big celebration for milestones
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          if (interval) clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    } else {
      // Regular celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 100,
      });
    }

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      if (interval) clearInterval(interval);
    };
  }, [show, streak]);

  if (!show && !visible) return null;

  const isMilestone = streak in milestoneMessages;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Message */}
      {visible && !hideText && (
        <div className="absolute inset-x-0 top-40 sm:top-44 flex justify-center">
          <div
            className={`transform animate-bounce-in pixel-border rounded-lg px-5 py-2 bg-retro-surface text-center transition-opacity duration-500 ${
              fading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <span
              className={
                isMilestone
                  ? 'font-retro text-base sm:text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent'
                  : `font-retro text-sm sm:text-base ${message ? textColors[message.color] : 'text-retro-neon-green'}`
              }
            >
              {milestoneText || message?.text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
