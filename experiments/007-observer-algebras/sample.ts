/**
 * Deterministic sample vectors for the 007.41 tests. A fixed linear
 * congruential generator keeps every run, and every printed witness, the same.
 *
 * @module
 */

/** A seeded generator of small signed integers in [−range, range]. */
export function lcg(seed: number): (range: number) => bigint {
  let state = BigInt(seed) & 0xffffffffn;
  return (range: number): bigint => {
    state = (state * 1664525n + 1013904223n) & 0xffffffffn;
    const span = BigInt(2 * range + 1);
    return ((state >> 8n) % span) - BigInt(range);
  };
}

/**
 * `n` vectors of length `count` with entries in [−range, range], from `seed`.
 */
export function sampleVectors(
  count: number,
  n: number,
  seed: number,
  range = 5,
): bigint[][] {
  const next = lcg(seed + count);
  return Array.from(
    { length: n },
    () => Array.from({ length: count }, () => next(range)),
  );
}
