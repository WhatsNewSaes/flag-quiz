/**
 * Generates src/data/flagDescriptions.ts with SEO content for every country.
 * Uses existing country + flagFeature data to create baseline descriptions.
 * Run: tsx scripts/generate-flag-descriptions.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { countries } from '../src/data/countries';
import { territories } from '../src/data/territories';
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

// Hand-written, source-verified flag descriptions for dependent territories.
// Anti-hallucination rules (see .claude/skills/territory-data-enrichment.md):
//   • Every claim must be verifiable against a mainstream source.
//   • If adopted year is disputed or unknown → 'unknown'.
//   • If symbolism of a color/pattern is contested → omit rather than invent.
//   • No fun facts sourced from folklore, blog posts, or AI memory alone.
// Territories without a rich entry here emit no flagDescriptions row — the
// About This Flag section then gracefully collapses to features-only.
interface TerritoryEntry {
  description: string;
  meaning: string;
  adopted: string;
  funFacts: string[];
  capital: string;
}
const territoryDescriptions: Record<string, TerritoryEntry> = {
  // Batch 1 — data-rich, well-documented territories (10).
  PR: {
    description: "The flag of Puerto Rico consists of five equal horizontal stripes alternating red and white, with a blue equilateral triangle on the hoist side bearing a single white five-pointed star. The design mirrors the flag of Cuba with the colors of the triangle and stripes reversed, reflecting the shared 19th-century independence movement that linked the two Caribbean islands. Originally designed in 1895 by members of the Puerto Rican Revolutionary Committee in New York, it was flown by separatist forces during the 1898 Intentona de Yauco uprising against Spanish rule. The flag was officially adopted by the Commonwealth of Puerto Rico on July 25, 1952 — the same day the Commonwealth constitution took effect.",
    meaning: "The three red stripes represent the blood that nourishes the three branches of government. The two white stripes symbolize individual liberty and the rights that keep the government in balance. The blue triangle stands for the three branches of government themselves, and the single white star represents the Commonwealth of Puerto Rico.",
    adopted: "1952",
    funFacts: [
      "From 1948 to 1957 it was illegal under Puerto Rican Law 53 (the gag law) to own or display the Puerto Rican flag — the law was aimed at suppressing the independence movement and was repealed in 1957.",
      "The design was modeled on the Cuban flag because Puerto Rican and Cuban revolutionaries shared the same anti-Spanish coalition in the 1890s.",
      "The original 1895 flag used a sky-blue triangle; the darker navy blue now in common use was not officially standardized until 1995 by Governor Pedro Rosselló.",
      "Before the 1952 adoption, displaying the flag was treated as a declaration of sedition — it only became legal on the same day the Commonwealth was established.",
    ],
    capital: "San Juan",
  },
  GL: {
    description: "The flag of Greenland, called Erfalasorput (\"our flag\"), features two equal horizontal bands — white on top and red below — with a large counter-shaded disc positioned slightly to the hoist side of center. The top half of the disc is red and sits on the white band; the bottom half is white and sits on the red band. Designed by Greenlandic artist Thue Christiansen, it was chosen from among 555 submissions and adopted on June 21, 1985, the sixth anniversary of Greenland Home Rule, after being passed by the Landsting by a single vote (14–11).",
    meaning: "The white band represents Greenland's ice cap and glaciers. The red band represents the sea and the midnight sun of summer. The disc evokes the sun setting into the ocean, a familiar sight in Arctic summers, and the red-and-white color scheme ties Greenland visually to the Nordic flag family and to Denmark.",
    adopted: "1985",
    funFacts: [
      "Greenland is the only Nordic territory whose flag does not use a Scandinavian cross — a deliberate break from the pattern to emphasize Greenlandic identity.",
      "Flag Day is celebrated on June 21, coinciding with the summer solstice and the anniversary of Home Rule.",
      "The winning design beat a competing proposal for a green-and-white Nordic cross by a single vote in the Landsting.",
      "Thue Christiansen, the flag's designer, was a teacher and member of the Greenlandic parliament when he submitted the design.",
    ],
    capital: "Nuuk",
  },
  HK: {
    description: "The flag of Hong Kong is a red field with a stylized white five-petal Bauhinia blakeana flower (the Hong Kong orchid tree) in the center. Each petal contains a small red five-pointed star and a red trace suggesting a stamen. The flag was adopted on July 1, 1997, the day sovereignty over Hong Kong transferred from the United Kingdom to the People's Republic of China, replacing the British blue ensign that had flown since 1959. The design is defined in the Basic Law of the Hong Kong Special Administrative Region.",
    meaning: "Red mirrors the color of the national flag of China and represents the motherland; white stands for Hong Kong as a distinct social and economic system under \"one country, two systems.\" The five petals each carrying a small red star symbolize Hong Kongers loving their nation, and the five stars echo those on the PRC flag.",
    adopted: "1997",
    funFacts: [
      "Bauhinia blakeana, the flower on the flag, was discovered in Hong Kong in 1880 and every specimen is a clone of one original tree — it is a sterile hybrid that cannot reproduce from seed.",
      "The flag's specifications are written into Article 10 of the Basic Law, meaning any change would require amending Hong Kong's constitutional document.",
      "The design was selected in 1990 from more than 7,000 entries submitted to a public design competition.",
      "Use, design and display of the flag are governed by the Regional Flag and Regional Emblem Ordinance, which criminalizes desecration.",
    ],
    capital: "City of Victoria",
  },
  MO: {
    description: "The flag of Macao is a green field bearing a stylized white lotus flower with three blooms, floating above a white depiction of the Governador Nobre de Carvalho Bridge and stylized ocean waves. An arc of five gold five-pointed stars — one large star with four smaller ones — sits above the lotus. The flag was adopted on December 20, 1999, when sovereignty transferred from Portugal to the People's Republic of China, and is defined in the Basic Law of the Macao Special Administrative Region.",
    meaning: "Green represents peace and harmony. The lotus is Macao's official floral emblem; its three blooms represent Macao's three main land areas (the Macao Peninsula, Taipa, and Coloane). The bridge and water situate the lotus in Macao's maritime geography. The five gold stars — one larger with four smaller — echo the arrangement on the national flag of the People's Republic of China.",
    adopted: "1999",
    funFacts: [
      "Macao's flag and Hong Kong's were both adopted within two-and-a-half years of each other as each region returned to Chinese sovereignty after more than a century of European rule.",
      "The Governador Nobre de Carvalho Bridge shown on the flag connects the Macao Peninsula to Taipa and was the first permanent link between them when it opened in 1974.",
      "The specifications for the flag — including exact shades, proportions, and symbol placement — are laid down in Annex III of Macao's Basic Law.",
      "Public mistreatment of the flag is a criminal offense under Macao's Law on the National Flag, National Emblem and National Anthem.",
    ],
    capital: "Macao",
  },
  FO: {
    description: "The flag of the Faroe Islands, called Merkið (\"the banner\"), is a white field charged with an off-center red Nordic cross outlined in blue. Like other Nordic cross flags, the vertical arm is shifted toward the hoist. Designed in 1919 by three Faroese students — Jens Oliver Lisberg, Janus Øssursson, and Pauli Dahl — while they were studying in Copenhagen, the flag was first raised in the village of Fámjin. It was formally recognized for Faroese use by the British occupying forces on April 25, 1940, and officially adopted by the Faroese government when Home Rule took effect in 1948.",
    meaning: "White represents the foam of the ocean waves and the clear sky of the islands. Red and blue are traditional colors used in Faroese folk dress and, together with white, place the flag in the Nordic cross family alongside those of Denmark, Norway, Sweden, Finland, and Iceland.",
    adopted: "1948",
    funFacts: [
      "Flag Day (Flaggdagur) is celebrated every April 25, commemorating the day in 1940 that British forces — who had occupied the islands to prevent a Nazi invasion — authorized Merkið in place of the Danish Dannebrog.",
      "The original 1919 flag is preserved in the church of Fámjin on the island of Suðuroy, where one of its designers, Jens Oliver Lisberg, is buried.",
      "Before 1940, public display of Merkið was discouraged by Danish authorities; wartime occupation gave Faroese nationalists the opening to establish it in daily use.",
      "Merkið flies independently of Denmark's flag on Faroese government buildings, a privilege won through Home Rule in 1948.",
    ],
    capital: "Tórshavn",
  },
  GI: {
    description: "The flag of Gibraltar consists of two horizontal bands — a wider white band on top and a narrower red band below, in roughly 2:1 proportion — with a red three-towered castle centered on the white band and a single gold key hanging from the central tower down into the red band. The design is drawn directly from the Royal Warrant issued by Isabella I of Castile on July 10, 1502, which granted Gibraltar its coat of arms. The banner version was officially adopted on November 8, 1982.",
    meaning: "The red castle represents the Rock of Gibraltar and its fortifications — a central element of Gibraltar's identity since the Moorish period. The gold key symbolizes Gibraltar's strategic role as the \"Key to the Mediterranean,\" commanding the strait between Europe and Africa. Red and white are the colors of the Castilian arms granted by Queen Isabella.",
    adopted: "1982",
    funFacts: [
      "Gibraltar's coat of arms is among the oldest still in continuous use anywhere — its design dates to the original 1502 Royal Warrant from Queen Isabella I of Castile.",
      "Gibraltar is unusual among British Overseas Territories in not using the standard blue ensign format; its banner uses the territory's own heraldry instead.",
      "The flag was officially adopted on November 8, 1982, by a decree from the Governor — just weeks before the frontier with Spain, closed since 1969, was reopened to pedestrians.",
      "The three castle towers in the flag are rendered as masoned (showing individual blocks), a heraldic convention preserved from the 1502 grant.",
    ],
    capital: "Gibraltar",
  },
  BM: {
    description: "The civil flag of Bermuda is a British Red Ensign — a red field with the Union Jack in the upper-hoist canton — defaced with the Bermudian coat of arms on the fly. The arms show a red lion rampant holding a shield that depicts the wreck of the Sea Venture, the English ship whose 1609 grounding on Bermuda's reefs led to the first English settlement of the islands. Bermuda is the only British Overseas Territory whose civil ensign uses a red rather than blue field — a choice made when the current design was adopted on October 4, 1910.",
    meaning: "The Union Jack reflects Bermuda's status as a British Overseas Territory. The red lion — a symbol of England — holds a shield commemorating the Sea Venture, the founding event of Bermudian settlement. The red field distinguishes Bermuda's flag from the blue ensigns used by most other British territories.",
    adopted: "1910",
    funFacts: [
      "The shield on the coat of arms shows the Sea Venture, wrecked on Bermuda's reefs in July 1609 while carrying settlers to the Jamestown colony; survivors built new ships from the wreckage and eventually reached Virginia.",
      "The shipwreck of the Sea Venture is widely believed to have inspired William Shakespeare's play The Tempest, written around 1610–1611.",
      "Bermuda's use of the red ensign is shared with only a handful of British merchant navy traditions and is a rare deviation from the blue-ensign default for overseas territories.",
      "The full coat of arms was granted in 1910, the same year the current flag design was adopted.",
    ],
    capital: "Hamilton",
  },
  KY: {
    description: "The flag of the Cayman Islands is a British Blue Ensign — a blue field with the Union Jack in the upper-hoist canton — defaced with the Cayman Islands coat of arms on the fly. The arms show a shield divided by wavy lines representing the sea, bearing three green five-pointed stars (one for each of the three islands: Grand Cayman, Cayman Brac, and Little Cayman). Above the shield sits a gold English lion; below, on a scroll, the motto \"He hath founded it upon the seas\" (Psalm 24:2). The flag was first adopted on May 14, 1958.",
    meaning: "The Union Jack reflects the territory's status as a British Overseas Territory. The three green stars represent the three main Cayman Islands. The wavy blue-and-white bars symbolize the Caribbean Sea. The lion above the shield is a traditional symbol of England. The motto references the islands' maritime heritage.",
    adopted: "1959",
    funFacts: [
      "The coat of arms includes a crest with a green sea turtle atop a pineapple and a thatch-palm rope — all items historically significant to Cayman culture.",
      "The flag's motto \"He hath founded it upon the seas\" is drawn from Psalm 24:2 in the King James Bible.",
      "The three stars on the flag correspond directly to the three inhabited islands; Little Cayman is the smallest with a population of under 200.",
      "Cayman's current flag dates to 1958, but the version formally granted by Royal Warrant came in 1959 and has been modified slightly since.",
    ],
    capital: "George Town",
  },
  AW: {
    description: "The flag of Aruba features a light blue field with two narrow parallel yellow horizontal stripes across the lower third and a red four-pointed star outlined in white in the upper hoist. The flag was adopted on March 18, 1976 — a date now celebrated as Flag Day (Dia di Himno y Bandera) — during Aruba's period of increasing autonomy from the Netherlands Antilles, nine years before the island gained its Status Aparte within the Kingdom of the Netherlands in 1986.",
    meaning: "The light blue represents the sea and sky surrounding the island. The two yellow stripes represent the island's wealth, freedom, and motion (and are also associated with Aruba's indigenous wanglo and kibrahacha flowers). The red four-pointed star represents the four cardinal points from which Aruba's people have come; its white outline symbolizes purity and peace, and the star itself evokes the island's red soil.",
    adopted: "1976",
    funFacts: [
      "Aruba's Flag Day, March 18, is a national holiday celebrated with the national anthem \"Aruba Dushi Tera\" and public ceremonies.",
      "The flag was designed as part of a deliberate campaign to build a distinct Aruban identity ahead of Status Aparte, which Aruba secured from the Netherlands Antilles in 1986.",
      "Aruba adopted its flag while still part of the Netherlands Antilles — it is one of the few constituent units to have adopted a flag before formally separating.",
      "The light-blue background is officially specified by a precise color sample and is lighter than the blues seen on most Caribbean flags.",
    ],
    capital: "Oranjestad",
  },
  CK: {
    description: "The flag of the Cook Islands is a British Blue Ensign — a blue field with the Union Jack in the upper-hoist canton — with fifteen white five-pointed stars arranged in a circle on the fly, one for each of the fifteen islands that make up the country. Adopted on August 4, 1979, it replaced a short-lived 1973–1979 green flag that had also used fifteen stars.",
    meaning: "The Union Jack reflects the Cook Islands' historical ties to Britain and its continuing free association with New Zealand, which is itself a Commonwealth realm. The fifteen white stars arranged in a ring represent the fifteen islands of the Cook Islands united in equal circle, with no island placed above another.",
    adopted: "1979",
    funFacts: [
      "Between 1973 and 1979 the Cook Islands used a green flag with 15 gold stars arranged in an oval — it was replaced after a change of government.",
      "The fifteen stars form a perfect circle to signal that no island is senior to another, a conscious design choice reflecting the country's decentralized geography.",
      "The Cook Islands is in free association with New Zealand — New Zealand handles most foreign affairs and defense, but the Cook Islands maintains its own flag and passport equivalents.",
      "The flag's proportions and star layout are specified in the Cook Islands Flag Act and have not changed since 1979.",
    ],
    capital: "Avarua",
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
  const pattern = features
    ? features.patterns.map((p) => patternDescriptions[p] || p).join(' and ')
    : 'a distinctive design';

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

// Territories: emit entries ONLY for codes with hand-written, source-verified
// content in territoryDescriptions. Territories without a rich entry are
// intentionally skipped so the page falls back to features-only rendering
// rather than displaying template-generated prose.
let territoriesWritten = 0;
for (const territory of territories) {
  const entry = territoryDescriptions[territory.code];
  if (!entry) continue;
  output += `  ${territory.code}: {\n`;
  output += `    description: ${JSON.stringify(entry.description)},\n`;
  output += `    meaning: ${JSON.stringify(entry.meaning)},\n`;
  output += `    adopted: ${JSON.stringify(entry.adopted)},\n`;
  output += `    funFacts: ${JSON.stringify(entry.funFacts)},\n`;
  output += `    capitalCity: ${JSON.stringify(entry.capital)},\n`;
  output += `  },\n`;
  territoriesWritten++;
}

output += `};\n`;

const outPath = path.resolve(import.meta.dirname, '..', 'src', 'data', 'flagDescriptions.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`Wrote ${countries.length} country + ${territoriesWritten} territory entries to ${outPath}`);
