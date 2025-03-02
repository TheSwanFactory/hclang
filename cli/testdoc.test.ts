import { assertEquals } from "https://deno.land/std@0.216.0/assert/mod.ts";
import { HCEval } from "../lib/execute/hc-eval.ts";
import { HCTest } from "../lib/execute/hc-test.ts";
import { Frame } from "../lib/frames/frame.ts";

Deno.test("Schema with number", async () => {
  const hc = new HCEval();
  const result = await hc.evaluate("<> 1");
  assertEquals(result.toString(), "<1>");
});

Deno.test("Schema with expression", async () => {
  const hc = new HCEval();
  const result = await hc.evaluate("<> ()");
  assertEquals(result.toString(), "<>");
});

Deno.test("Name with schema and number", async () => {
  const hc = new HCEval();
  const result = await hc.evaluate(".one <1> 1");
  assertEquals(result.toString(), "one");
});

Deno.test("Alias with number", async () => {
  const hc = new HCEval();
  // First define one
  await hc.evaluate(".one <1> 1");
  const result = await hc.evaluate("@one 2");
  // The expected output should contain a type error
  const output = result.toString();
  assertEquals(output.includes("type-error"), true);
  assertEquals(output.includes("one"), true);
});

Deno.test("Enumerated type definition", async () => {
  const hc = new HCEval();
  await hc.evaluate("@enum123 <1,2,3>");
  const result = await hc.evaluate("enum123");
  assertEquals(result.toString(), "<1,2,3>");
});

Deno.test("Enumerated type validation", async () => {
  const hc = new HCEval();
  await hc.evaluate("@enum123 <1,2,3>");
  const result = await hc.evaluate("@enum123 4");
  // Should fail validation
  const output = result.toString();
  assertEquals(output.includes("enum123"), true);
});

Deno.test("Conditional expression with true", async () => {
  const hc = new HCEval();
  await hc.evaluate(".true 1");
  const result = await hc.evaluate("true .? `Yes` .: `No`");
  assertEquals(result.toString(), "`Yes`");
});

Deno.test("Conditional expression with false", async () => {
  const hc = new HCEval();
  await hc.evaluate(".false 0");
  const result = await hc.evaluate("false .? `Yes` .: `No`");
  assertEquals(result.toString(), "`No`");
});

Deno.test("Selector with object", async () => {
  const hc = new HCEval();
  const result = await hc.evaluate("<.x, .z> [.x 1; .y 2; .z 3;]");
  assertEquals(result.toString(), "[1, 3]");
});
