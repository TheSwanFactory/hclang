import { expect } from "jsr:@std/expect";
import { beforeEach, describe, it } from "jsr:@std/testing/bdd";

import { HCEval } from "./hc-eval.ts";
import { HCTest } from "./hc-test.ts";
import * as frame from "../frames.ts";

describe("HCTest", () => {
  let out: frame.FrameArray;
  let test: HCTest;
  let hc_eval: HCEval;
  beforeEach(() => {
    out = new frame.FrameArray([]);
    test = new HCTest(out);
    hc_eval = new HCEval(test);
  });

  it("sets source on out when called with input string", () => {
    hc_eval.call("; .abc");
    const result = test.get(HCEval.SOURCE);
    expect(result.toString()).toContain("“.abc”");
  });

  it("assertEqual returns FrameNote.pass if expected == actual", () => {
    const result = test.assertEqual("123", "123", "abc");
    expect(result.toString()).toContain("$+.test-pass “abc ?123”;");
  });

  it("assertEqual returns FrameNote.fail if expected != actual", () => {
    const result = test.assertEqual("123", "456", "abc");
    expect(result.toString()).toContain("$-.test-fail “abc ?123 !456”;");
  });

  it('assertEqual ignores everything after "..."', () => {
    const result = test.assertEqual("123...456", "123", "abc");
    expect(result.toString()).toContain("$+.test-pass “abc ?123...456”;");
  });

  it("outputs Note+ when called with correct testDoc", () => {
    hc_eval.call(".abc 123;");
    expect(out.length()).toEqual(0);

    hc_eval.call("; abc");
    expect(out.length()).toEqual(0);

    hc_eval.call("# 123");
    expect(out.length()).toEqual(1);

    const result = out.at(0);
    expect(result.toString()).toContain("$+.test-pass ““abc” ?“123””;");
  });

  it("outputs Note- when called with incorrect testDoc", () => {
    hc_eval.call(".abc 456;");
    hc_eval.call("; abc");
    hc_eval.call("# 123");
    expect(out.length()).toEqual(1);
    const result = out.at(0);
    expect(result.toString()).toContain("$-.test-fail ““abc” ?“123” !“456””;");
  });

  it("ignores comment-like headers inside testDoc", () => {
    hc_eval.call("`");
    hc_eval.call("# Header");
    hc_eval.call("`");
    expect(out.length()).toEqual(0);
  });
});
