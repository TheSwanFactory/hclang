import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameDateTime,
  FrameDuration,
  FrameInt,
  FrameTime,
  parseTimeLiteral,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

/** One time value from its literal body. */
const time = (body: string): Frame => parseTimeLiteral(body);

/** The rendering of one source unit's single result. */
const rendered = (source: string): string =>
  evaluate(source).toStringArray()[0];

describe("FrameTime", () => {
  it("is exported, and both kinds are peers of it", () => {
    expect(FrameDateTime.at("2026-08-21T00:00:00Z") instanceof FrameTime)
      .toBe(true);
    expect(FrameDuration.of("PT1H") instanceof FrameTime).toBe(true);
    expect(FrameDateTime.at("2026-08-21").dimension).toEqual("point");
    expect(FrameDuration.of("PT1H").dimension).toEqual("interval");
  });

  it("joins no promotion matrix, so it is inert to the numeric ladder", () => {
    expect(FrameDuration.of("PT1H").rank).toEqual(null);
    expect(FrameDateTime.at("2026-08-21").rank).toEqual(null);
  });

  describe("an instant", () => {
    it("renders canonically in UTC, so output re-reads as the same value", () => {
      expect(time("2026-08-21T00:00:00Z").toString()).toEqual(
        "%2026-08-21T00:00:00Z%",
      );
      expect(time("2026-08-21T08:30:00-07:00").toString()).toEqual(
        "%2026-08-21T15:30:00Z%",
      );
      expect(time("2026-08-21T08:30:00+0530").toString()).toEqual(
        "%2026-08-21T03:00:00Z%",
      );
    });

    it("reads a bare date as the start of that UTC day", () => {
      // A day boundary has to be pinned somewhere, and UTC is the only choice
      // that is not ambient.
      expect(time("2026-08-21").toString()).toEqual("%2026-08-21T00:00:00Z%");
    });

    it("keeps a fraction of a second, trimmed rather than padded", () => {
      expect(time("1970-01-01T00:00:00.5Z").toString()).toEqual(
        "%1970-01-01T00:00:00.5Z%",
      );
      expect(time("1970-01-01T00:00:00.000000001Z").toString()).toEqual(
        "%1970-01-01T00:00:00.000000001Z%",
      );
    });

    it("refuses a civil time with no offset, because that needs tzdata", () => {
      expect(time("2026-08-21T08:30:00").toString()).toEqual(
        "$!.time-offset-required %2026-08-21T08:30:00%",
      );
    });

    it("refuses a date the calendar does not have", () => {
      expect(time("2026-02-29").toString()).toEqual(
        "$!.time-malformed %2026-02-29%",
      );
      expect(time("2024-02-29").toString()).toEqual(
        "%2024-02-29T00:00:00Z%",
      );
      expect(time("2026-13-01").toString()).toEqual(
        "$!.time-malformed %2026-13-01%",
      );
      expect(time("2026-08-21T24:00:00Z").toString()).toEqual(
        "$!.time-malformed %2026-08-21T24:00:00Z%",
      );
    });

    it("survives the epoch and dates before it", () => {
      expect(time("1969-07-20T20:17:40Z").toString()).toEqual(
        "%1969-07-20T20:17:40Z%",
      );
      expect(time("1600-02-29").toString()).toEqual("%1600-02-29T00:00:00Z%");
    });

    it("compares by instant, so one moment spelled twice is one value", () => {
      const zulu = FrameDateTime.at("2026-08-21T15:30:00Z");
      const offset = FrameDateTime.at("2026-08-21T08:30:00-07:00");

      expect(zulu.equals(offset)).toBe(Frame.all);
      expect(zulu.equals(FrameDateTime.at("2026-08-22"))).toBe(Frame.nil);
      expect(zulu.equals(FrameDuration.of("PT1H"))).toBe(Frame.nil);
    });
  });

  describe("a duration", () => {
    it("renders canonically, with weeks folded into days", () => {
      expect(time("PT1H").toString()).toEqual("%PT1H%");
      expect(time("P1W").toString()).toEqual("%P7D%");
      expect(time("P1DT2H3M4S").toString()).toEqual("%P1DT2H3M4S%");
      expect(time("PT90M").toString()).toEqual("%PT1H30M%");
      expect(time("PT0S").toString()).toEqual("%PT0S%");
      expect(time("-PT1H").toString()).toEqual("%-PT1H%");
    });

    it("refuses a calendar quantity, which is not a fixed length", () => {
      expect(time("P1Y").toString()).toEqual(
        "$!.time-duration-calendar %P1Y%",
      );
      expect(time("P1M").toString()).toEqual(
        "$!.time-duration-calendar %P1M%",
      );
      expect(time("PT1M").toString()).toEqual("%PT1M%");
    });

    it("refuses a duration with no components at all", () => {
      expect(time("P").toString()).toEqual("$!.time-malformed %P%");
      expect(time("PT").toString()).toEqual("$!.time-malformed %PT%");
    });

    it("negates, because a displacement has a direction", () => {
      expect(rendered("- %PT1H%")).toEqual("%-PT1H%");
      expect(rendered("- %2026-08-21%")).toEqual(
        "$!.numeric-domain unary- FrameDateTime",
      );
    });
  });

  describe("the algebra, enforced from the dimensional table", () => {
    it("answers a duration for the difference of two instants", () => {
      expect(rendered("%2026-08-22T00:00:00Z% - %2026-08-21T00:00:00Z%"))
        .toEqual("%P1D%");
      expect(rendered("%2026-08-21T00:00:00Z% - %2026-08-22T00:00:00Z%"))
        .toEqual("%-P1D%");
    });

    it("answers an instant for an instant displaced by a duration", () => {
      expect(rendered("%2026-08-21T00:00:00Z% + %P1D%")).toEqual(
        "%2026-08-22T00:00:00Z%",
      );
      expect(rendered("%P1D% + %2026-08-21T00:00:00Z%")).toEqual(
        "%2026-08-22T00:00:00Z%",
      );
      expect(rendered("%2026-08-21T00:00:00Z% - %PT1H%")).toEqual(
        "%2026-08-20T23:00:00Z%",
      );
    });

    it("answers a duration for a duration scaled by a number", () => {
      expect(rendered("%PT1H% * 3")).toEqual("%PT3H%");
      expect(rendered("2 * %PT30M%")).toEqual("%PT1H%");
      expect(rendered("%PT1H% / 2")).toEqual("%PT30M%");
      expect(rendered("%PT1H% * 1.5")).toEqual("%PT1H30M%");
    });

    it("answers a number for the ratio of two durations", () => {
      expect(rendered("%P1D% / %PT1H%")).toEqual("24");
      expect(rendered("%PT1H% / %P1D%")).toEqual("1/24");
    });

    it("refuses the sum of two instants", () => {
      expect(rendered("%2026-08-21T00:00:00Z% + %2026-08-21T00:00:00Z%"))
        .toEqual("$!.numeric-domain + FrameDateTime FrameDateTime");
    });

    it("refuses an instant scaled, and a duration displaced by a number", () => {
      expect(rendered("%2026-08-21% * 2")).toEqual(
        "$!.numeric-domain * FrameDateTime FrameInt",
      );
      expect(rendered("%PT1H% + 1")).toEqual(
        "$!.numeric-domain + FrameDuration FrameInt",
      );
      expect(rendered("1 + %PT1H%")).toEqual(
        "$!.numeric-domain + FrameInt FrameDuration",
      );
      expect(rendered("%PT1H% - %2026-08-21%")).toEqual(
        "$!.numeric-domain - FrameDuration FrameDateTime",
      );
    });

    it("refuses modulo and power, which the table names no result for", () => {
      expect(rendered("%PT1H% %% %PT2H%")).toEqual(
        "$!.numeric-domain %% FrameDuration FrameDuration",
      );
      expect(rendered("%PT1H% ** 2")).toEqual(
        "$!.numeric-domain ** FrameDuration FrameInt",
      );
    });

    it("scales exactly, refusing rather than rounding into place", () => {
      expect(rendered("%PT1S% / 3")).toEqual(
        "$!.time-inexact / FrameDuration FrameInt",
      );
      expect(rendered("%PT1H% / 0")).toEqual("$!.division-by-zero /");
    });

    it("refuses an inexact scalar, so no result is ever approximate", () => {
      const inexact = evaluate("1 / 3.0").at(0);

      expect(
        FrameDuration.of("PT1H").multiply(
          inexact as unknown as FrameInt,
        ).toString(),
      ).toEqual("$!.numeric-domain * FrameDuration FrameNumber");
    });

    it("orders peers of one kind and refuses across kinds", () => {
      // A false comparison answers nil, which renders as no result at all.
      expect(rendered("%PT1H%.< %PT2H%")).toEqual("<>");
      expect(evaluate("%PT2H%.< %PT1H%").toStringArray()).toEqual([]);
      expect(rendered("%2026-08-21%.> %2026-08-20%")).toEqual("<>");
      expect(rendered("%2026-08-21%.>= %2026-08-21%")).toEqual("<>");
      expect(rendered("%PT1H%.< %2026-08-21%")).toEqual(
        "$!.numeric-domain < FrameDuration FrameDateTime",
      );
    });

    it("is exact across a scale a float would round", () => {
      expect(rendered("%PT1S% * 1000000000")).toEqual("%P11574DT1H46M40S%");
      expect(rendered("(%PT1S% * 1000000000) / 1000000000")).toEqual("%PT1S%");
      expect(rendered("%1970-01-01T00:00:00.000000001Z% - %1970-01-01%"))
        .toEqual("%PT0.000000001S%");
    });
  });

  describe("parsing performs no observation", () => {
    it("builds a value and reads nothing outside the program", () => {
      // A literal denotes without authorizing, exactly as `'…'` does. The only
      // way to learn the current instant is a clock grant.
      const before = FrameDateTime.at("2026-08-21T00:00:00Z");
      const after = FrameDateTime.at("2026-08-21T00:00:00Z");

      expect(before.nanos).toEqual(after.nanos);
      expect(before.equals(after)).toBe(Frame.all);
    });

    it("has no projection to a host number", () => {
      expect(FrameDuration.of("PT1H").valueOf().toString()).toEqual(
        "$!.numeric-domain projection FrameDuration",
      );
    });
  });

  describe("FrameDateTime.at and FrameDuration.of", () => {
    it("refuse a body of the wrong kind, because a harness misconfigured is a bug", () => {
      expect(() => FrameDateTime.at("PT1H")).toThrow(TypeError);
      expect(() => FrameDuration.of("2026-08-21")).toThrow(TypeError);
      expect(() => FrameDateTime.at("nonsense")).toThrow(TypeError);
    });
  });
});
