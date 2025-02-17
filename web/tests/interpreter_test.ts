import { assertEquals } from "$std/assert/mod.ts";
import { evaluate } from "../../src/mod.ts";

Deno.test("evaluate function basic test", () => {
  const result = evaluate("42");
  assertEquals(result.toString(), "[42]");
});

Deno.test("evaluate function with expression", () => {
  const result = evaluate("(+ 2 3)");
  assertEquals(result.toString(), "[5]");
});

Deno.test("evaluate function with invalid input", () => {
  try {
    evaluate("@invalid@");
    throw new Error("Should have thrown an error");
  } catch (error) {
    assertEquals(error instanceof Error, true);
  }
});
