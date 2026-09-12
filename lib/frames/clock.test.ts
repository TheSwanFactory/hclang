import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  BudgetClock,
  type Clock,
  CLOCK_SCHEME,
  ClockHandler,
  FrameDateTime,
  FrameDuration,
  FrameResource,
  FrozenClock,
  MemoryStore,
  RealClock,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
  ScriptedClock,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

/** The one source every clock in this file is asked to answer. */
const READ_NOW = "'clock:now' | []";

/** Evaluates source under a harness that installed this clock, or none. */
const underClock = (source: string, clock?: Clock): string[] =>
  evaluate(source, {
    [RESOURCE_ROOT_KEY]: FrameResource.root(
      new MemoryStore(),
      clock === undefined
        ? ResourceHandlers.none
        : ResourceHandlers.of({ [CLOCK_SCHEME]: new ClockHandler(clock) }),
    ),
  }).toStringArray().map((line) =>
    line.endsWith(",") ? line.slice(0, -1) : line
  );

const pinned = (text: string): FrozenClock =>
  new FrozenClock(FrameDateTime.at(text));

describe("the clock as a grant", () => {
  it("has no ambient spelling, so a program cannot name one", () => {
    // `now` is an observation, and there is no vocabulary for requesting it:
    // the bare name resolves to nothing, with or without a clock installed.
    expect(evaluate("now").toStringArray()[0]).toContain("$!.name-missing");
    expect(underClock("now", pinned("2026-08-21T00:00:00Z"))[0]).toContain(
      "$!.name-missing",
    );
  });

  it("is an empty slot until a harness installs one", () => {
    expect(underClock(READ_NOW)).toEqual([
      "[$!.resource-scheme-unbound 'clock:now']",
    ]);
  });

  it("reads through the handler once installed", () => {
    expect(underClock(READ_NOW, pinned("2026-08-21T00:00:00Z"))).toEqual([
      "[%2026-08-21T00:00:00Z%]",
    ]);
  });

  it("answers the instant itself, not characters to parse back", () => {
    expect(underClock(
      "('clock:now' | []) .0 .> %2026-08-20T00:00:00Z%",
      pinned("2026-08-21T00:00:00Z"),
    )).toEqual(["<>"]);
  });

  it("refuses a write, because an observation is not a setting", () => {
    expect(underClock("'clock:now' “2020-01-01”", pinned("2026-08-21")))
      .toEqual(["$!.clock-read-only 'clock:now'"]);
  });

  it("names nothing but `now`", () => {
    const clock = pinned("2026-08-21T00:00:00Z");

    expect(underClock("'clock:tomorrow' | []", clock)).toEqual([
      "[$!.clock-unreadable 'clock:tomorrow']",
    ]);
    expect(underClock("'clock:' | []", clock)).toEqual([
      "[$!.clock-unreadable 'clock:']",
    ]);
    expect(underClock("'clock://elsewhere/now' | []", clock)).toEqual([
      "[$!.clock-unreadable 'clock://elsewhere/now']",
    ]);
  });

  it("keeps the URI components of the reference readable", () => {
    expect(underClock("'clock:now' .scheme", pinned("2026-08-21"))).toEqual([
      "“clock”",
    ]);
  });

  describe("the same source across every clock", () => {
    it("is byte-identical, and only the entry decides what it answers", () => {
      const frozen = pinned("2026-08-21T00:00:00Z");
      const scripted = new ScriptedClock([
        FrameDateTime.at("2001-01-01T00:00:00Z"),
      ]);

      expect(underClock(READ_NOW, frozen)).toEqual([
        "[%2026-08-21T00:00:00Z%]",
      ]);
      expect(underClock(READ_NOW, scripted)).toEqual([
        "[%2001-01-01T00:00:00Z%]",
      ]);
      // The real clock cannot be pinned, so what is asserted of it is the shape:
      // one instant, later than a date already past.
      expect(underClock(
        "('clock:now' | []) .0 .> %2020-01-01T00:00:00Z%",
        new RealClock(),
      )).toEqual(["<>"]);
    });

    it("yields no reading whether the clock is absent or refusing", () => {
      const spent = new ScriptedClock([]);

      // What holds: neither path produces an instant, and both arrive as a
      // value the iteration collects rather than as something that raises.
      for (
        const answer of [underClock(READ_NOW), underClock(READ_NOW, spent)]
      ) {
        expect(answer[0]).toContain("$!.");
        expect(answer[0]).not.toContain("%");
      }
    });

    it("names those two refusals differently, so they are distinguishable", () => {
      // What does not hold is a07 §7's stronger claim. Refusals are nameable
      // throughout the resource primitive, so a program reading one can tell an
      // unbound scheme from a clock that declined. Pinned here because the
      // property is a design tension worth failing loudly if it changes, not an
      // implementation detail: see spec/a12-resource-frames.md.
      expect(underClock(READ_NOW)).toEqual([
        "[$!.resource-scheme-unbound 'clock:now']",
      ]);
      expect(underClock(READ_NOW, new ScriptedClock([]))).toEqual([
        "[$!.clock-exhausted 'clock:now']",
      ]);
    });
  });
});

