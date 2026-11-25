import { expect } from "@std/expect";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { answerOfLast } from "../test-helpers.test.ts";

/**
 * The RotorRouter class when its file loads but binds the constructor to a
 * failed value (#524). The class loads once per process, on first use, so this
 * file replaces the bundle's copy before any test divides or observes a list.
 * Each test file runs in its own isolate, so no other file sees it.
 */
(HC_SOURCES as Map<string, string>).set(
  "hc/rotor-router.hc",
  ".RotorRouter [$!.unbuilt]; .router-instance {_};",
);

Deno.test("a failed constructor is what a list division answers", () => {
  expect(answerOfLast("[1, 2, 3] ./ 2").toString()).toEqual("[$!!.unbuilt]");
});

Deno.test("with a failed constructor, a record storing channels takes the derived path", () => {
  expect(answerOfLast("“” [.channels [[5]]].###").toString())
    .toEqual("“Denum(0,[])”");
});
