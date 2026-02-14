import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

// Pixel SVG icon imports
import IconHandLike from '../icons/hand-like--Streamline-Pixel.svg';
import IconRatingStar1 from '../icons/social-rewards-rating-star-1--Streamline-Pixel.svg';
import IconRewardGift from '../icons/social-rewards-reward-gift--Streamline-Pixel.svg';
import IconProductCheck from '../icons/business-product-check--Streamline-Pixel.svg';
import IconProductTarget from '../icons/business-product-target--Streamline-Pixel.svg';
import IconDealHandshake from '../icons/business-products-deal-handshake--Streamline-Pixel.svg';
import IconLoading100 from '../icons/interface-essential-loading-100-percent-1--Streamline-Pixel.svg';
import IconRatingStar2 from '../icons/social-rewards-rating-star-2--Streamline-Pixel.svg';
import IconWrench from '../icons/interface-essential-wrench-1--Streamline-Pixel.svg';
import IconLightBulb from '../icons/interface-essential-light-bulb--Streamline-Pixel.svg';
import IconStartup from '../icons/business-product-startup-2--Streamline-Pixel.svg';
import IconWandStar from '../icons/photography-retouch-wand-star--Streamline-Pixel.svg';
import IconLikeCircle from '../icons/social-rewards-like-circle--Streamline-Pixel.svg';
import IconCertifiedRibbon from '../icons/social-rewards-certified-ribbon--Streamline-Pixel.svg';
import IconHotFlame from '../icons/social-rewards-trends-hot-flame--Streamline-Pixel.svg';
import IconDiploma from '../icons/social-rewards-certified-diploma--Streamline-Pixel.svg';
import IconLikeBubble from '../icons/social-rewards-like-bubble--Streamline-Pixel.svg';
import IconCrown from '../icons/interface-essential-crown--Streamline-Pixel.svg';
import IconBrain from '../icons/health-brain-1--Streamline-Pixel.svg';
import IconTrophy from '../icons/interface-essential-trophy--Streamline-Pixel.svg';

interface CelebrationProps {
  streak: number;
  show: boolean;
}

// CSS filter strings to colorize the black SVG icons
const iconColors = {
  gold: 'invert(67%) sepia(62%) saturate(588%) hue-rotate(6deg) brightness(96%) contrast(92%)',       // #D4960A gold
  green: 'invert(50%) sepia(98%) saturate(430%) hue-rotate(100deg) brightness(92%) contrast(90%)',    // #16A34A green
  red: 'invert(40%) sepia(89%) saturate(2000%) hue-rotate(343deg) brightness(97%) contrast(93%)',     // #EF4444 red
  blue: 'invert(42%) sepia(98%) saturate(1200%) hue-rotate(206deg) brightness(98%) contrast(96%)',    // #3B82F6 blue
  purple: 'invert(28%) sepia(60%) saturate(3000%) hue-rotate(258deg) brightness(80%) contrast(95%)',  // #7C3AED purple
} as const;

type IconColor = keyof typeof iconColors;

interface EncouragingMessage {
  text: string;
  icon: string;
  color: IconColor;
}

const encouragingMessages: EncouragingMessage[] = [
  { text: 'Nice!', icon: IconHandLike, color: 'green' },
  { text: 'Great job!', icon: IconRatingStar1, color: 'gold' },
  { text: 'Awesome!', icon: IconRewardGift, color: 'red' },
  { text: 'You got it!', icon: IconProductCheck, color: 'green' },
  { text: 'Correct!', icon: IconProductTarget, color: 'red' },
  { text: 'Well done!', icon: IconDealHandshake, color: 'blue' },
  { text: 'Perfect!', icon: IconLoading100, color: 'gold' },
  { text: 'Excellent!', icon: IconRatingStar2, color: 'purple' },
  { text: 'Nailed it!', icon: IconWrench, color: 'blue' },
  { text: 'Brilliant!', icon: IconLightBulb, color: 'gold' },
  { text: 'Superb!', icon: IconStartup, color: 'red' },
  { text: 'Fantastic!', icon: IconWandStar, color: 'purple' },
  { text: 'Way to go!', icon: IconLikeCircle, color: 'green' },
  { text: 'Crushing it!', icon: IconCertifiedRibbon, color: 'blue' },
  { text: 'On fire!', icon: IconHotFlame, color: 'red' },
  { text: 'Yes!', icon: IconDiploma, color: 'gold' },
  { text: 'Boom!', icon: IconLikeBubble, color: 'purple' },
  { text: 'Amazing!', icon: IconCrown, color: 'gold' },
  { text: 'So smart!', icon: IconBrain, color: 'purple' },
  { text: 'Genius!', icon: IconTrophy, color: 'gold' },
];

const milestoneMessages: Record<number, string> = {
  5: '5 in a row!',
  10: '10 streak! Amazing!',
  25: '25 streak! Incredible!',
  50: '50 streak! Flag Master!',
  100: '100 streak! LEGENDARY!',
};

export function Celebration({ streak, show }: CelebrationProps) {
  const [message, setMessage] = useState<EncouragingMessage | null>(null);
  const [milestoneText, setMilestoneText] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;

    // Set message
    if (milestoneMessages[streak]) {
      setMilestoneText(milestoneMessages[streak]);
      setMessage(null);
    } else {
      setMilestoneText(null);
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
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Message above the flag */}
      <div className="absolute inset-x-0 top-52 sm:top-56 flex justify-center">
        <div
          className={`transform animate-bounce-in ${
            isMilestone
              ? 'font-retro text-base sm:text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent'
              : 'font-retro text-sm sm:text-base text-retro-neon-green'
          }`}
        >
          {milestoneText || message?.text}
        </div>
      </div>
      {/* Pixel SVG icons on left and right of the flag */}
      {message && (
        <div className="absolute inset-x-0 top-72 sm:top-80 flex justify-center items-center">
          <div className="flex items-center gap-48 sm:gap-72 transform animate-bounce-in">
            <img
              src={message.icon}
              alt=""
              className="w-10 h-10 sm:w-12 sm:h-12"
              style={{ filter: iconColors[message.color] }}
            />
            <img
              src={message.icon}
              alt=""
              className="w-10 h-10 sm:w-12 sm:h-12"
              style={{ filter: iconColors[message.color] }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
