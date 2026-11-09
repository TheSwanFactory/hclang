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
    "Routers <- './hc/rotor-router.hc'; .r0 (Routers.RotorRouter [[], []]); " +
      source,
    { [RESOURCE_ROOT_KEY]: root, ...hosted },
  );
  let answer = FrameExpr.answeredValue(out.at(-1)).referent();
  while (!(answer instanceof FrameArray) && answer.asArray().length > 1) {
    answer = FrameExpr.answeredValue(answer.asArray().at(-1)!).referent();
  }
  return answer;
};

/** A router's channels, read from its one stored field, `channels`. */
const channelsOf = (router: Frame): Frame[][] =>
  router.getOwn("channels").referent().elements().map((channel) =>
    channel.referent().asArray()
  );

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
  const [left, right] = channelsOf(routed);
  expect(left.length).toBe(1);
  expect(left[0].referent()).toBe(watched);
  expect(right[0].referent()).toBe(watched);
});

Deno.test("observing a router measures each routed child, by Size only", () => {
  Watched.seen.length = 0;
  const watched = new Watched([new FrameCount(4n)]);
  const denum = run("((r0 $$.w) $$.w).####", { w: watched });
  expect(denum.toText().toString()).toEqual("“Denum(2,[4, 4])”");
  expect(Watched.seen.includes("call")).toBe(false);
  // `.####` recognizes the router and reads each channel's Size once, so each
  // of the two routed occurrences is measured once.
  expect(Watched.seen.filter((key) => key === "##").length).toBe(2);
});

Deno.test("a non-finite or cyclic child is routed, and observing it fails", () => {
  const cycle = new FrameArray([]);
  cycle.collect(cycle);
  const hosted = { inf: new FrameNumber(Infinity), cyc: cycle };

  const routed = run("((r0 $$.inf) $$.cyc)", hosted);
  expect(channelsOf(routed)[1][0].referent()).toBe(cycle);

  expect(`${run("(r0 $$.inf).####", hosted)}`)
    .toEqual("$!.nonquantifiable-size .##");
  expect(`${run("((r0 5) $$.cyc).####", hosted)}`)
    .toEqual("$!.cyclic-aggregate .##");
  // The first failed load is the answer.
  expect(`${run("((r0 $$.inf) $$.cyc).####", hosted)}`)
    .toEqual("$!.nonquantifiable-size .##");
});

Deno.test("a router's fourth hash is an instance of the bundled Denum class", () => {
  const denum = run("((r0 “hello”) 7).####", {});
  // The Count is the two children routed, not their parity.
  expect(
    [`${denum.getOwn("count")}`, `${denum.getOwn("loads")}`],
  ).toEqual(["2", "[5, 7]"]);
  expect(denum.equals(run("[“hello”, 7].####", {}))).toBe(Frame.all);
  // The initial router has routed nothing, so it has Count zero and no Denum,
  // like the empty host; the Denum of Count zero is a different, present value.
  expect(run("r0.#", {}).toString()).toEqual("0");
  expect(run("r0.####", {})).toBe(Frame.nil);
  expect(run("[].####", {})).toBe(Frame.nil);
  expect(`${run("((r0 5) 7).#", {})}`).toEqual("2");
  expect(`${run("(((r0 5) 7) 9).####.count", {})}`).toEqual("3");
});

Deno.test("a router routes to channel C mod k, and only round-robin histories construct (007.25e)", () => {
  // Admissible preloads of every small Count: the next Frame goes to channel
  // C mod 2, and the router's Denum deposits into the same load.
  for (
    const [channels, c, next] of [
      ["[[], []]", "0", 0],
      ["[[5], []]", "1", 1],
      ["[[5], [6]]", "2", 0],
      ["[[5, 7], [6]]", "3", 1],
    ] as const
  ) {
    const router = run(`Routers.RotorRouter ${channels}`, {});
    expect(`${router.sizeFor(Frame.kCOUNT)}`, channels).toEqual(c);
    const routed = channelsOf(run(`(Routers.RotorRouter ${channels}) 9`, {}));
    expect(routed[next].length, channels).toBe(
      channelsOf(router)[next].length + 1,
    );
    if (c !== "0") {
      expect(
        `${run(`((Routers.RotorRouter ${channels}) 9).####`, {})}`,
        channels,
      ).toEqual(`${run(`((Routers.RotorRouter ${channels}).####) 9`, {})}`);
    }
  }
  // Not a left-first alternating history, or the removed phase-first form.
  for (
    const channels of [
      "[[], [5]]",
      "[[5, 6], []]",
      "[[5], [6, 7]]",
      "[2, [], []]",
      "[1, [5], []]",
    ]
  ) {
    expect(`${run(`Routers.RotorRouter ${channels}`, {})}`, channels)
      .toEqual("$!!.invalid-router");
  }
  // Routing commutes with observing at every Count where the Denum exists.
  expect(
    `${
      run(
        "[r0 5, (r0 5) 6, ((r0 5) 6) 7] & {.k _; ((k 9).####) = ((k.####) 9)}",
        {},
      )
    }`,
  ).toEqual("[<>, <>, <>]");
});

Deno.test("a router stores only its channels, for every number of channels (007.40 follow-up)", () => {
  /** The instance's stored fields: every own property that is not a method. */
  const stored = (router: Frame): string[] =>
    router.meta_keys().filter((key) =>
      !(router.getOwn(key) instanceof FrameExpr)
    );
  for (
    const source of [
      "r0",
      "r0 5",
      "((r0 5) [1, 2]) “ab”",
      "Routers.RotorRouter [[5, 7], [6]]",
      "Routers.RotorRouter [[5]]",
      "[1, 2, 3] ./ 2",
      "[1, 2, 3, 4] ./ 3",
      "([1, 2, 3, 4] ./ 3) 5",
    ]
  ) {
    expect(stored(run(source, {})), source).toEqual(["channels"]);
  }
  // Two channels print like any other number of channels.
  expect(`${run("“” ((r0 5) 6)", {})}`).toEqual("“RotorRouter([[5], [6]])”");
  expect(`${run("“” ([1, 2, 3] ./ 3)", {})}`).toEqual(
    "“RotorRouter([[1], [2], [3]])”",
  );
});
