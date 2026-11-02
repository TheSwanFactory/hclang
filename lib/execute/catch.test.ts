import { expect } from "jsr:@std/expect@^0.219.1";
import { evaluate } from "./evaluate.ts";
import { Frame, FrameExpr, FrameObservation } from "../frames.ts";
import { describedKind, kindOf } from "../frames/error-kind.ts";

/**
 * The catch operator `$!` and observations `$#` (spec a13/14), with the
 * conformance cases of specs a13/12 through a13/13, ported from
 * `experiments/a13-recovery-spike/`.
 */

/** Counts calls; host bindings are copied, so the count is shared. */
class Counter extends Frame {
  public readonly effects = { calls: 0 };
  public get calls(): number {
    return this.effects.calls;
  }
  public override call(_argument: Frame): Frame {
    return Frame.count(BigInt(++this.effects.calls));
  }
}

/** Records what it is applied to and answers it unchanged. */
class Spy extends Frame {
  public readonly seen: Frame[] = [];
  public override call(argument: Frame): Frame {
    this.seen.push(argument);
    return argument;
  }
}

/** The last statement's value, looking through top-level groups. */
const answer = (source: string, meta: Record<string, Frame> = {}): Frame => {
  let value: Frame = evaluate(source, meta).asArray().at(-1) ?? Frame.nil;
  while (
    value.constructor === FrameExpr || value.constructor.name === "FrameGroup"
  ) {
    value = value.asArray().at(-1) ?? Frame.nil;
  }
  return value.referent();
};

const text = (source: string, meta: Record<string, Frame> = {}): string =>
  evaluate(source, meta).toString();

Deno.test("success answers the guarded value without evaluating the handler", () => {
  const tick = new Counter();
  expect(answer("7 $! {$$.tick ()}", { tick }).toString()).toBe("7");
  expect(answer("7 $!{$$.tick ()}", { tick }).toString()).toBe("7");
  // A spaced handler is not evaluated at all, even when it is not a closure.
  expect(answer("7 $! ($$.tick ())", { tick }).toString()).toBe("7");
  expect(tick.calls).toBe(0);
});

Deno.test("a handler's answer replaces the error, nil included", () => {
  expect(answer("1 / 0 $! {0}").toString()).toBe("0");
  expect(answer("(1 / 0) $!{0}").toString()).toBe("0");
  expect(text("(1 / 0) $!{()}")).toBe("[]");
  expect(answer("((1 / 0) ? {1} : {2}) $!{0}").toString()).toBe("0");
  // A handler that is not a closure is the replacement itself.
  expect(answer("(1 / 0) $! 5").toString()).toBe("5");
});

Deno.test("spacing sets what is guarded (a13/14 §5.1)", () => {
  // Tight: only the term before the catcher.
  expect(text(".x (1 / 0) $!{0}; x")).toBe("[.x 0; ((.x 0); 0)]");
  expect(answer("1 + (1 / 0) $!{0}").toString()).toBe("1");
  expect(answer("[(1 / 0) $!{0}, 2]").toString()).toBe("[0, 2]");
  // Spaced: everything to its left, declarations included.
  expect(answer("1 + (1 / 0) $! {0}").toString()).toBe("0");
  expect(answer(".x (1 / 0) $! {0}; x").toString())
    .toMatch(/^\$!\.name-missing/);
  // A tight catcher after a failure further left handles the expression so far.
  expect(answer("1 / 0 + 2 $!{0}").toString()).toBe("0");
});

Deno.test("$#.! declines with the exact original; a new error wins", () => {
  const seen = new Spy();
  const result = answer("(1 / 0) $!{($$.seen $#) .!}", { seen });
  const observation = seen.seen[0];
  expect(observation).toBeInstanceOf(FrameObservation);
  expect(result).toBe((observation as FrameObservation).original);
  expect(result.isError()).toBe(true);
  expect(observation.isError()).toBe(false);
  expect(answer("(1 / 0) $!{[].nope}").toString())
    .toMatch(/^\$!\.name-missing/);
});

