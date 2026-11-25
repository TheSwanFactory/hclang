import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { evaluate } from "../execute/evaluate.ts";
import type { Frame } from "./frame.ts";
import { DISPATCH_KEY, dispatchNamespace } from "./dispatch-host.ts";

/** The last answer of `source`, with `$$.dispatch` installed. */
const answer = (source: string): Frame =>
  evaluate(source, { [DISPATCH_KEY]: dispatchNamespace() }).at(-1);

describe("DispatchPolicyFrame", () => {
  it("evaluates to itself, so a codified policy still dispatches", () => {
    // `{} [p]` holds the policy as a term; calling the expression evaluates it.
    const codified = "({} [$$.dispatch.sequential]) ()";
    expect(answer(codified).toString()).toBe("$$.dispatch.sequential");
    expect(answer(`(${codified}) [{1}, {2}]`).toString())
      .toBe("[.trace “0:1 1:1”; .waited [[], []]; .escapes [0, 0]; 1, 2]");
  });
});
