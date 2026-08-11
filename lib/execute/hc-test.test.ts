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
    expect(test.n).toEqual({
      total: 0,
      pass: 0,
      fail: 0,
      unimplemented: 0,
    });
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

  it("ignores unimplemented-like text inside document strings", () => {
    hc_eval.call("`");
    hc_eval.call("# $!.unimplemented prose, not a test");
    hc_eval.call("`");
    expect(out.length()).toEqual(0);
  });

  it("does not shift a pending actual onto the next source", () => {
    hc_eval.call("; missingName");
    hc_eval.call("; 123");
    hc_eval.call("# 123");

    expect(test.n).toEqual({
      total: 2,
      pass: 1,
      fail: 1,
      unimplemented: 0,
    });
    expect(out.at(0).toString()).toContain("missing expectation");
    expect(out.at(1).toString()).toContain("$+.test-pass");
  });

  it("reports a pending test and summary at EOF", () => {
    hc_eval.call("; 123");
    test.finish();

    expect(test.exitCode).toEqual(1);
    expect(test.n).toEqual({
      total: 1,
      pass: 0,
      fail: 1,
      unimplemented: 0,
    });
    expect(out.at(0).toString()).toContain("missing expectation");
    expect(out.at(1).toString()).toContain("$=.test-summary “HCTest”;");
  });

  it("counts an evaluated incorrect result as unimplemented", () => {
    hc_eval.call("; 1");
    hc_eval.call("# $!.unimplemented 2");
    test.finish();

    expect(test.exitCode).toEqual(0);
    expect(test.n).toEqual({
      total: 1,
      pass: 0,
      fail: 0,
      unimplemented: 1,
    });
    expect(out.at(0).toString()).toContain("$~.test-unimplemented");
  });

  it("fails when an unimplemented example produces the correct result", () => {
    hc_eval.call("; 1");
    hc_eval.call("# $!.unimplemented 1");
    test.finish();

    expect(test.exitCode).toEqual(1);
    expect(test.n).toEqual({
      total: 1,
      pass: 0,
      fail: 1,
      unimplemented: 0,
    });
    expect(out.at(0).toString()).toContain(
      "unexpectedly implemented; remove marker",
    );
  });

  it("counts an unimplemented example without an actual result", () => {
    test.set(HCEval.SOURCE, new frame.FrameString("source"));
    test.set(
      HCEval.EXPECT,
      new frame.FrameString("$!.unimplemented correct"),
    );
    test.finish();

    expect(test.exitCode).toEqual(0);
    expect(test.n).toEqual({
      total: 1,
      pass: 0,
      fail: 0,
      unimplemented: 1,
    });
    expect(out.at(0).toString()).toContain("!<missing>");
  });

  it("rejects an unimplemented marker without a correct value", () => {
    hc_eval.call("; 1");
    hc_eval.call("# $!.unimplemented   ");
    test.finish();

    expect(test.exitCode).toEqual(1);
    expect(out.at(0).toString()).toContain("missing correct value");
  });

  it("rejects an empty source", () => {
    hc_eval.call("; ");
    test.finish();

    expect(test.exitCode).toEqual(1);
    expect(out.at(0).toString()).toContain("missing source");
  });

  it("treats an expectation-like line without a source as a comment", () => {
    hc_eval.call("# orphan");
    expect(out.length()).toEqual(0);

    test.finish();
    expect(test.exitCode).toEqual(0);
    expect(test.n).toEqual({
      total: 0,
      pass: 0,
      fail: 0,
      unimplemented: 0,
    });
    expect(out.at(0).toString()).toContain("$=.test-summary");
  });
});
