import { expect } from "@std/expect";
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
Deno.test("classOnce answers and keeps the failure a failing class file answers (#524)", () => {
  let reads = 0;
  const load = classOnce(PROBE, () => {
    reads += 1;
    return ".Answer 42; 1 / 0";
  });
  const first = load();
  expect(Array.isArray(first)).toEqual(false);
  expect(String(first)).toEqual("$!.division-by-zero /");
  expect(load()).toBe(first);
  expect(reads).toEqual(1);
});
Deno.test("classOnce answers a request made while the file loads as reentrant (#524)", () => {
  let inner: unknown;
  const load = classOnce(PROBE, () => {
    inner = load();
    return ".Answer 42;";
  });
  expect(String(load())).toEqual("42");
  expect(String(inner)).toEqual("$!.probe-prologue-reentrant");
});
