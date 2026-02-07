# Product Requirements Document: World Flag Quiz

## Overview

A fun, colorful, and kid-friendly web application that helps users learn world flags through interactive quizzes. The app supports two game modes and works seamlessly on both mobile and desktop devices. The experience should feel playful and celebratory, encouraging learning through positive reinforcement.

---

## Goals

- Help users learn to identify flags from countries around the world
- Provide an engaging, **fun, kid-friendly** quiz experience
- Create moments of celebration and delight through animations and feedback
- Support progressive difficulty through continent filtering
- Deliver a responsive experience across all device sizes

---

## Design Philosophy

### Fun & Kid-Friendly
- **Bright, colorful palette**: Vibrant primary colors, playful gradients
- **Rounded, friendly UI elements**: Soft corners, approachable design (12-16px border radius)
- **Celebratory moments**: Every correct answer is a win worth celebrating
- **Encouraging feedback**: Wrong answers guide without discouraging
- **Playful typography**: Friendly, readable fonts (e.g., Nunito, Poppins, Quicksand)

### Suggested Color Palette
| Use | Color | Hex |
|-----|-------|-----|
| Primary | Bright Blue | #4A90D9 |
| Secondary | Sunny Yellow | #FFD93D |
| Success | Mint Green | #6BCB77 |
| Error | Soft Coral | #FF6B6B |
| Background | Light Cream | #FFF9E6 |
| Text | Charcoal | #2D3436 |
| Accent | Playful Purple | #A855F7 |

---

## Target Platforms

- **Desktop**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile**: iOS Safari, Android Chrome (responsive web, not native)

---

## Game Modes

### Mode 1: Multiple Choice Quiz

**Description**: Users are shown a flag and must select the correct country from multiple options.

**User Flow**:
1. A random country flag (emoji) is displayed prominently
2. Four country name options are shown as buttons
3. User taps/clicks an answer:
   - **Correct**: Brief success indicator, automatically advance to next flag
   - **Incorrect**: Selected answer turns red, user must continue selecting until correct
4. Process repeats with a new random flag

**Requirements**:
- Display flag emoji at large, readable size
- Show 4 answer options (1 correct, 3 random incorrect)
- Incorrect options should be plausible (prefer same continent)
- Track current streak (no penalty for wrong answers)
- Celebration animation on correct answer
- Prevent repeat flags within the same session (until all flags shown)

---

### Mode 2: Type-Ahead Quiz

**Description**: Users are shown a flag and must type the country name using an autocomplete input.

**User Flow**:
1. A random country flag (emoji) is displayed prominently
2. An empty text input is shown below the flag
3. As user types, a dropdown shows filtered country options
4. User selects a country from dropdown or presses Enter
5. Answer is evaluated:
   - **Correct**: Success indicator, advance to next flag
   - **Incorrect**: Error indicator, input clears, user tries again
6. Process repeats with a new random flag

**Requirements**:
- Case-insensitive fuzzy matching or prefix matching for typeahead
- Dropdown shows filtered results as user types
- Support keyboard navigation (arrow keys, Enter)
- Mobile-friendly input with appropriate keyboard
- Handle common alternative names (e.g., "USA" → "United States")

---

## Continent Filtering

**Description**: Users can toggle continents on/off to customize quiz difficulty.

**Requirements**:
- Toggle switches for each continent:
  - Africa
  - Asia
  - Europe
  - North America
  - South America
  - Oceania
- At least one continent must remain selected
- Settings persist across sessions (localStorage)
- Quiz only pulls flags from selected continents
- Show count of countries in current selection

---

## Data Model

### Country Object
```
{
  name: string,           // Official country name
  code: string,           // ISO 3166-1 alpha-2 code
  emoji: string,          // Flag emoji (derived from code)
  continent: string,      // Continent classification
  alternateNames: string[] // Optional aliases for matching
}
```

### Flag Emoji Generation
- Use regional indicator symbols derived from ISO country codes
- Example: US → 🇺🇸 (U+1F1FA U+1F1F8)

---

## UI/UX Requirements

### Layout
- Single-page application
- Header with mode toggle and settings access
- Main content area with flag and answer interface
- Score/progress indicator

### Responsive Design
- Mobile-first approach
- Flag scales appropriately on all screen sizes
- Touch-friendly button sizes (min 44px tap targets)
- Answer buttons stack vertically on mobile, can be grid on desktop

### Visual Feedback & Celebrations

#### Correct Answer Celebrations
- **Confetti burst**: Colorful confetti explosion on screen
- **Flag animation**: The flag does a happy bounce or spin
- **Sound effect** (optional, toggleable): Cheerful chime or "ding!"
- **Streak callouts**: Special animations for milestones (5, 10, 25, 50 streak)
- **Encouraging messages**: Random phrases like "Amazing!", "You got it!", "Flag master!"

#### Incorrect Answer Feedback
- **Gentle shake**: Wrong answer button shakes briefly
- **Color change**: Button turns red/coral (not harsh)
- **Encouraging tone**: "Try again!", "Almost!", "Keep going!"
- **No harsh sounds**: Keep it light and encouraging

#### General Animations
- Smooth transitions between flags (slide, fade, or bounce in)
- Buttons have satisfying hover/tap states
- Progress bar or streak counter animates on update
- Loading states feel playful, not clinical

### Accessibility
- Keyboard navigable
- Sufficient color contrast
- Screen reader compatible labels
- Focus indicators

---

## Technical Considerations

### Stack Recommendations
- **Framework**: React, Vue, or vanilla JS
- **Styling**: CSS modules, Tailwind, or styled-components
- **State**: Local state (useState/reactive) + localStorage for persistence
- **Data**: Static JSON file with country data (no backend required)

### Performance
- Preload all flag emojis (they're text, minimal overhead)
- No external API calls needed during gameplay
- Target < 100ms response time for all interactions

---

## Success Metrics

- User can complete a full quiz session without errors
- Responsive design works on viewports 320px - 2560px
- All 195+ countries represented with correct flags
- Typeahead returns results within 50ms of keystroke

---

## Future Enhancements (Out of Scope for V1)

- Timed mode / speed challenges
- Leaderboards / high scores
- Capital city quiz mode
- Map-based quiz mode
- Spaced repetition for difficult flags
- Share results on social media
- Progressive Web App (offline support)
- Sound effects / haptic feedback

---

## Appendix: Country Data Sources

- ISO 3166-1 country codes: https://en.wikipedia.org/wiki/ISO_3166-1
- Flag emoji mapping: Regional indicator symbols (Unicode)
- Continent classification: UN geoscheme or similar standard

---

## Decisions Made

1. **Include territories/dependencies**: Yes (Puerto Rico, Guam, etc.)
2. **Disputed territories**: TBD - handle on case-by-case basis
3. **Scoring model**: Track correct streaks only (no penalty for wrong answers)
4. **Skip option**: No - user must answer correctly to proceed
5. **Typeahead case sensitivity**: Not case-sensitive (easier for kids)

---

## Open Questions

1. How should we handle disputed territories? (Include both names? Exclude?)
