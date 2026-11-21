/**
 * FOIST 19a: the six geometric suffix observers and #%-binding are removed.
 * Historical v0.53.1 geometric algebra comparisons remain in Git history;
 * the public API now uses .### for raw Denums and .#### for KD coordinates.
 */
import { expect } from "jsr:@std/expect@^0.219.1";
import { Frame, FrameCount } from "../frames.ts";
import { constructDenum } from "./denum-prologue.ts";

const denum = (count: bigint, loads: readonly bigint[]): Frame =>
  constructDenum(
    new FrameCount(count),
    loads.map((n) => new FrameCount(n)),
  );

Deno.test("FOIST 19a removes every % suffixed hash observer", () => {
  expect([...Frame.SIZE_OPERATORS]).toEqual(["#", "##", "###", "####"]);
  const d = denum(2n, [3n, 1n]);
  for (
    const key of [
      "#%",
      "##%",
      "###%",
      "##%%",
      "###%%",
      "##%%%",
      "###%%%",
    ]
  ) {
    expect(Frame.SIZE_OPERATORS.includes(key)).toBe(false);
    expect(d.sizeFor(key)).toBe(Frame.nil);
  }
});

Deno.test("FOIST 19a fourth hash uses the load arity, not construction Count", () => {
  expect(denum(1n, [3n, 1n]).sizeFor("####").toString())
    .toEqual("[2]");
  expect(denum(8n, [3n, 1n]).sizeFor("####").toString())
    .toEqual("[2]");
  expect(denum(3n, [3n, 1n, 5n]).sizeFor("####").toString())
    .toEqual("[-2, 1]");
  expect(denum(3n, [3n, 1n, 5n, 0n]).sizeFor("####").toString())
    .toEqual("[-2, 1]");
});

Deno.test("FOIST 19a fourth hash is gauge-invariant and pure", () => {
  const raw = denum(4n, [3n, 1n, 5n, 0n]);
  const gauge = denum(4n, [6n, 2n, 8n, 1n]);
  expect(raw.sizeFor("####").toString())
    .toEqual(gauge.sizeFor("####").toString());
  expect(raw.getOwn("loads").toString()).toEqual("[3, 1, 5, 0]");
  expect(gauge.getOwn("loads").toString()).toEqual("[6, 2, 8, 1]");
});

Deno.test("FOIST 19a preserves the empty Denum as the raw zero-arity state", () => {
  const empty = denum(0n, []);
  expect(empty.sizeFor("###").getOwn("count").toString()).toEqual("0");
  expect(empty.sizeFor("###").getOwn("loads").toString()).toEqual("[]");
  expect(empty.sizeFor("####").toString()).toEqual("[]");
});
