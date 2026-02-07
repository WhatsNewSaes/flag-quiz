import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationProps {
  streak: number;
  show: boolean;
}

const encouragingMessages = [
  { text: 'Nice!', emoji: '👍' },
  { text: 'Great job!', emoji: '⭐' },
  { text: 'Awesome!', emoji: '🎉' },
  { text: 'You got it!', emoji: '✅' },
  { text: 'Correct!', emoji: '🎯' },
  { text: 'Well done!', emoji: '👏' },
  { text: 'Perfect!', emoji: '💯' },
  { text: 'Excellent!', emoji: '🌟' },
  { text: 'Nailed it!', emoji: '🔨' },
  { text: 'Brilliant!', emoji: '💡' },
  { text: 'Superb!', emoji: '🚀' },
  { text: 'Fantastic!', emoji: '✨' },
  { text: 'Way to go!', emoji: '🙌' },
  { text: 'Crushing it!', emoji: '💪' },
  { text: 'On fire!', emoji: '🔥' },
  { text: 'Yes!', emoji: '🎊' },
  { text: 'Boom!', emoji: '💥' },
  { text: 'Amazing!', emoji: '🤩' },
  { text: 'So smart!', emoji: '🧠' },
  { text: 'Genius!', emoji: '🎓' },
];

const milestoneMessages: Record<number, string> = {
  5: '5 in a row! 🔥',
  10: '10 streak! Amazing! 🎯',
  25: '25 streak! Incredible! 🏆',
  50: '50 streak! Flag Master! 👑',
  100: '100 streak! LEGENDARY! 🌟',
};

export function Celebration({ streak, show }: CelebrationProps) {
  const [message, setMessage] = useState({ text: '', emoji: '' });

  useEffect(() => {
    if (!show) return;

    // Set message
    if (milestoneMessages[streak]) {
      setMessage({ text: milestoneMessages[streak], emoji: '' });
    } else {
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setMessage(randomMessage);
    }

    // Fire confetti
    const isMilestone = streak in milestoneMessages;

    if (isMilestone) {
      // Big celebration for milestones
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
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

      return () => clearInterval(interval);
    } else {
      // Regular celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 100,
      });
    }
  }, [show, streak]);

  if (!show) return null;

  const isMilestone = streak in milestoneMessages;

  return (
    <div className="fixed inset-x-0 top-32 pointer-events-none flex justify-center z-50">
      <div
        className={`transform animate-bounce-in text-center ${
          isMilestone
            ? 'text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent'
            : 'text-2xl sm:text-3xl font-semibold text-green-600'
        }`}
      >
        {message.emoji && <span className="block text-4xl sm:text-5xl mb-1">{message.emoji}</span>}
        {message.text}
      </div>
    </div>
  );
}
