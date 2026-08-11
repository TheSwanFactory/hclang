import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";

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

  it("tracks a source as pending until its expectation arrives", () => {
    hc_eval.call("; .abc");
    expect(test.n).toEqual({ total: 0, pass: 0, fail: 0, skip: 0 });
    expect(out.length()).toEqual(0);
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

  it("ignores skip-like text inside document strings", () => {
    hc_eval.call("`");
    hc_eval.call("# SKIP: prose, not a test");
    hc_eval.call("`");
    expect(out.length()).toEqual(0);
  });

  it("does not shift a pending actual onto the next source", () => {
    hc_eval.call("; missingName");
    hc_eval.call("; 123");
    hc_eval.call("# 123");

    expect(test.n).toEqual({ total: 2, pass: 1, fail: 1, skip: 0 });
    expect(out.at(0).toString()).toContain("missing expectation");
    expect(out.at(1).toString()).toContain("$+.test-pass");
  });

  it("reports a pending test and summary at EOF", () => {
    hc_eval.call("; 123");
    test.finish();

    expect(test.exitCode).toEqual(1);
    expect(test.n).toEqual({ total: 1, pass: 0, fail: 1, skip: 0 });
    expect(out.at(0).toString()).toContain("missing expectation");
    expect(out.at(1).toString()).toContain("$=.test-summary “HCTest”;");
  });

  it("counts an explicit skip", () => {
    hc_eval.call("; notImplemented");
    hc_eval.call("# SKIP: not implemented");
    test.finish();

    expect(test.exitCode).toEqual(0);
    expect(test.n).toEqual({ total: 1, pass: 0, fail: 0, skip: 1 });
    expect(out.at(0).toString()).toContain("$~.test-skip");
    expect(out.at(1).toString()).toContain(
      '“{"total":1,"pass":0,"fail":0,"skip":1}”',
    );
  });

  it("reports an expectation without a source", () => {
    hc_eval.call("# orphan");
    test.finish();

    expect(test.exitCode).toEqual(1);
    expect(test.n).toEqual({ total: 1, pass: 0, fail: 1, skip: 0 });
    expect(out.at(0).toString()).toContain("missing source");
  });
});
