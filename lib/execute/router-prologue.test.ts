import { expect } from "@std/expect";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { answerOfLast } from "../test-helpers.test.ts";

/**
 * The RotorRouter class when the bundle lacks `hc/rotor-router.hc` (#524).
 * The class loads once per process, on first use, and keeps its failure, so
 * this file removes the bundle's copy before any test divides or observes a
 * list. Each test file runs in its own isolate, so no other file sees it.
 */
(HC_SOURCES as Map<string, string>).delete("hc/rotor-router.hc");

Deno.test("without the class file, a list division answers the load's failure", () => {
  expect(answerOfLast("[1, 2, 3] ./ 2").toString())
    .toEqual("$!.router-prologue-missing hc/rotor-router.hc");
});

Deno.test("without the class file, a record storing channels takes the derived path", () => {
  expect(answerOfLast("“” [.channels [[5]]].###").toString())
    .toEqual("“Denum(0,[])”");
});
