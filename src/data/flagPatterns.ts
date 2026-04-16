import type { FlagPattern } from './flagFeatures';

export interface FlagPatternInfo {
  pattern: FlagPattern;
  name: string;
  slug: string;
  emoji: string;
  shortDescription: string;
  longDescription: string;
}

export const flagPatternInfos: FlagPatternInfo[] = [
  {
    pattern: 'horizontal-stripes',
    name: 'Horizontal Stripes',
    slug: 'horizontal-stripes',
    emoji: '☰',
    shortDescription: 'A field divided into bands of color stacked top to bottom.',
    longDescription: 'The horizontal tricolor is the single most common flag design on Earth. Its modern career began with the Dutch Statenvlag in the 1570s, was popularized across Europe by the French and Italian tricolors, and exported worldwide through revolutions and decolonization.',
  },
  {
    pattern: 'vertical-stripes',
    name: 'Vertical Stripes',
    slug: 'vertical-stripes',
    emoji: '▐░▌',
    shortDescription: 'A field divided into bands of color running pole to fly.',
    longDescription: "Vertical tricolors trace their lineage to revolutionary France's 1794 flag, which inspired Italy, Belgium, Ireland, and dozens of newly independent nations to adopt the same orientation as a marker of liberty and republican government.",
  },
  {
    pattern: 'cross',
    name: 'Crosses',
    slug: 'with-crosses',
    emoji: '✚',
    shortDescription: 'A cross overlaid on a colored field, often offset toward the hoist.',
    longDescription: 'The Nordic cross — an offset Christian cross — defines the flags of Denmark, Sweden, Norway, Finland, Iceland, and the Faroes. Other crosses appear on Switzerland, Georgia, the Union Jack, and the Greek canton.',
  },
  {
    pattern: 'diagonal',
    name: 'Diagonal Designs',
    slug: 'diagonal-designs',
    emoji: '◣',
    shortDescription: 'A field split or banded along a diagonal axis.',
    longDescription: 'Diagonal divisions appear most often in the flags of post-colonial African and Pacific nations, where the angled band suggests forward motion or the sweep of a horizon. Tanzania, the DR Congo, Trinidad and Tobago, and the Solomon Islands all use this pattern.',
  },
  {
    pattern: 'canton',
    name: 'Canton Designs',
    slug: 'canton-designs',
    emoji: '◲',
    shortDescription: 'A small rectangle in the upper-hoist corner carrying a secondary symbol.',
    longDescription: "The canton — the upper-hoist quarter of a flag — comes from heraldry. The most influential canton in the world is the U.S. flag's blue field of stars, echoed by Liberia and Malaysia. The British Union Jack still appears as a canton on Australia, New Zealand, Fiji, and Tuvalu.",
  },
  {
    pattern: 'solid',
    name: 'Solid Fields',
    slug: 'solid-designs',
    emoji: '■',
    shortDescription: 'A single uncluttered field of color, sometimes carrying a central emblem.',
    longDescription: 'Solid-field flags include some of the most instantly recognizable in the world: Japan, China, Vietnam, Switzerland, Morocco, and Saudi Arabia. The simplicity is intentional — a single color reads at any distance and resists confusion with neighboring nations.',
  },
  {
    pattern: 'complex',
    name: 'Complex Designs',
    slug: 'complex-designs',
    emoji: '✦',
    shortDescription: 'Flags whose designs do not fit a single stripe, cross, or canton convention.',
    longDescription: 'Complex flags break the conventions of stripes and crosses. South Africa folds six colors into a horizontal Y; Nepal is the only national flag that is not rectangular; Sri Lanka layers a lion, bo leaves, and bordering panels into a single composition.',
  },
];

export function findPatternBySlug(slug: string): FlagPatternInfo | undefined {
  return flagPatternInfos.find((p) => p.slug === slug);
}
