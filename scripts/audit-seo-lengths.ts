/**
 * Audit every generated page's SEO title and description length.
 * Mirrors the templates from src/pages/*.tsx and reports anything over 60/155 chars.
 *
 * Run: npx tsx scripts/audit-seo-lengths.ts
 */
import { countries } from '../src/data/countries';
import { territories } from '../src/data/territories';
import { religions } from '../src/data/religions';
import { getCountriesForReligion } from '../src/data/religionCountries';
import { organizations } from '../src/data/organizations';
import { organizationMembers } from '../src/data/organizationMembers';
import { pickWithinLimit, TITLE_MAX, DESCRIPTION_MAX } from '../src/utils/seo';

type Row = { url: string; title: string; desc: string };
const rows: Row[] = [];

// --- HomePage ---
rows.push({
  url: '/',
  title: 'Flag Arcade - The Ultimate World Flag Quiz Game',
  desc: 'Free retro-style flag quiz with 6 game modes. Test your knowledge of all 197 country flags — Journey, Arcade, Jeopardy, and more.',
});

// --- AboutPage ---
rows.push({
  url: '/about',
  title: 'About Us - Flag Arcade',
  desc: 'Flag Arcade is a father-and-son project built to share a love for country flags with the world. Learn flags, geography, and have fun!',
});

// --- QuizLandingPage ---
rows.push({
  url: '/quiz',
  title: 'Flag Quiz - Free Online Flag Guessing Game | Flag Arcade',
  desc: 'Free flag quiz with 6 game modes — Journey, Arcade, Jeopardy, and more. Guess flags from all 197 countries and learn world flags the fun way.',
});

// --- FlagsDirectoryPage ---
rows.push({
  url: '/flags',
  title: 'Flags of the World - All 197 Country Flags | Flag Arcade',
  desc: 'Browse all 197 country flags organized by continent. Learn colors, meanings, and fun facts — then play our free flag quiz.',
});

// --- EmojiFlagsPage ---
rows.push({
  url: '/flags/emojis',
  title: 'Flag Emojis - Copy & Paste Country Flags | Flag Arcade',
  desc: 'Copy and paste flag emojis for all 197 countries. Find any country\'s flag emoji with Unicode code points. Click to copy instantly!',
});

// --- FlagsTablePage ---
rows.push({
  url: '/flags/table',
  title: 'Flag Data Table - Compare Every Country | Flag Arcade',
  desc: 'Sortable table of every country and territory flag with population, area, capital, languages, religion, and difficulty. Compare nations side by side.',
});

// --- PatternsPage ---
rows.push({
  url: '/patterns',
  title: 'Flag Design Patterns - Stripes, Crosses & More | Flag Arcade',
  desc: 'Browse country flags by design pattern — horizontal and vertical stripes, crosses, diagonals, cantons, solid fields, and complex designs.',
});

// --- OrganizationsPage (index) ---
rows.push({
  url: '/organizations',
  title: 'International Organization Flags | Flag Arcade',
  desc: 'Explore flags and details of major international organizations including the United Nations, European Union, NATO, African Union, ASEAN, and more.',
});

// --- ReligionsIndexPage ---
rows.push({
  url: '/religions',
  title: 'World Religions - Countries & Beliefs | Flag Arcade',
  desc: 'Browse the world\'s major religions and see the countries where each is practiced — Christianity, Islam, Hinduism, Buddhism, Judaism, and more.',
});

// --- TerritoriesPage ---
rows.push({
  url: '/flags/territories',
  title: 'Dependent Territories & Non-Sovereign Flags | Flag Arcade',
  desc: `Explore flags of ${territories.length} dependent territories and non-sovereign entities including Puerto Rico, Hong Kong, Greenland, Bermuda, and more.`,
});

// --- ContinentFlagsPage ---
const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'] as const;
for (const continent of continents) {
  const continentCountries = countries.filter((c) => c.continent === continent);
  rows.push({
    url: `/flags/continent/${continent.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${continent} Flags - All ${continentCountries.length} Country Flags | Flag Arcade`,
    desc: `Explore all ${continentCountries.length} country flags of ${continent}. Learn the colors, meanings, and history — then test yourself with our flag quiz.`,
  });
}

// --- ContinentQuizPage ---
for (const continent of continents) {
  const continentCountries = countries.filter((c) => c.continent === continent);
  rows.push({
    url: `/quiz/continent/${continent.toLowerCase().replace(/\s+/g, '-')}`,
    title: `${continent} Flag Quiz - Guess All ${continentCountries.length} Flags | Flag Arcade`,
    desc: `Can you identify all ${continentCountries.length} flags from ${continent}? Take the free ${continent.toLowerCase()} flag quiz and test your knowledge!`,
  });
}

