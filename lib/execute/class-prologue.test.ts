import { expect } from "jsr:@std/expect@^0.219.1";
import { classOnce, type ClassPrologue } from "./class-prologue.ts";

const PROBE: ClassPrologue = {
  file: "hc/probe.hc",
  names: ["Answer"],
  prefix: "probe-prologue",
};

Deno.test("classOnce keeps an error the load answers and evaluates once", () => {
  let reads = 0;
  const load = classOnce(PROBE, () => {
    reads += 1;
    return undefined;
  });

  const first = load();
  expect(first.toString()).toEqual("$!.probe-prologue-missing hc/probe.hc");
  expect(load()).toBe(first);
  expect(reads).toEqual(1);
});

Deno.test("classOnce keeps nothing from a throw, so the next call evaluates again", () => {
  let reads = 0;
  const load = classOnce(PROBE, () => {
    reads += 1;
    if (reads === 1) throw new Error("evaluator bug");
    return ".Answer 42;";
  });

  expect(() => load()).toThrow("evaluator bug");
  const second = load();
  expect(Array.isArray(second)).toEqual(true);
  expect(String(second)).toEqual("42");
  expect(load()).toBe(second);
  expect(reads).toEqual(2);
});
