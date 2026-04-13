# Flag Arcade

**Can you name all 197 flags?** Probably not. Let's fix that.

Flag Arcade is a retro-styled flag quiz game that teaches you world flags through sheer repetition, mild frustration, and the dopamine hit of a 10x streak multiplier.

## Game Modes

| Mode | Vibe |
|------|------|
| **Journey** | Progress through worlds of increasing difficulty. Earn stars. Feel accomplished. |
| **Arcade** | Free play with all flags. Pick your continent, pick your difficulty, go. |
| **Around the World** | Race through flags from every continent in one run. |
| **Jeopardy** | See the country name, pick the flag. Backwards day. |
| **Presentation** | Big screen mode for classrooms. Finally, an educational use for your projector. |
| **Flag Runner** | A pixel-art platformer where you collect flags. Because why not. |

## Quiz by Continent

Jump straight into a continent-specific quiz at `/quiz/africa`, `/quiz/europe`, `/quiz/asia`, `/quiz/north-america`, `/quiz/south-america`, or `/quiz/oceania`. No lobby, no setup -- just flags.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with a custom retro pixel-art theme
- **React Router v7** for SPA routing
- **Capacitor** for iOS and Android builds
- **Vercel** for hosting
- **canvas-confetti** for when you get 10 in a row

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start guessing.

## Building

```bash
npm run build        # TypeScript check + Vite build + SEO page generation
npm run preview      # Preview production build locally
```

## Mobile

```bash
npm run cap:build    # Build web + sync to native platforms
npm run cap:ios      # Open in Xcode
npm run cap:android  # Open in Android Studio
```

## Project Structure

```
src/
  components/     # UI components (flag display, multiple choice, celebrations, etc.)
  data/           # Country data, flag descriptions, flag features
  hooks/          # useArcade, useQuiz, useJourneyProgress
  pages/          # SEO-friendly site pages (home, flags, quiz, continent pages)
  routes/         # Game route wrappers (arcade, jeopardy, journey, etc.)
  screens/        # Full game screen components
  contexts/       # GameContext for shared game state
  layouts/        # SiteLayout with SiteNav
  utils/          # Helpers (sounds, haptics, slugify, shuffle)
```

## License

Private project.
