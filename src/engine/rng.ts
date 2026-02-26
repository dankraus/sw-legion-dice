/** Default number of simulation runs for stable expectations and distributions. */
export const DEFAULT_RUNS = 10_000;

/** Mulberry32 seeded PRNG. Returns value in [0, 1). */
export function createSeededRng(seed: number): () => number {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0; // mulberry32
    const t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    return ((t + (t ^ (t >>> 7))) >>> 0) / 4294967296;
  };
}
