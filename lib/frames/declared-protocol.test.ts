import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { lastTermOfLast } from "../test-helpers.test.ts";
describe("declared observation (011.20)", () => {
  it("refuses a method that observes its own receiver the same way (#524)", () => {
    expect(lastTermOfLast(".x [.# {x.#}]; x.#").toString())
      .toEqual("$!.cyclic-observation .#");
    expect(lastTermOfLast(".x [.## {x.##}]; x.##").toString())
      .toEqual("$!.cyclic-observation .##");
  });
  it("refuses nesting past the depth limit, as observing a fresh instance does (#524)", () => {
    expect(lastTermOfLast(".C [.# {(C []).#}]; C.#").toString())
      .toEqual("$!.observation-depth .#");
  });
});