Deno.test("chains: each handler sees the error the previous one left", () => {
  const tick = new Counter();
  const meta = { tick };
  expect(answer("(1 / 0) $!{$#.!} $!{$#.#}", meta).toString())
    .toBe("“division-by-zero”");
  expect(answer("(1 / 0) $!{[].nope} $!{$#.#}", meta).toString())
    .toBe("“name-missing”");
  expect(answer("(1 / 0) $!{1} $!{$$.tick ()}", meta).toString()).toBe("1");
  expect(answer("1 / 0 $! {$#.!} $! {$#.#}", meta).toString())
    .toBe("“division-by-zero”");
  expect(answer("((1 / 0) $!{[].nope}) $!{$#.#}", meta).toString())
    .toBe("“name-missing”");
  expect(tick.calls).toBe(0);
});

Deno.test("the guarded expression runs once and is not resumed", () => {
  const before = new Counter();
  const after = new Counter();
  const meta = { before, after };
  expect(
    answer("{$$.before (); 1 / 0; $$.after ()} () $!{“recovered”}", meta)
      .toString(),
  ).toBe("“recovered”");
  expect(before.calls).toBe(1);
  expect(after.calls).toBe(0);
});

Deno.test("a collected failure is a value; an extracted one is caught", () => {
  const tick = new Counter();
  expect(answer("[(1 / 0), 7] $!{$$.tick ()}", { tick }).toString())
    .toBe("[$!.division-by-zero /, 7]");
  expect(tick.calls).toBe(0);
  expect(answer("([(1 / 0)] .0) $!{1}").toString()).toBe("1");
});

Deno.test("$# is the innermost running handler's observation", () => {
  expect(answer("(1 / 0) $!{$#}").toString()).toBe("$#.division-by-zero");
  expect(answer("(1 / 0) $!{$#.#}").toString()).toBe("“division-by-zero”");
  // At any depth of the handler: here inside a branch.
  expect(answer("(1 / 0) $!{<> ? {$#.#}}").toString())
    .toBe("“division-by-zero”");
  // A handler inside a handler sees its own failure.
  expect(answer("(1 / 0) $!{([].nope $!{$#.#})}").toString())
    .toBe("“name-missing”");
  expect(answer("(1 / 0) $!{[([].nope $!{0}), $#.#]}").toString())
    .toBe("[0, “division-by-zero”]");
  // Outside every handler, and an unknown member.
  expect(answer("$#").toString()).toBe("$!.observation-missing");
  expect(answer("(1 / 0) $!{$#.x}").toString())
    .toMatch(/^\$!\.name-missing/);
});

Deno.test("$# is current while the handler expression is evaluated, not only called", () => {
  // A non-closure handler reads the observation too (PR #473 review).
  expect(answer("(1 / 0) $! $#.#").toString()).toBe("“division-by-zero”");
  expect(answer("(1 / 0) $!($#.#)").toString()).toBe("“division-by-zero”");
  expect(answer("(1 / 0) $!{$#.#}").toString()).toBe("“division-by-zero”");
  // On success the handler expression is not evaluated, so nothing reads $#.
  expect(answer("7 $! $#.#").toString()).toBe("7");
});

Deno.test("$# is dynamic and nests exactly (a13/14 §10)", () => {
  // An inner handler's observation is popped when it returns.
  expect(answer("(1 / 0) $!{[([].nope $!{$#.#}), $#.#]}").toString())
    .toBe("[“name-missing”, “division-by-zero”]");
  // After a handler returns, $# is gone.
  expect(answer("[(1 / 0) $!{0}, $#]").toString())
    .toBe("[0, $!.observation-missing]");
  // A closure a handler builds sees $# only while the handler runs.
  expect(answer(".c ((1 / 0) $!{{$#}}); c ()").toString())
    .toBe("$!.observation-missing");
  // A handler that fails still pops its observation.
  expect(answer("[((1 / 0) $!{[].nope}) $!{0}, $#]").toString())
    .toBe("[0, $!.observation-missing]");
});

