/**
 * Generates src/data/flagDescriptions.ts with SEO content for every country.
 * Uses existing country + flagFeature data to create baseline descriptions.
 * Run: tsx scripts/generate-flag-descriptions.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { countries } from '../src/data/countries';
import { flagFeatures } from '../src/data/flagFeatures';

const patternDescriptions: Record<string, string> = {
  'horizontal-stripes': 'horizontal stripes',
  'vertical-stripes': 'vertical stripes',
  'diagonal': 'a diagonal design',
  'cross': 'a cross design',
  'canton': 'a canton design',
  'solid': 'a solid field design',
  'complex': 'a complex design',
};

// Capital cities for all 197 countries
const capitals: Record<string, string> = {
  DZ: 'Algiers', AO: 'Luanda', BJ: 'Porto-Novo', BW: 'Gaborone', BF: 'Ouagadougou',
  BI: 'Gitega', CM: 'Yaoundé', CV: 'Praia', CF: 'Bangui', TD: "N'Djamena",
  KM: 'Moroni', CD: 'Kinshasa', CG: 'Brazzaville', DJ: 'Djibouti', EG: 'Cairo',
  GQ: 'Malabo', ER: 'Asmara', SZ: 'Mbabane', ET: 'Addis Ababa', GA: 'Libreville',
  GM: 'Banjul', GH: 'Accra', GN: 'Conakry', GW: 'Bissau', CI: 'Yamoussoukro',
  KE: 'Nairobi', LS: 'Maseru', LR: 'Monrovia', LY: 'Tripoli', MG: 'Antananarivo',
  MW: 'Lilongwe', ML: 'Bamako', MR: 'Nouakchott', MU: 'Port Louis', MA: 'Rabat',
  MZ: 'Maputo', NA: 'Windhoek', NE: 'Niamey', NG: 'Abuja', RW: 'Kigali',
  ST: 'São Tomé', SN: 'Dakar', SC: 'Victoria', SL: 'Freetown', SO: 'Mogadishu',
  ZA: 'Pretoria', SS: 'Juba', SD: 'Khartoum', TZ: 'Dodoma', TG: 'Lomé',
  TN: 'Tunis', UG: 'Kampala', ZM: 'Lusaka', ZW: 'Harare',
  AF: 'Kabul', AM: 'Yerevan', AZ: 'Baku', BH: 'Manama', BD: 'Dhaka',
  BT: 'Thimphu', BN: 'Bandar Seri Begawan', KH: 'Phnom Penh', CN: 'Beijing',
  CY: 'Nicosia', GE: 'Tbilisi', IN: 'New Delhi', ID: 'Jakarta', IR: 'Tehran',
  IQ: 'Baghdad', IL: 'Jerusalem', JP: 'Tokyo', JO: 'Amman', KZ: 'Astana',
  KW: 'Kuwait City', KG: 'Bishkek', LA: 'Vientiane', LB: 'Beirut', MY: 'Kuala Lumpur',
  MV: 'Malé', MN: 'Ulaanbaatar', MM: 'Naypyidaw', NP: 'Kathmandu', KP: 'Pyongyang',
  OM: 'Muscat', PK: 'Islamabad', PS: 'Ramallah', PH: 'Manila', QA: 'Doha',
  SA: 'Riyadh', SG: 'Singapore', KR: 'Seoul', LK: 'Sri Jayawardenepura Kotte',
  SY: 'Damascus', TW: 'Taipei', TJ: 'Dushanbe', TH: 'Bangkok', TL: 'Dili',
  TR: 'Ankara', TM: 'Ashgabat', AE: 'Abu Dhabi', UZ: 'Tashkent', VN: 'Hanoi', YE: "Sana'a",
  AL: 'Tirana', AD: 'Andorra la Vella', AT: 'Vienna', BY: 'Minsk', BE: 'Brussels',
  BA: 'Sarajevo', BG: 'Sofia', HR: 'Zagreb', CZ: 'Prague', DK: 'Copenhagen',
  EE: 'Tallinn', FI: 'Helsinki', FR: 'Paris', DE: 'Berlin', GR: 'Athens',
  HU: 'Budapest', IS: 'Reykjavik', IE: 'Dublin', IT: 'Rome', XK: 'Pristina',
  LV: 'Riga', LI: 'Vaduz', LT: 'Vilnius', LU: 'Luxembourg City', MT: 'Valletta',
  MD: 'Chișinău', MC: 'Monaco', ME: 'Podgorica', NL: 'Amsterdam', MK: 'Skopje',
  NO: 'Oslo', PL: 'Warsaw', PT: 'Lisbon', RO: 'Bucharest', RU: 'Moscow',
  SM: 'San Marino', RS: 'Belgrade', SK: 'Bratislava', SI: 'Ljubljana', ES: 'Madrid',
  SE: 'Stockholm', CH: 'Bern', UA: 'Kyiv', GB: 'London', VA: 'Vatican City',
  AG: "St. John's", BS: 'Nassau', BB: 'Bridgetown', BZ: 'Belmopan', CA: 'Ottawa',
  CR: 'San José', CU: 'Havana', DM: 'Roseau', DO: 'Santo Domingo', SV: 'San Salvador',
  GD: "St. George's", GT: 'Guatemala City', HT: 'Port-au-Prince', HN: 'Tegucigalpa',
  JM: 'Kingston', MX: 'Mexico City', NI: 'Managua', PA: 'Panama City',
  KN: 'Basseterre', LC: 'Castries', VC: 'Kingstown', TT: 'Port of Spain', US: 'Washington, D.C.',
  AR: 'Buenos Aires', BO: 'Sucre', BR: 'Brasília', CL: 'Santiago', CO: 'Bogotá',
  EC: 'Quito', GY: 'Georgetown', PY: 'Asunción', PE: 'Lima', SR: 'Paramaribo',
  UY: 'Montevideo', VE: 'Caracas',
  AU: 'Canberra', FJ: 'Suva', KI: 'South Tarawa', MH: 'Majuro', FM: 'Palikir',
  NR: 'Yaren', NZ: 'Wellington', PW: 'Ngerulmud', PG: 'Port Moresby', WS: 'Apia',
  SB: 'Honiara', TO: "Nuku'alofa", TV: 'Funafuti', VU: 'Port Vila',
};

// Adoption years
const adopted: Record<string, string> = {
  DZ: '1962', AO: '1975', BJ: '1959', BW: '1966', BF: '1984', BI: '1982', CM: '1975',
  CV: '1992', CF: '1958', TD: '1959', KM: '2001', CD: '2006', CG: '1958', DJ: '1977',
  EG: '1984', GQ: '1968', ER: '1993', SZ: '1968', ET: '1996', GA: '1960', GM: '1965',
  GH: '1957', GN: '1958', GW: '1973', CI: '1959', KE: '1963', LS: '2006', LR: '1847',
  LY: '2011', MG: '1958', MW: '2012', ML: '1961', MR: '2017', MU: '1968', MA: '1956',
  MZ: '1983', NA: '1990', NE: '1959', NG: '1960', RW: '2001', ST: '1975', SN: '1960',
  SC: '1996', SL: '1961', SO: '1954', ZA: '1994', SS: '2011', SD: '1970', TZ: '1964',
  TG: '1960', TN: '1831', UG: '1962', ZM: '1964', ZW: '1980',
  AF: '2021', AM: '1990', AZ: '1991', BH: '2002', BD: '1972', BT: '1969', BN: '1959',
  KH: '1993', CN: '1949', CY: '2006', GE: '2004', IN: '1947', ID: '1945', IR: '1980',
  IQ: '2008', IL: '1948', JP: '1999', JO: '1928', KZ: '1992', KW: '1961', KG: '1992',
  LA: '1975', LB: '1943', MY: '1963', MV: '1965', MN: '2011', MM: '2010', NP: '1962',
  KP: '1948', OM: '1995', PK: '1947', PS: '1964', PH: '1898', QA: '1971', SA: '1973',
  SG: '1959', KR: '1948', LK: '1972', SY: '1980', TW: '1928', TJ: '1992', TH: '1917',
  TL: '2002', TR: '1936', TM: '2001', AE: '1971', UZ: '1991', VN: '1955', YE: '1990',
  AL: '1992', AD: '1971', AT: '1230', BY: '2012', BE: '1831', BA: '1998', BG: '1879',
  HR: '1990', CZ: '1993', DK: '1625', EE: '1918', FI: '1918', FR: '1794', DE: '1949',
  GR: '1978', HU: '1957', IS: '1944', IE: '1919', IT: '1948', XK: '2008', LV: '1918',
  LI: '1937', LT: '2004', LU: '1993', MT: '1964', MD: '2010', MC: '1881', ME: '2004',
  NL: '1937', MK: '1995', NO: '1821', PL: '1919', PT: '1911', RO: '1989', RU: '1993',
  SM: '2011', RS: '2004', SK: '1993', SI: '1991', ES: '1981', SE: '1906', CH: '1841',
  UA: '1992', GB: '1801', VA: '1929',
  AG: '1981', BS: '1973', BB: '1966', BZ: '1981', CA: '1965', CR: '1906', CU: '1902',
  DM: '1990', DO: '1913', SV: '1912', GD: '1974', GT: '1871', HT: '1986', HN: '1949',
  JM: '1962', MX: '1968', NI: '1971', PA: '1925', KN: '1983', LC: '2002', VC: '1985',
  TT: '1962', US: '1960',
  AR: '1818', BO: '1851', BR: '1992', CL: '1817', CO: '1861', EC: '1900', GY: '1966',
  PY: '2013', PE: '1825', SR: '1975', UY: '1830', VE: '2006',
  AU: '1954', FJ: '1970', KI: '1979', MH: '1979', FM: '1979', NR: '1968', NZ: '1902',
  PW: '1981', PG: '1971', WS: '1949', SB: '1977', TO: '1875', TV: '1997', VU: '1980',
};

// Hand-written rich descriptions for top-searched countries
const richDescriptions: Record<string, { description: string; meaning: string; funFacts: string[] }> = {
  MX: {
    description: 'The flag of Mexico features three vertical stripes of green, white, and red with the national coat of arms centered on the white stripe. The coat of arms depicts an eagle perched on a prickly pear cactus devouring a serpent.',
    meaning: 'Green represents hope and victory, white stands for the purity of Mexican ideals, and red symbolizes the blood shed by national heroes. The coat of arms is based on an Aztec legend about the founding of Tenochtitlan.',
    funFacts: ['The Mexican flag is one of three national flags in the world that features an eagle.', 'Mexico celebrates Flag Day on February 24th, a national holiday since 1937.'],
  },
  FR: {
    description: 'The French Tricolore consists of three equal vertical bands of blue, white, and red. It is one of the most recognized flags in the world and has inspired numerous other national flags.',
    meaning: 'Blue and red are the traditional colors of Paris, while white was historically the color of the French monarchy. Together they represent liberty, equality, and fraternity.',
    funFacts: ['The French flag was adopted during the French Revolution in 1794.', 'The blue stripe was originally a darker shade; President Macron changed it back to navy blue in 2020.'],
  },
  IT: {
    description: 'The flag of Italy, known as il Tricolore, features three equal vertical stripes of green, white, and red. It was inspired by the French flag and is similar to the flags of Ireland, Mexico, and Ivory Coast.',
    meaning: 'Green symbolizes hope, white represents faith, and red stands for charity. Some interpretations link the colors to the Italian landscape: green plains, snowy Alps, and blood of wars of independence.',
    funFacts: ['The Italian tricolor was first used in 1797.', "Italy's flag is often confused with Mexico's flag, but Mexico's includes a coat of arms and has slightly different proportions."],
  },
  DE: {
    description: 'The German flag consists of three equal horizontal bands of black, red, and gold (yellow). These colors have been associated with Germany since the early 19th century.',
    meaning: 'The colors date back to the uniforms of German soldiers during the Napoleonic Wars. Black represents determination, red represents bravery, and gold represents generosity.',
    funFacts: ['The black-red-gold colors were first used by German student fraternities in 1815.', "Germany's flag was briefly replaced with a swastika flag from 1933-1945; the current design was restored in 1949."],
  },
  ES: {
    description: 'The Spanish flag features three horizontal stripes — a wide central yellow (gold) stripe flanked by narrower red stripes on top and bottom. The national coat of arms appears on the left side of the gold stripe.',
    meaning: 'The red and yellow colors were chosen by King Charles III in 1785 to be easily visible at sea. They have become synonymous with Spanish identity.',
    funFacts: ['Spain\'s flag is nicknamed "la Rojigualda" (the red and yellow).', 'The coat of arms includes the Pillars of Hercules, representing the Strait of Gibraltar.'],
  },
  CN: {
    description: 'The flag of China is red with five golden-yellow stars in the upper-left corner. One large star is accompanied by four smaller stars arranged in an arc.',
    meaning: 'Red represents the communist revolution. The large star symbolizes the Communist Party of China, while the four smaller stars represent the four social classes united under the party.',
    funFacts: ['The flag was designed by Zeng Liansong, an economist from Zhejiang, and was selected from over 3,000 entries.', 'The flag was first raised on October 1, 1949, during the founding ceremony of the People\'s Republic.'],
  },
  BR: {
    description: 'The flag of Brazil features a green field with a large yellow diamond shape in the center, containing a dark blue celestial globe with 27 white five-pointed stars and a curved white band with the national motto.',
    meaning: 'Green represents the forests of Brazil, yellow symbolizes its mineral wealth, and the blue globe with stars represents the night sky over Rio de Janeiro on November 15, 1889. The motto "Ordem e Progresso" means "Order and Progress."',
    funFacts: ['Each of the 27 stars represents a Brazilian state plus the Federal District.', "Brazil's motto comes from the positivist philosophy of Auguste Comte."],
  },
  JP: {
    description: 'The flag of Japan, known as the Nisshōki or Hinomaru, is a white rectangular banner with a crimson-red disc at its center representing the sun.',
    meaning: 'Japan is known as the "Land of the Rising Sun," and the red disc symbolizes the sun. White represents honesty and purity.',
    funFacts: ['The Hinomaru has been used as a symbol of Japan since at least the 7th century.', "Despite its long history of use, the flag wasn't officially adopted as the national flag until 1999."],
  },
  IN: {
    description: 'The flag of India features three horizontal stripes of saffron (top), white (middle), and green (bottom), with a navy blue Ashoka Chakra (24-spoke wheel) centered on the white stripe.',
    meaning: 'Saffron represents courage and sacrifice, white stands for truth and peace, and green symbolizes faith and fertility. The Ashoka Chakra represents the eternal wheel of law.',
    funFacts: ['The Indian flag must be made of khadi, a hand-spun cloth popularized by Mahatma Gandhi.', 'The Ashoka Chakra is derived from the Lion Capital of Ashoka at Sarnath.'],
  },
  US: {
    description: 'The American flag features 13 alternating red and white horizontal stripes and a blue canton with 50 white five-pointed stars arranged in nine rows.',
    meaning: 'The 13 stripes represent the original thirteen colonies. The 50 stars represent the current 50 states. Red symbolizes valor, white represents purity and innocence, and blue signifies vigilance and justice.',
    funFacts: ['The current 50-star design was created by 17-year-old Robert Heft as a school project — he received a B-.', 'There have been 27 official versions of the American flag.'],
  },
  GB: {
    description: 'The Union Jack combines the crosses of three patron saints: the red Cross of St. George (England), the white Saltire of St. Andrew (Scotland), and the red Saltire of St. Patrick (Ireland).',
    meaning: 'The flag represents the union of England, Scotland, and Northern Ireland under one sovereign state. Wales is not represented as it was already united with England when the first version was created.',
    funFacts: ['The flag is called the "Union Jack" when flown at sea, and the "Union Flag" on land, though both names are commonly used interchangeably.', 'The Union Jack is not symmetrical — it has a specific "right way up."'],
  },
  CA: {
    description: 'The Canadian flag, known as the Maple Leaf, features a red field with a white square at its center bearing a stylized 11-pointed red maple leaf.',
    meaning: 'Red and white are the national colors of Canada, proclaimed by King George V in 1921. The maple leaf has been a symbol of Canada since the 18th century.',
    funFacts: ['The maple leaf on the flag has 11 points, a design chosen through wind tunnel testing for visual clarity.', "Canada didn't have its own flag until 1965 — before that, it used a version of the British Red Ensign."],
  },
  AU: {
    description: "The Australian flag features a dark blue field with the Union Jack in the upper-left canton, a large white seven-pointed Commonwealth Star below, and the Southern Cross constellation of five stars on the right.",
    meaning: "The Union Jack reflects Australia's historical ties to Britain. The Commonwealth Star represents the federation of states and territories. The Southern Cross is visible from all of Australia's states and territories.",
    funFacts: ["Australia's flag was chosen through a public design competition in 1901 that attracted over 32,000 entries.", "The Commonwealth Star originally had six points but gained a seventh in 1908 to represent territories."],
  },
  KR: {
    description: "The South Korean flag, called Taegukgi, features a white background with a red and blue Taeguk (yin-yang symbol) at the center, surrounded by four black trigrams in each corner.",
    meaning: "White symbolizes peace and purity. The Taeguk represents the balance of the universe. The four trigrams represent heaven, earth, water, and fire.",
    funFacts: ["The trigrams on the flag come from the I Ching, an ancient Chinese text.", "South Korea's flag is one of the few national flags that incorporates philosophical symbols rather than purely national ones."],
  },
  RU: {
    description: "The Russian flag consists of three equal horizontal stripes of white, blue, and red from top to bottom. It was inspired by the Dutch flag.",
    meaning: "White represents nobility and frankness, blue represents faithfulness and honesty, and red symbolizes courage, generosity, and love.",
    funFacts: ["Peter the Great introduced the tricolor in 1696, inspired by his visit to the Netherlands.", "The flag was banned during the Soviet era (1917-1991) and replaced with the red hammer-and-sickle flag."],
  },
  TR: {
    description: "The Turkish flag features a red field with a white crescent moon and a white five-pointed star slightly to the left of center.",
    meaning: "Red has been a prominent color in Turkish flags for centuries. The crescent and star are symbols of Islam and Turkish identity dating back to the Ottoman Empire.",
    funFacts: ["The Turkish flag is one of the oldest national flag designs still in use.", "Legend says the crescent and star appeared reflected in a pool of blood after the Battle of Kosovo in 1389."],
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatColorList(colors: string[]): string {
  if (colors.length === 1) return colors[0];
  if (colors.length === 2) return `${colors[0]} and ${colors[1]}`;
  return colors.slice(0, -1).join(', ') + ', and ' + colors[colors.length - 1];
}

function generateEntry(code: string, name: string, continent: string) {
  const features = flagFeatures[code];
  const rich = richDescriptions[code];
  const capital = capitals[code] || 'N/A';
  const year = adopted[code] || 'N/A';

  if (rich) {
    return {
      description: rich.description,
      meaning: rich.meaning,
      adopted: year,
      funFacts: rich.funFacts,
      capitalCity: capital,
    };
  }

  const colorList = features ? formatColorList(features.colors) : 'various colors';
  const pattern = features ? patternDescriptions[features.pattern] || features.pattern : 'a distinctive design';

  const description = `The flag of ${name} features ${pattern} in ${colorList}. It is a distinctive symbol representing the nation located in ${continent}.`;
  const meaning = `The colors of the ${name} flag reflect the nation's history, values, and cultural identity.`;

  const funFacts = [
    `${name} is located in ${continent} with its capital at ${capital}.`,
    `The current design of the ${name} flag was adopted in ${year}.`,
  ];

  return { description, meaning, adopted: year, funFacts, capitalCity: capital };
}

// Generate the file
let output = `export interface FlagDescription {
  description: string;
  meaning: string;
  adopted: string;
  funFacts: string[];
  capitalCity: string;
}

export const flagDescriptions: Record<string, FlagDescription> = {\n`;

for (const country of countries) {
  const entry = generateEntry(country.code, country.name, country.continent);
  output += `  ${country.code}: {\n`;
  output += `    description: ${JSON.stringify(entry.description)},\n`;
  output += `    meaning: ${JSON.stringify(entry.meaning)},\n`;
  output += `    adopted: ${JSON.stringify(entry.adopted)},\n`;
  output += `    funFacts: ${JSON.stringify(entry.funFacts)},\n`;
  output += `    capitalCity: ${JSON.stringify(entry.capitalCity)},\n`;
  output += `  },\n`;
}

output += `};\n`;

const outPath = path.resolve(import.meta.dirname, '..', 'src', 'data', 'flagDescriptions.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`Wrote ${countries.length} entries to ${outPath}`);