// --- CountryFlagPage ---
for (const country of countries) {
  const title = pickWithinLimit([
    `${country.name} Flag - Colors, Meaning & History | Flag Arcade`,
    `${country.name} Flag - Meaning & History | Flag Arcade`,
    `${country.name} Flag | Flag Arcade`,
  ], TITLE_MAX);
  rows.push({
    url: `/flags/${country.name.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    desc: `Learn about the flag of ${country.name} — colors, meaning, and history. Then test your knowledge in our free flag quiz.`,
  });
}

// --- TerritoryFlagPage ---
for (const territory of territories) {
  const title = pickWithinLimit([
    `${territory.name} Flag - ${territory.sovereignName} Territory | Flag Arcade`,
    `${territory.name} Flag - ${territory.sovereignName} | Flag Arcade`,
    `${territory.name} Flag | Flag Arcade`,
  ], TITLE_MAX);
  rows.push({
    url: `/flags/territories/${territory.name.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    desc: `Flag of ${territory.name}, a ${territory.sovereignName} territory in ${territory.continent}. See colors, meaning, and history.`,
  });
}

// --- ReligionPage ---
for (const religion of religions) {
  const adherents = getCountriesForReligion(religion);
  rows.push({
    url: `/religions/${religion.slug}`,
    title: `${religion.name} - Countries & Beliefs | Flag Arcade`,
    desc: `Learn about ${religion.name} and see the flags of the ${adherents.length} countries where it's practiced, ranked by share of population.`,
  });
}

// --- OrganizationPage ---
for (const org of organizations) {
  const members = (organizationMembers[org.slug] || []).length;
  const title = pickWithinLimit([
    `${org.name} (${org.abbreviation}) - Member Flags & Info | Flag Arcade`,
    `${org.name} (${org.abbreviation}) - Member Flags | Flag Arcade`,
    `${org.abbreviation} Member Flags & Info | Flag Arcade`,
    `${org.abbreviation} Member Flags | Flag Arcade`,
  ], TITLE_MAX);
  const desc = pickWithinLimit([
    `Flags of all ${members} ${org.abbreviation} (${org.name}) member countries, with details on each nation's flag and membership.`,
    `Flags of all ${members} ${org.abbreviation} member countries — ${org.name}. See each nation's flag and details.`,
    `Flags of all ${members} ${org.abbreviation} member countries. See each nation's flag and details.`,
  ], DESCRIPTION_MAX);
  rows.push({ url: `/organizations/${org.slug}`, title, desc });
}

// --- ContentPage ---
const contentPages: Array<[string, string, string]> = [
  // colorPages
  ['/flags/with-red', 'Flags with Red - Country Flags | Flag Arcade', 'Browse all country flags that feature the color red. See which nations use red in their flag and learn why.'],
  ['/flags/with-blue', 'Flags with Blue - Country Flags | Flag Arcade', 'Browse all country flags that feature the color blue. See which nations use blue in their flag and learn why.'],
  ['/flags/with-green', 'Flags with Green - Country Flags | Flag Arcade', 'Browse all country flags that feature the color green. See which nations use green in their flag and learn why.'],
  ['/flags/with-yellow', 'Flags with Yellow - Country Flags | Flag Arcade', 'Browse all country flags that feature the color yellow. See which nations use yellow in their flag and learn why.'],
  ['/flags/with-white', 'Flags with White - Country Flags | Flag Arcade', 'Browse all country flags that feature the color white. See which nations use white in their flag and learn why.'],
  ['/flags/with-black', 'Flags with Black - Country Flags | Flag Arcade', 'Browse all country flags that feature the color black. See which nations use black in their flag and learn why.'],
  ['/flags/with-orange', 'Flags with Orange - Country Flags | Flag Arcade', 'Browse all country flags that feature the color orange. See which nations use orange in their flag and learn why.'],
  // patternPages
  ['/flags/horizontal-stripes', 'Flags with Horizontal Stripes - Designs | Flag Arcade', 'Browse all country flags featuring horizontal stripes in their design. Compare flags that share similar patterns.'],
  ['/flags/vertical-stripes', 'Flags with Vertical Stripes - Designs | Flag Arcade', 'Browse all country flags featuring vertical stripes in their design. Compare flags that share similar patterns.'],
  ['/flags/with-crosses', 'Flags with Crosses - Designs | Flag Arcade', 'Browse all country flags featuring crosses in their design. Compare flags that share similar patterns.'],
  ['/flags/diagonal-designs', 'Flags with Diagonal Designs - Designs | Flag Arcade', 'Browse all country flags featuring diagonal designs in their design. Compare flags that share similar patterns.'],
  ['/flags/canton-designs', 'Flags with Canton Designs - Designs | Flag Arcade', 'Browse all country flags featuring canton designs in their design. Compare flags that share similar patterns.'],
  ['/flags/solid-designs', 'Flags with Solid Fields - Designs | Flag Arcade', 'Browse all country flags featuring solid fields in their design. Compare flags that share similar patterns.'],
  ['/flags/complex-designs', 'Flags with Complex Designs - Designs | Flag Arcade', 'Browse all country flags featuring complex designs in their design. Compare flags that share similar patterns.'],
  // comboPages
  ['/flags/red-white-and-blue-flags', 'Red, White, and Blue Flags — Countries List | Flag Arcade', 'Which countries have red, white, and blue flags? Browse all flags featuring this popular color combination and learn what the colors represent.'],
  ['/flags/green-white-and-red-flags', 'Green, White, and Red Flags — Countries List | Flag Arcade', 'Which countries have green, white, and red flags? See all national flags with this color combination — from Italy and Mexico to Hungary and Iran.'],
  ['/flags/red-and-white-flags', 'Red and White Flags - Countries List | Flag Arcade', 'Browse all country flags featuring red and white. From Japan and Canada to Turkey and Switzerland — see every red and white flag in the world.'],
  ['/flags/red-yellow-and-green-flags', 'Red, Yellow, and Green Flags — Countries List | Flag Arcade', 'Which countries have red, yellow, and green flags? These Pan-African colors appear on flags across Africa and beyond. See the full list.'],
  ['/flags/blue-and-white-flags', 'Blue and White Flags - Countries List | Flag Arcade', 'Browse all country flags featuring blue and white. From Greece and Finland to Argentina and Israel — see every blue and white flag.'],
  ['/flags/blue-and-yellow-flags', 'Blue and Yellow Flags - Countries List | Flag Arcade', 'Which countries have blue and yellow flags? From Ukraine and Sweden to Palau and Kazakhstan — browse all blue and yellow national flags.'],
  ['/flags/orange-white-and-green-flags', 'Orange, White, Green Flags - Countries | Flag Arcade', 'Which countries have orange, white, and green flags? See all national flags featuring this color combination, including Ireland and India.'],
  ['/flags/black-red-and-yellow-flags', 'Black, Red, and Yellow Flags — Countries List | Flag Arcade', 'Which countries have black, red, and yellow flags? From Germany and Belgium to Uganda and Angola — see all flags with this color combo.'],
  ['/flags/red-white-and-black-flags', 'Red, White, and Black Flags — Countries List | Flag Arcade', 'Which countries have red, white, and black flags? Browse all national flags featuring this Pan-Arab color combination.'],
  ['/flags/green-and-white-flags', 'Green and White Flags - Countries List | Flag Arcade', 'Browse all country flags featuring green and white. From Nigeria and Pakistan to Saudi Arabia — see every green and white national flag.'],
  ['/flags/red-and-yellow-flags', 'Red and Yellow Flags - Countries List | Flag Arcade', 'Which countries have red and yellow flags? From China and Spain to Vietnam and Macedonia — browse all red and yellow national flags.'],
  ['/flags/red-black-white-and-green-flags', 'Red, Black, White, Green Flags - Countries | Flag Arcade', 'Which countries have red, black, white, and green flags? These four Pan-Arab colors appear together on flags across the Middle East and Africa.'],
  ['/flags/black-and-white-flags', 'Black and White Flags - Countries List | Flag Arcade', 'Browse all country flags featuring black and white. See which nations use this striking monochrome combination on their national flags.'],
  ['/flags/green-and-yellow-flags', 'Green and Yellow Flags - Countries List | Flag Arcade', 'Which countries have green and yellow flags? From Brazil and Jamaica to Senegal and Mauritania — browse all green and yellow national flags.'],
  // specialPages
  ['/flags/hardest-flags', 'Hardest Flags to Identify - Tough Quiz | Flag Arcade', "Think you know your flags? These are the hardest country flags to identify. Most players can't get them all right. See how many you know!"],
  ['/flags/easiest-flags', 'Easiest Flags to Identify - For Beginners | Flag Arcade', 'Start with the easiest flags! These are the most recognizable country flags in the world. Perfect for beginners learning world flags.'],
  ['/flags/similar-looking-flags', 'Flags That Look Alike - Similar Country Flags | Flag Arcade', 'Many country flags look surprisingly similar! Explore flags that share the same colors and patterns. Can you tell them apart?'],
];
for (const [url, title, desc] of contentPages) {
  rows.push({ url, title, desc });
}

// --- Report ---
const titleOverflows = rows.filter((r) => r.title.length > TITLE_MAX);
const descOverflows = rows.filter((r) => r.desc.length > DESCRIPTION_MAX);

console.log(`\nTotal pages audited: ${rows.length}`);
console.log(`Title overflows (>${TITLE_MAX}): ${titleOverflows.length}`);
console.log(`Description overflows (>${DESCRIPTION_MAX}): ${descOverflows.length}\n`);

if (titleOverflows.length > 0) {
  console.log('=== TITLE OVERFLOWS ===');
  for (const r of titleOverflows) {
    console.log(`[${r.title.length}] ${r.url}`);
    console.log(`    ${r.title}`);
  }
}

if (descOverflows.length > 0) {
  console.log('\n=== DESCRIPTION OVERFLOWS ===');
  for (const r of descOverflows) {
    console.log(`[${r.desc.length}] ${r.url}`);
    console.log(`    ${r.desc}`);
  }
}

if (titleOverflows.length === 0 && descOverflows.length === 0) {
  console.log('✓ All page titles and descriptions are within SEO limits.');
}
