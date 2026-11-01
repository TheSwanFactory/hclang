import { expect } from "jsr:@std/expect@^0.219.1";
import {
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
  FrameNumber,
  FrameResource,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
} from "../frames.ts";
import { withHCBundle } from "../bundle/hc-bundle.ts";
import { evaluate } from "./evaluate.ts";

/**
 * The RotorRouter class of `hc/rotor-router.hc` (011.21), exercised with
 * Frames HC source cannot write: a non-finite number, a cyclic aggregate, and a
 * Frame that records every measurement and application it receives. The
 * testdoc itself is run by the CLI tests.
 */

/** Evaluates `source` with the bundled `hc/` files and `hosted` under `$$`. */
const run = (source: string, hosted: Record<string, Frame>): Frame => {
  const root = FrameResource.root(
    withHCBundle(new MemoryStore("rotor-router")),
    ResourceHandlers.of({}),
  );
  const out = evaluate(
    "Routers <- './hc/rotor-router.hc'; .r0 (Routers.RotorRouter [2, [], []]); " +
      source,
    { [RESOURCE_ROOT_KEY]: root, ...hosted },
  );
  let answer = FrameExpr.answeredValue(out.at(-1)).referent();
  while (!(answer instanceof FrameArray) && answer.asArray().length > 1) {
    answer = FrameExpr.answeredValue(answer.asArray().at(-1)!).referent();
  }
  return answer;
};

/** A Frame that records each size operator and each application it receives. */
class Watched extends FrameArray {
  public static readonly seen: string[] = [];

  public override sizeFor(key: string): Frame {
    Watched.seen.push(key);
    return super.sizeFor(key);
  }

  /** A list's Size measures each child natively, through this. */
  public override nativeSize(path: Set<Frame>): bigint | Frame {
    Watched.seen.push("##");
    return super.nativeSize(path);
  }

  public override call(argument: Frame, parameter = Frame.nil): Frame {
    Watched.seen.push("call");
    return super.call(argument, parameter);
  }
}

Deno.test("routing neither measures nor applies the routed Frame (011.21)", () => {
  Watched.seen.length = 0;
  const watched = new Watched([new FrameCount(4n)]);
  const routed = run("((r0 $$.w) $$.w)", { w: watched });
  expect(Watched.seen).toEqual([]);
  expect(`${routed.getOwn("phase")}`).toEqual("2");
  const [left, right] = ["left", "right"].map((key) =>
    routed.getOwn(key).referent().asArray()
  );
  expect(left.length).toBe(1);
  expect(left[0].referent()).toBe(watched);
  expect(right[0].referent()).toBe(watched);
});

Deno.test("projection measures each routed child, by Size only", () => {
  Watched.seen.length = 0;
  const watched = new Watched([new FrameCount(4n)]);
  const demi = run("((r0 $$.w) $$.w).demi ()", { w: watched });
  expect(demi.toText().toString()).toEqual("“Demi(<>,4,4)”");
  expect(Watched.seen.includes("call")).toBe(false);
  expect(Watched.seen.filter((key) => key === "##").length).toBe(2);
});

Deno.test("a non-finite or cyclic child is routed, and its projection fails", () => {
  const cycle = new FrameArray([]);
  cycle.collect(cycle);
  const hosted = { inf: new FrameNumber(Infinity), cyc: cycle };

  const routed = run("((r0 $$.inf) $$.cyc)", hosted);
  expect(`${routed.getOwn("phase")}`).toEqual("2");
  expect(routed.getOwn("right").referent().asArray()[0].referent())
    .toBe(cycle);

  expect(`${run("(r0 $$.inf).demi ()", hosted)}`)
    .toEqual("$!.nonquantifiable-size .##");
  expect(`${run("((r0 5) $$.cyc).demi ()", hosted)}`)
    .toEqual("$!.cyclic-aggregate .##");
  // The first failed load is the answer.
  expect(`${run("((r0 $$.inf) $$.cyc).demi ()", hosted)}`)
    .toEqual("$!.nonquantifiable-size .##");
});

Deno.test("the projection answers the bundled Demi class", () => {
  const demi = run("((r0 “hello”) 7).demi ()", {});
  expect(["phase", "left", "right"].map((key) => `${demi.getOwn(key)}`))
    .toEqual(["2", "5", "7"]);
  expect(demi.equals(run("[“hello”, 7].####", {}))).toBe(Frame.all);
  expect(`${run("r0.demi ()", {}).toText()}`).toEqual("“Demi(<>,0,0)”");
});
