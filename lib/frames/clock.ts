/**
 * The clock, as a handler table entry.
 *
 * A time literal is inert data; reading the current instant is not. `now` reads
 * something outside the program, so it cannot be ambient — there is no nameable
 * primitive for it and therefore no way for a program to request one. The clock
 * is a harness grant like any other resource, spelled `'clock:now'`, and a
 * harness that installs no clock leaves the scheme an empty slot.
 *
 * Real, frozen, and scripted clocks are three entries, not three modes. The
 * program is byte-identical across all of them, exactly as it is across any other
 * handler swap, which is what finally lets a `;` source and `#` expected pair say
 * something time-dependent.
 *
 * A program with no clock cannot distinguish "no clock" from "clock refused", so
 * it cannot probe its host for one: both answers are a refusal value flowing back
 * through ordinary evaluation.
 *
 * @module
 */
import { FrameDateTime, type FrameDuration } from "./frame-time.ts";
import type {
  HandlerRead,
  HandlerWrite,
  SchemeHandler,
} from "./resource-handlers.ts";
import type { ReferenceParts } from "./resource-reference.ts";

/** The scheme a harness binds a clock to. */
export const CLOCK_SCHEME = "clock";

/** The one reading a clock answers to. */
const NOW = "now";

/** One reading, or the clock refusing to give another. */
export type ClockReading =
  | { readonly ok: true; readonly instant: FrameDateTime }
  | { readonly ok: false; readonly reason: string };

/** A source of instants, installed by a harness and never by a program. */
export interface Clock {
  /** This clock's identity, for a harness or a test, never for a program. */
  describe(): string;

  /** The current instant, or a refusal. */
  now(): ClockReading;
}

/** The host clock, which prod installs and nothing else should. */
export class RealClock implements Clock {
  public describe(): string {
    return "real";
  }

  public now(): ClockReading {
    return { ok: true, instant: FrameDateTime.fromEpochMillis(Date.now()) };
  }
}

/**
 * One instant, answered every time.
 *
 * This is what retires the deterministic-build-timestamp workaround: a
 * reproducible build pins the clock instead of deriving a substitute for one.
 */
export class FrozenClock implements Clock {
  public constructor(private readonly instant: FrameDateTime) {}

  public describe(): string {
    return `frozen ${this.instant.canonical()}`;
  }

  public now(): ClockReading {
    return { ok: true, instant: this.instant };
  }
}

/**
 * A finite script of instants, which refuses once spent.
 *
 * Exhaustion is the clock refusing, which is the general shape a time budget
 * takes: a limit on time is a duration plus a clock, not a limiter subsystem.
 */
export class ScriptedClock implements Clock {
  private next = 0;

  public constructor(private readonly readings: readonly FrameDateTime[]) {}

  public describe(): string {
    return `scripted ${this.readings.length}`;
  }

  public now(): ClockReading {
    const reading = this.readings[this.next];
    if (reading === undefined) {
      return { ok: false, reason: "clock-exhausted" };
    }
    this.next += 1;
    return { ok: true, instant: reading };
  }
}

/**
 * A clock that stops once a duration has elapsed.
 *
 * The budget is a duration value and the exhaustion is the clock refusing, so
 * nothing here is a scheduler: the first reading starts the budget and a reading
 * past it is `clock-budget-spent`.
 */
export class BudgetClock implements Clock {
  private started?: bigint;

  public constructor(
    private readonly clock: Clock,
    private readonly budget: FrameDuration,
  ) {}

  public describe(): string {
    return `budget ${this.budget.canonical()} on ${this.clock.describe()}`;
  }

  public now(): ClockReading {
    const reading = this.clock.now();
    if (!reading.ok) return reading;

    this.started ??= reading.instant.nanos;
    return reading.instant.nanos - this.started > this.budget.nanos
      ? { ok: false, reason: "clock-budget-spent" }
      : reading;
  }
}

/**
 * Binds a clock to the `clock` scheme.
 *
 * Reading answers the instant itself rather than its characters, because the
 * handler already knows the value and spelling it as text would only make every
 * reader parse it back. Writing is refused: a clock is an observation, and a
 * program that could set one could make its own history.
 */
export class ClockHandler implements SchemeHandler {
  public constructor(private readonly clock: Clock) {}

  public describe(): string {
    return `${CLOCK_SCHEME}:${this.clock.describe()}`;
  }

  public read(reference: ReferenceParts): HandlerRead {
    if (!ClockHandler.readsNow(reference)) {
      return { ok: false, reason: "clock-unreadable" };
    }
    const reading = this.clock.now();
    return reading.ok
      ? { ok: true, elements: [reading.instant] }
      : { ok: false, reason: reading.reason };
  }

  public write(_reference: ReferenceParts, _content: string): HandlerWrite {
    return { ok: false, reason: "clock-read-only" };
  }

  /** `'clock:now'` is the whole vocabulary; anything else names nothing. */
  private static readsNow(reference: ReferenceParts): boolean {
    if (reference.authority !== undefined) return false;
    if (reference.query !== undefined || reference.fragment !== undefined) {
      return false;
    }
    return (reference.path ?? "").replace(/^\/+/, "") === NOW;
  }
}
