export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export function pickWithinLimit(candidates: string[], limit: number): string {
  for (const c of candidates) {
    if (c.length <= limit) return c;
  }
  return candidates[candidates.length - 1];
}
