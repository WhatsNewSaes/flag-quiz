/**
 * Fisher-Yates shuffle algorithm for randomizing arrays.
 * Returns a new shuffled array without modifying the original.
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets a random element from an array.
 */
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gets n random elements from an array without duplicates.
 */
export function getRandomElements<T>(array: T[], n: number): T[] {
  return shuffle(array).slice(0, n);
}
