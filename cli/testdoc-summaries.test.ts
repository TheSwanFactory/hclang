import { expect } from "@std/expect";
import {
  ALLOW_REGRESSION,
  readSummaries,
  recordedFiles,
  reviewTable,
  type TestdocSummary,
} from "./testdoc-summaries.ts";

Deno.test("records a summary for every testdoc", async () => {
  // A new testdoc needs an entry: `cd cli && deno task testdoc:summaries`.
  expect(Object.keys(await readSummaries())).toEqual(await recordedFiles());
});

const counts = (
  total: number,
  pass: number,
  fail = 0,
  unimplemented = 0,
): TestdocSummary => ({ total, pass, fail, unimplemented });

Deno.test("the summaries generator reports and guards each file's counts", async (t) => {
  const previous = { "a.hc": counts(4, 4), "b.hc": counts(2, 2) };

  await t.step("prints each file's old and new counts", () => {
    const { report } = reviewTable(
      previous,
      { "a.hc": counts(5, 5), "b.hc": counts(2, 2), "c.hc": counts(1, 1) },
      [],
    );
    expect(report).toEqual([
      "a.hc: total 4, pass 4, fail 0, unimplemented 0 → " +
      "total 5, pass 5, fail 0, unimplemented 0",
      "b.hc: total 2, pass 2, fail 0, unimplemented 0 → " +
      "total 2, pass 2, fail 0, unimplemented 0",
      "c.hc: none → total 1, pass 1, fail 0, unimplemented 0",
    ]);
  });

  await t.step("writes a table where no count regresses", () => {
    expect(
      reviewTable(previous, { ...previous, "a.hc": counts(6, 6) }, []).refusal,
    ).toBeUndefined();
  });

  await t.step(
    "refuses a dropped total or pass, a risen fail, or a lost file",
    () => {
      for (
        const next of [
          { ...previous, "a.hc": counts(3, 3) },
          { ...previous, "a.hc": counts(4, 3, 0, 1) },
          { ...previous, "a.hc": counts(5, 4, 1) },
          { "a.hc": counts(4, 4) },
        ]
      ) {
        const { refusal } = reviewTable(previous, next, []);
        expect(refusal).toContain("regressed; nothing written");
        expect(refusal).toContain(ALLOW_REGRESSION);
      }
      expect(
        reviewTable(previous, { "a.hc": counts(3, 3) }, []).refusal,
      ).toContain("a.hc, b.hc regressed");
    },
  );

  await t.step("writes a regressed table when the flag is given", () => {
    expect(
      reviewTable(previous, { "a.hc": counts(3, 3) }, [ALLOW_REGRESSION])
        .refusal,
    ).toBeUndefined();
  });
});
