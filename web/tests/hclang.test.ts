import { execute } from "@swanfactory/hclang";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { expect } from "jsr:@std/expect@^0.219.1";

// Example test case
describe("execute", () => {
  it("should execute a simple expression", () => {
    const result = execute("2 + 2");
    expect(result).toBe("4");
  });
});