describe("clock implementations", () => {
  /** The instant a clock reported, spelled canonically, or its refusal. */
  const reading = (clock: Clock): string => {
    const answer = clock.now();
    return answer.ok ? answer.instant.canonical() : `$!.${answer.reason}`;
  };

  it("frozen answers one instant every time", () => {
    const clock = pinned("2026-08-21T00:00:00Z");

    expect(clock.describe()).toEqual("frozen 2026-08-21T00:00:00Z");
    expect(reading(clock)).toEqual("2026-08-21T00:00:00Z");
    expect(reading(clock)).toEqual("2026-08-21T00:00:00Z");
  });

  it("real answers an instant that has already happened", () => {
    const clock = new RealClock();
    const first = clock.now();

    expect(clock.describe()).toEqual("real");
    expect(first.ok).toBe(true);
    expect(first.ok && first.instant.nanos > 0n).toBe(true);
  });

  it("scripted answers each reading once, then refuses", () => {
    const clock = new ScriptedClock([
      FrameDateTime.at("2026-08-21T00:00:00Z"),
      FrameDateTime.at("2026-08-21T00:00:01Z"),
    ]);

    expect(reading(clock)).toEqual("2026-08-21T00:00:00Z");
    expect(reading(clock)).toEqual("2026-08-21T00:00:01Z");
    expect(reading(clock)).toEqual("$!.clock-exhausted");
  });

  it("exhaustion arrives as a refusal the iteration collects", () => {
    expect(underClock(READ_NOW, new ScriptedClock([]))).toEqual([
      "[$!.clock-exhausted 'clock:now']",
    ]);
  });

  describe("a budget is a duration plus a clock", () => {
    const readings = (...instants: string[]): ScriptedClock =>
      new ScriptedClock(instants.map((text) => FrameDateTime.at(text)));

    it("answers while the budget holds", () => {
      const clock = new BudgetClock(
        readings("2026-08-21T00:00:00Z", "2026-08-21T00:00:30Z"),
        FrameDuration.of("PT1M"),
      );

      expect(clock.now().ok).toBe(true);
      expect(clock.now().ok).toBe(true);
    });

    it("refuses once the duration is spent", () => {
      const clock = new BudgetClock(
        readings("2026-08-21T00:00:00Z", "2026-08-21T00:02:00Z"),
        FrameDuration.of("PT1M"),
      );

      expect(clock.now().ok).toBe(true);
      expect(clock.now()).toEqual({ ok: false, reason: "clock-budget-spent" });
    });

    it("reports that refusal to the program as an error frame", () => {
      const clock = new BudgetClock(
        readings("2026-08-21T00:00:00Z", "2026-08-21T01:00:00Z"),
        FrameDuration.of("PT1S"),
      );
      clock.now();

      expect(underClock(READ_NOW, clock)).toEqual([
        "[$!.clock-budget-spent 'clock:now']",
      ]);
    });

    it("describes the budget it was given, for a harness to audit", () => {
      const clock = new BudgetClock(
        pinned("2026-08-21T00:00:00Z"),
        FrameDuration.of("PT90S"),
      );

      expect(clock.describe()).toEqual(
        "budget PT1M30S on frozen 2026-08-21T00:00:00Z",
      );
    });
  });
});

describe("ClockHandler", () => {
  it("describes itself for a harness, never for a program", () => {
    const handler = new ClockHandler(pinned("2026-08-21T00:00:00Z"));

    expect(handler.describe()).toEqual(
      "clock:frozen 2026-08-21T00:00:00Z",
    );
  });

  it("is installed under the scheme a program spells", () => {
    expect(CLOCK_SCHEME).toEqual("clock");
  });
});