Deno.test("a written system kind survives binding, arguments and copies", () => {
  // PR #473 review: the kind is carried by the literal's frame.
  expect(text(".k <$!.division-by-zero>; (1 / 0) $!{$# ~ k}"))
    .toContain("<>)]");
  expect(text(".o [1, <$!.division-by-zero>]; (1 / 0) $!{$# ~ (o .1)}"))
    .toContain("<>)]");
  expect(text(".o [1, <$!.name-missing>]; (1 / 0) $!{$# ~ (o .1)}"))
    .toContain("())]");
  expect(text(".k <$!.division-by-zero>; .g {_}; (1 / 0) $!{$# ~ (g k)}"))
    .toContain("<>)]");
  expect(text(".f {(1 / 0) $!{$# ~ __}}; f <$!.division-by-zero>"))
    .toContain("<>)]");
  expect(text(".f {(1 / 0) $!{$# ~ __}}; f <$!.name-missing>"))
    .toContain("())]");
  const literal = answer("$!.division-by-zero");
  expect(describedKind(literal)).toBe("$!.division-by-zero");
  expect(describedKind(literal.copy())).toBe("$!.division-by-zero");
  expect(kindOf(literal.copy())).toBe("$!!.division-by-zero");
});

Deno.test("kinds match by namespace and reason", () => {
  const kind = (guarded: string, schema: string): string =>
    text(`${guarded} $!{$# ~ ${schema}}`);
  expect(kind("(1 / 0)", "<$!.division-by-zero>")).toBe("[<>]");
  expect(kind("(1 / 0)", "<$!.name-missing>")).toBe("[]");
  expect(kind("[].nope", "<$!.name-missing>")).toBe("[<>]");
  expect(kind("([1] .5)", "<$!.bounds-exceeded>")).toBe("[<>]");
  expect(
    kind("(2 ** (2 ** 40))", "<$!.division-by-zero, $!.numeric-range>"),
  ).toBe("[<>]");
  // A user error matches its user kind, never the system kind of its reason.
  expect(kind("$!!.zero", "<$!!.zero>")).toBe("[<>]");
  expect(kind("$!!.zero", "<$!.zero>")).toBe("[]");
  // Written as a system kind, raised as a user error (a13/14 §4).
  expect(kind("$!.division-by-zero", "<$!!.division-by-zero>")).toBe("[<>]");
  expect(kind("$!.division-by-zero", "<$!.division-by-zero>")).toBe("[]");
});

Deno.test("typed handlers recover to nil without falling through", () => {
  const nilSafe = "{(($# ~ <$!.division-by-zero>) .!) ? {$#.!} : {()}}";
  expect(text(`(1 / 0) $!${nilSafe}`)).toBe("[]");
  expect(answer(`[].nope $!${nilSafe}`).toString())
    .toMatch(/^\$!\.name-missing/);
  const boxed = "{(($# ~ <$!.division-by-zero>) ? {[0]} : {[$#.!]}) .0}";
  expect(answer(`(1 / 0) $!${boxed}`).toString()).toBe("0");
  expect(answer(`[].nope $!${boxed}`).toString())
    .toMatch(/^\$!\.name-missing/);
});

Deno.test("a missing operand or handler is an error", () => {
  expect(answer("$! {0}").toString()).toBe("$!.catch-operand-missing");
  expect(answer("$!{0}").toString()).toBe("$!.catch-operand-missing");
  expect(answer("1 $!").toString()).toBe("$!.catch-handler-missing");
  expect(answer("1 $! $! {0}").toString()).toBe("$!.catch-handler-missing");
});

Deno.test("expressions without $! reduce as before (spec 10 §5)", () => {
  const stable = (s: string): string => text(s).replace(/\.\d+\./g, ".N.");
  for (
    const [source, expected] of [
      ["(1 .> ([].nope)) ? {1} : {2}", /^\[\$!\.name-missing/],
      ["([].nope) : {2}", /^\[\$!\.name-missing/],
      ["{([].nope); 42} ()", /^\[\$!\.name-missing/],
      ["[.a ([].nope); .b 2].b", /^\[2\]$/],
      ["[(1 / 0), 7] .1", /^\[7\]$/],
      ["<> ? {()} : {3}", /^\[3\]$/],
      ["[1, 2, 3] & {_ + 1}", /^\[\[2, 3, 4\]\]$/],
      ["$", /^\[\$\]$/],
    ] as const
  ) {
    expect(stable(source), source).toMatch(expected);
  }
});
