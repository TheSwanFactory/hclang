/**
 * The conformance matrix of specs 12 §9, 12a §4, 12b §5 and 12c §4, run
 * against both spike variants. Run with
 * `deno test experiments/a13-recovery-spike`.
 *
 * Variant A spells `E ⟨recover⟩ H` as `$$.recover {E} H`; variant B as
 * `E catch H`.
 *
 * @module
 */
import { expect } from "jsr:@std/expect@^0.219.1";
import { evaluate } from "../../lib/execute/evaluate.ts";
import { Frame, FrameExpr } from "../../lib/frames.ts";
import {
  EagerCatcher,
  installCatchBoundary,
  Observation,
  reasonOf,
  Recover,
} from "./spike.ts";

/**
 * Counts its calls. A host binding is copied when it is installed, so the
 * count lives in an object the copies share, as in `error-policy.test.ts`.
 */
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
  public seen: Frame[] = [];
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

type Spell = (guarded: string, ...handlers: string[]) => string;

/** Variant A: each handler wraps the expression so far in a block. */
const prefix: Spell = (guarded, ...handlers) =>
  handlers.reduce((e, h) => `$$.recover {${e}} ${h}`, guarded);

/** Variant B: infix, left to right. */
const infix: Spell = (guarded, ...handlers) =>
  [guarded, ...handlers].join(" catch ");

const variants: [string, Spell][] = [["A prefix", prefix], ["B infix", infix]];

/** Runs `body` once per variant, with B's boundary installed only for B. */
const eachVariant = (body: (spell: Spell, name: string) => void): void => {
  for (const [name, spell] of variants) {
    const restore = spell === infix ? installCatchBoundary() : () => {};
    try {
      body(spell, name);
    } finally {
      restore();
    }
  }
};

const recover = new Recover();

Deno.test("baseline: an eager receiver never sees a failing term", () => {
  const catcher = new EagerCatcher();
  expect(text("$$.catcher (1 / 0)", { catcher })).toBe(
    "[$!.division-by-zero /]",
  );
  expect(catcher.reached).toBe(0);
  // And without the boundary, the infix spelling just propagates.
  expect(text("1 / 0 catch {0}")).toBe("[$!.division-by-zero /]");
});

Deno.test("reasons are read after any failure label (12c §2)", () => {
  const reason = (source: string): string | undefined =>
    reasonOf(answer(source));
  expect(reason("1 / 0")).toBe("division-by-zero");
  expect(reason("[].nope")).toBe("name-missing");
  expect(reason("[1] .5")).toBe("bounds-exceeded");
  expect(reason("2 ** (2 ** 40)")).toBe("numeric-range");
  expect(reason("$!.zero")).toBe("zero");
});

Deno.test("success passes through and never evaluates the handler", () => {
  eachVariant((spell, name) => {
    const tick = new Counter();
    const meta = { recover, tick };
    expect(answer(spell("7", "{$$.tick ()}"), meta).toString(), name).toBe(
      "7",
    );
    // Not even an eager handler expression is evaluated on success.
    if (spell === infix) {
      expect(answer(spell("7", "($$.tick ())"), meta).toString()).toBe("7");
    }
    expect(tick.calls, name).toBe(0);
  });
});

Deno.test("recover, recover to nil, and recover after a conditional", () => {
  eachVariant((spell, name) => {
    const meta = { recover };
    expect(answer(spell("1 / 0", "{0}"), meta).toString(), name).toBe("0");
    expect(text(spell("1 / 0", "{()}"), meta), name).toBe("[]");
    expect(
      answer(spell("((1 / 0) ? {1} : {2})", "{0}"), meta).toString(),
      name,
    ).toBe("0");
  });
});

Deno.test("decline answers the exact original frame", () => {
  eachVariant((spell, name) => {
    const seen = new Spy();
    const meta = { recover, seen };
    const result = answer(spell("1 / 0", "{($$.seen _) .error}"), meta);
    const observation = seen.seen[0] as Observation;
    expect(observation, name).toBeInstanceOf(Observation);
    expect(result, name).toBe(observation.original);
    // Observing never cleared the flag (12 §3.1).
    expect(observation.original.isError(), name).toBe(true);
    expect(observation.isError(), name).toBe(false);
  });
});

Deno.test("handler failure wins, and chains see the error left behind", () => {
  eachVariant((spell, name) => {
    const tick = new Counter();
    const meta = { recover, tick };
    expect(answer(spell("1 / 0", "{[].nope}"), meta).toString(), name)
      .toMatch(/^\$!\.name-missing/);
    // Chain after decline: the next handler sees the original.
    expect(
      answer(spell("1 / 0", "{_ .error}", "{_ .reason}"), meta).toString(),
      name,
    ).toBe("“division-by-zero”");
    // Chain after failure: the next handler sees the handler's failure.
    expect(
      answer(spell("1 / 0", "{[].nope}", "{_ .reason}"), meta).toString(),
      name,
    ).toBe("“name-missing”");
    // Chain after success: later handlers do not run.
    expect(
      answer(spell("1 / 0", "{1}", "{$$.tick ()}"), meta).toString(),
      name,
    ).toBe("1");
    expect(tick.calls, name).toBe(0);
  });
});

