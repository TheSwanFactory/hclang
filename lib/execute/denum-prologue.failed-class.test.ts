import { expect } from "@std/expect";
import { FrameCount } from "../frames.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { constructDenum } from "./denum-prologue.ts";
import { answerOfLast } from "../test-helpers.test.ts";
/**
 * The Denum class when its file loads but binds the constructor to a failed
 * value (#524). The class loads once per process, on first use, so this file
 * replaces the bundle's copy before any test constructs a Denum. Each test
 * file runs in its own isolate, so no other file sees it.
 */
(HC_SOURCES as Map<string, string>).set(
  "hc/denum.hc",
  ".Denum [$!.unbuilt];",
);
Deno.test("a failed constructor is what constructing a Denum answers", () => {
  const built = constructDenum(new FrameCount(2n), [new FrameCount(3n)]);
  expect(built.toString()).toEqual("[$!!.unbuilt]");
  expect(answerOfLast("[5, 3, 7].###").toString()).toEqual("[$!!.unbuilt]");
});
