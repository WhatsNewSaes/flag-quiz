/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      minHeight: {
        screen: ['100vh /* fallback */', '100dvh'],
      },
      height: {
        screen: ['100vh /* fallback */', '100dvh'],
      },
      fontFamily: {
        retro: ['"Press Start 2P"', 'cursive'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        'retro-bg': '#7EC8E3',
        'retro-surface': '#FFF8E7',
        'retro-accent': '#FFD93D',
        'retro-gold': '#946A08',
        'retro-neon-green': '#15803D',
        'retro-neon-red': '#DC2626',
        'retro-neon-blue': '#2563EB',
        'retro-neon-orange': '#B45309',
        'retro-neon-purple': '#7C3AED',
        'retro-border': '#2D2D2D',
        'retro-text': '#2D2D2D',
        'retro-text-secondary': '#1F3A4D',
        'arcade-dark': '#0a0a1a',
        'arcade-dark-surface': '#12122a',
        'arcade-dark-card': '#1a1a3e',
        'arcade-neon-green': '#39FF14',
        'arcade-neon-magenta': '#FF2E63',
        'arcade-neon-cyan': '#00F0FF',
        'arcade-neon-yellow': '#FFE66D',
        'arcade-neon-orange': '#FF6B35',
        'arcade-neon-white': '#E8E8FF',
      },
      boxShadow: {
        'pixel-sm': '2px 2px 0px 0px #2D2D2D',
        'pixel': '4px 4px 0px 0px #2D2D2D',
        'pixel-lg': '6px 6px 0px 0px #2D2D2D',
        'neon-green': '0 0 8px #39FF14, 0 0 20px rgba(57,255,20,0.3)',
        'neon-magenta': '0 0 8px #FF2E63, 0 0 20px rgba(255,46,99,0.3)',
        'neon-cyan': '0 0 8px #00F0FF, 0 0 20px rgba(0,240,255,0.3)',
        'neon-yellow': '0 0 8px #FFE66D, 0 0 20px rgba(255,230,109,0.3)',
        'neon-orange': '0 0 8px #FF6B35, 0 0 20px rgba(255,107,53,0.3)',
        'neon-white': '0 0 8px #E8E8FF, 0 0 20px rgba(232,232,255,0.3)',
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-grow': 'pulseGrow 0.3s ease-out',
        'star-fill': 'starFill 0.4s ease-out',
        'level-unlock': 'levelUnlock 0.6s ease-out',
        'bounce-slow': 'bounceSlow 2s ease-in-out infinite',
        'node-pulse': 'nodePulse 2s ease-in-out infinite',
        'card-enter': 'cardEnter 0.4s ease-out forwards',
        'card-exit': 'cardExit 0.3s ease-in forwards',
        'fade-in': 'fadeIn 1.5s ease-in both',
        'marquee': 'marquee 30s linear infinite',
        'blink-arcade': 'blinkArcade 1.2s step-end infinite',
        'float-sparkle-1': 'floatSparkle1 6s ease-in-out infinite',
        'float-sparkle-2': 'floatSparkle2 8s ease-in-out infinite',
        'float-sparkle-3': 'floatSparkle3 7s ease-in-out infinite',
        'slide-up-fade': 'slideUpFade 0.6s ease-out both',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        nodePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.3)', opacity: '0.2' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        pulseGrow: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        starFill: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%': { transform: 'scale(1.3) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        levelUnlock: {
          '0%': { transform: 'scale(0.8)', opacity: '0', filter: 'brightness(2)' },
          '50%': { transform: 'scale(1.05)', filter: 'brightness(1.5)' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'brightness(1)' },
        },
        cardEnter: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        cardExit: {
          '0%': { transform: 'scale(1) rotate(0deg) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(0.8) rotate(-8deg) translateY(-100px)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blinkArcade: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        floatSparkle1: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.7' },
          '50%': { transform: 'translateY(-20px) scale(1.2)', opacity: '1' },
        },
        floatSparkle2: {
          '0%, 100%': { transform: 'translateY(0) scale(0.8)', opacity: '0.5' },
          '50%': { transform: 'translateY(-30px) scale(1)', opacity: '0.9' },
        },
        floatSparkle3: {
          '0%, 100%': { transform: 'translateY(0) scale(1.1)', opacity: '0.6' },
          '50%': { transform: 'translateY(-15px) scale(0.9)', opacity: '1' },
        },
        slideUpFade: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