Deno.test("the guarded expression runs once, and recovery does not resume it", () => {
  eachVariant((spell, name) => {
    const before = new Counter();
    const after = new Counter();
    const meta = { recover, before, after };
    const source = spell(
      "{$$.before (); 1 / 0; $$.after ()} ()",
      "{“recovered”}",
    );
    expect(answer(source, meta).toString(), name).toBe("“recovered”");
    expect(before.calls, name).toBe(1);
    expect(after.calls, name).toBe(0);
  });
});

Deno.test("collected failures are values; extracted ones recover", () => {
  eachVariant((spell, name) => {
    const tick = new Counter();
    const meta = { recover, tick };
    expect(
      answer(spell("[(1 / 0), 7]", "{$$.tick ()}"), meta).toString(),
      name,
    ).toBe("[$!.division-by-zero /, 7]");
    expect(tick.calls, name).toBe(0);
    expect(answer(spell("([(1 / 0)] .0)", "{1}"), meta).toString(), name)
      .toBe("1");
  });
});

Deno.test("kinds match by reason, across labels and subjects", () => {
  eachVariant((spell, name) => {
    const meta = { recover };
    const kind = (guarded: string, schema: string): string =>
      text(spell(guarded, `{_ ~ ${schema}}`), meta);
    expect(kind("1 / 0", "<$!.division-by-zero>"), name).toBe("[<>]");
    expect(kind("1 / 0", "<$!.name-missing>"), name).toBe("[]");
    expect(kind("[].nope", "<$!.name-missing>"), name).toBe("[<>]");
    expect(kind("[1] .5", "<$!.bounds-exceeded>"), name).toBe("[<>]");
    expect(
      kind("2 ** (2 ** 40)", "<$!.division-by-zero, $!.numeric-range>"),
      name,
    ).toBe("[<>]");
  });
});

Deno.test("typed handlers: nil-safe and boxed shapes (12c §1)", () => {
  eachVariant((spell, name) => {
    const meta = { recover };
    const nilSafe = "{((_ ~ <$!.division-by-zero>) .!) ? {__ .error} : {()}}";
    expect(text(spell("1 / 0", nilSafe), meta), name).toBe("[]");
    expect(answer(spell("[].nope", nilSafe), meta).toString(), name)
      .toMatch(/^\$!\.name-missing/);
    const boxed = "{((_ ~ <$!.division-by-zero>) ? {[0]} : {[__ .error]}) .0}";
    expect(answer(spell("1 / 0", boxed), meta).toString(), name).toBe("0");
    expect(answer(spell("[].nope", boxed), meta).toString(), name)
      .toMatch(/^\$!\.name-missing/);
    // The trap: a nil recovery in the then-branch falls through to decline.
    const trap = "{(_ ~ <$!.division-by-zero>) ? {()} : {__ .error}}";
    expect(answer(spell("1 / 0", trap), meta).toString(), name)
      .toBe("$!.division-by-zero /");
  });
});

Deno.test("nested boundaries: an outer handler sees an inner handler's failure", () => {
  eachVariant((spell, name) => {
    const meta = { recover };
    const inner = spell("1 / 0", "{[].nope}");
    expect(answer(spell(`(${inner})`, "{_ .reason}"), meta).toString(), name)
      .toBe("“name-missing”");
  });
});

Deno.test("variant B leaves expressions without catch unchanged (spec 10 §5)", () => {
  const sources = [
    "([].nope) .> 1",
    "1 = ([].nope)",
    "(1 .> ([].nope)) ? {1} : {2}",
    "(1 + ([].nope)) ? {1} : {2}",
    "([].nope) : {2}",
    "{([].nope); 42} ()",
    "[.a ([].nope); .b 2].b",
    "[(1 / 0), 7] .1",
    "<> ? {()} : {3}",
    "() : {4}",
    "[1, 2, 3] & {_ + 1}",
  ];
  // Object ids in diagnostics change from run to run.
  const stable = (s: string): string => text(s).replace(/\.\d+\./g, ".N.");
  const before = sources.map(stable);
  const restore = installCatchBoundary();
  try {
    expect(sources.map(stable)).toEqual(before);
  } finally {
    restore();
  }
});

Deno.test("the scope anchors still work beside the spike", () => {
  eachVariant((spell, name) => {
    const tick = new Counter();
    expect(text("$", { recover, tick }), name).toBe("[$]");
    expect(answer(spell("$$.tick ()", "{0}"), { recover, tick }).toString())
      .toBe("1");
  });
});
