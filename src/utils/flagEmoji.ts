/**
 * Converts a two-letter ISO country code to a flag emoji.
 * Works by converting each letter to its regional indicator symbol.
 */
export function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
