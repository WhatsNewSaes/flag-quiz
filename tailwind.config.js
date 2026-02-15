/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        retro: ['"Press Start 2P"', 'cursive'],
        body: ['"Space Mono"', 'monospace'],
      },
      colors: {
        'retro-bg': '#7EC8E3',
        'retro-surface': '#FFF8E7',
        'retro-accent': '#FFD93D',
        'retro-gold': '#D4960A',
        'retro-neon-green': '#16A34A',
        'retro-neon-red': '#EF4444',
        'retro-neon-blue': '#3B82F6',
        'retro-neon-orange': '#F59E0B',
        'retro-neon-purple': '#8B5CF6',
        'retro-border': '#2D2D2D',
        'retro-text': '#2D2D2D',
        'retro-text-secondary': '#555555',
      },
      boxShadow: {
        'pixel-sm': '2px 2px 0px 0px #2D2D2D',
        'pixel': '4px 4px 0px 0px #2D2D2D',
        'pixel-lg': '6px 6px 0px 0px #2D2D2D',
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
      },
    },
  },
  plugins: [],
}
