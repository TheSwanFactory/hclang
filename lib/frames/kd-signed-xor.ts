/**
 * FOIST 19a: exact-count Kaylee–Dixon load calculus.
 *
 * This is the pure, unbound load kernel for the proposed HC `&|&` operator.
 * An HC Denum stores a separate construction Count; this helper intentionally
 * does NOT fabricate that Count or change public Frame/observer dispatch.
 *
 * Each signed value at width 2d stores [positive e_0..e_(d-1),
 * negative e_0..e_(d-1)], with nonnegative bigint magnitudes.
 * See occurrence/foist 19a and Explore 023.09a.
 */

/** Keep allocations bounded; this is not a bound on mathematical rank. */
export const KD_MAX_SLOTS = 65536;

function validate(loads: readonly bigint[]): void {
  if (loads.length === 0 || loads.length > KD_MAX_SLOTS) {
    throw new RangeError("KD requires 1..65536 raw load slots");
  }
  for (const load of loads) {
    if (typeof load !== "bigint" || load < 0n) {
      throw new RangeError("KD loads must be nonnegative exact Counts");
    }
  }
}

function nextPowerOfTwo(count: number): number {
  let n = 1;
  while (n < count) n *= 2;
  if (n > KD_MAX_SLOTS) throw new RangeError("KD arity exceeds capacity");
  return n;
}

/**
 * Lazy arity completion: append zeros to the next power of two.
 * Do not confuse this with cross-rank embedding of a valid signed value.
 * One raw load remains the unsigned scalar rank.
 */
export function kdCompleteLoads(loads: readonly bigint[]): bigint[] {
  validate(loads);
  const result = [...loads];
  while (result.length < nextPowerOfTwo(loads.length)) result.push(0n);
  return result;
}

/** KD signed-coordinate observation, without changing the raw loads. */
export function kdCoordinates(loads: readonly bigint[]): bigint[] {
  const full = kdCompleteLoads(loads);
  if (full.length === 1) return full;
  const d = full.length / 2;
  return full.slice(0, d).map((p, i) => p - full[i + d]);
}

/** The half-turn negation. A one-slot unsigned scalar first gains sign. */
export function kdNegateLoads(loads: readonly bigint[]): bigint[] {
  let full = kdCompleteLoads(loads);
  if (full.length === 1) full = [full[0], 0n];
  const d = full.length / 2;
  return [...full.slice(d), ...full.slice(0, d)];
}

/**
 * Exact value-preserving CD inclusion: pad EACH orientation half separately.
 * The target is an even power-of-two signed slot count >= source capacity.
 */
export function kdEmbedLoads(
  loads: readonly bigint[],
  targetSlots: number,
): bigint[] {
  let full = kdCompleteLoads(loads);
  if (
    !Number.isInteger(targetSlots) || targetSlots < 2 ||
    targetSlots > KD_MAX_SLOTS || nextPowerOfTwo(targetSlots) !== targetSlots ||
    targetSlots < full.length
  ) {
    throw new RangeError("invalid KD embedding destination arity");
  }
  if (full.length === 1) full = [full[0], 0n];
  while (full.length < targetSlots) {
    const d = full.length / 2;
    full = [
      ...full.slice(0, d),
      ...Array<bigint>(d).fill(0n),
      ...full.slice(d),
      ...Array<bigint>(d).fill(0n),
    ];
  }
  return full;
}

/**
 * The guarded parity/swapped, MSB-to-LSB sign rule of Explore 023.02a.
 * Direction indices are nonnegative and must fit the caller's basis width.
 * This is independent of signed orientation bits.
 */
export function kdCdSign(u: bigint, v: bigint): 0 | 1 {
  if (u < 0n || v < 0n) throw new RangeError("negative CD basis index");
  if (u === 0n || v === 0n) return 0;
  let mask = 1n;
  while (mask <= (u | v)) mask <<= 1n;
  mask >>= 1n;

  let parity: 0 | 1 = 0;
  let swapped = false;
  for (; mask !== 0n; mask >>= 1n) {
    const a = swapped ? v : u;
    const b = swapped ? u : v;
    const abit = (a & mask) !== 0n;
    const bbit = (b & mask) !== 0n;
    const alow = (a & (mask - 1n)) !== 0n;
    const blow = (b & (mask - 1n)) !== 0n;
    if (!abit && bbit) {
      if (!alow) break;
      swapped = !swapped;
    } else if (abit && !bbit) {
      if (!blow) break;
      parity = parity === 0 ? 1 : 0;
    } else if (abit && bbit) {
      if (!blow) {
        parity = parity === 0 ? 1 : 0;
        break;
      }
      swapped = !swapped;
    }
  }
  return parity;
}

/**
 * Exact signed-XOR convolution on nonnegative raw loads.
 * Builds every ordered slot pair, multiplies magnitudes, and adds them into
 * (orientation XOR θ, basis XOR) without cancelling opposite orientations.
 *
 * The answer is canonical LOADS, not signed coordinates and not a Denum:
 * public HC `&|&` must construct a Denum around them once its output Count
 * rule is chosen. Source lengths are completed lazily and separately
 * embedded into the larger rank, never padded naively across a sign boundary.
 */
export function kdMultiplyLoads(
  left: readonly bigint[],
  right: readonly bigint[],
): bigint[] {
  const l = kdCompleteLoads(left);
  const r = kdCompleteLoads(right);
  const slots = Math.max(2, l.length, r.length);
  const x = kdEmbedLoads(l, slots);
  const y = kdEmbedLoads(r, slots);
  const d = slots / 2;
  const result = Array<bigint>(slots).fill(0n);

  for (let i = 0; i < slots; i++) {
    if (x[i] === 0n) continue;
    const u = BigInt(i % d);
    const s = i >= d ? 1 : 0;
    for (let j = 0; j < slots; j++) {
      if (y[j] === 0n) continue;
      const v = BigInt(j % d);
      const t = j >= d ? 1 : 0;
      const w = Number(u ^ v);
      const q = s ^ t ^ kdCdSign(u, v);
      result[w + q * d] += x[i] * y[j];
    }
  }
  return result;
}
