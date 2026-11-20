import {
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "jsr:@std/assert@^1.0.15";
import {
  cayleyDicksonLaw,
  commutatorWitness,
  coordinatewiseLaw,
  denumSignedCoordinates,
  signedBasis,
} from "./space-elevator-probe.ts";

Deno.test("KDSL signed coordinate reading pairs nonnegative loads", () => {
  assertEquals(denumSignedCoordinates(2, [2n, 5n, 7n, 1n]), [-5n, 4n]);
  assertEquals(denumSignedCoordinates(2, [2n, 5n]), [2n, 5n]);
  assertEquals(denumSignedCoordinates(0, [2n, 5n]), [7n]);
  assertThrows(() => denumSignedCoordinates(-1, [1n]), RangeError);
  assertThrows(() => denumSignedCoordinates(2, [-1n]), RangeError);
});

Deno.test("the same Denum-readable coordinates admit different products", () => {
  // Rank 3 has four signed coordinates; e1 and e2 are readable from
  // nonnegative Denum loads [0,1,0,0] and [0,0,1,0].
  const x = denumSignedCoordinates(3, [0n, 1n, 0n, 0n]);
  const y = denumSignedCoordinates(3, [0n, 0n, 1n, 0n]);
  assertEquals(x, signedBasis(4, 1));
  assertEquals(y, signedBasis(4, 2));
  assertEquals(commutatorWitness(coordinatewiseLaw, x, y), [0n, 0n, 0n, 0n]);
  const cd = commutatorWitness(cayleyDicksonLaw, x, y);
  assertNotEquals(cd, [0n, 0n, 0n, 0n]);
});

Deno.test("a law-dependent incidence cannot be inferred from coordinate data alone", () => {
  const x = signedBasis(4, 1);
  const y = signedBasis(4, 2);
  const cdNoncommuting = commutatorWitness(cayleyDicksonLaw, x, y)
    .some((v) => v !== 0n);
  const pointwiseNoncommuting = commutatorWitness(coordinatewiseLaw, x, y)
    .some((v) => v !== 0n);
  assertEquals(cdNoncommuting, true);
  assertEquals(pointwiseNoncommuting, false);
});
