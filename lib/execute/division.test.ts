import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";

/** A session holding a named array `xs`, a Count `n` and a class `d`. */
const session = async (): Promise<HCLang> => {
  const hc = new HCLang();
  await hc.call(".xs [1, 2, 3, 4, 5]; .ys [1, 2]; .n 6;");
  await hc.call(".plus [.+ {[“plus”, _]}]; .over [./ {[“over”, _]}];");
  return hc;
};

/** Each source's answer in the session, against its expected text. */
const answers = async (cases: Array<[string, string]>): Promise<void> => {
  const hc = await session();
  for (const [source, result] of cases) {
    expect(await hc.call(source), source).toEqual(result);
  }
};

Deno.test("literal division deals a list into n channels (007.27)", async () => {
  await answers([
    ["(xs ./ 2).channels", "[[1, 3, 5], [2, 4]]"],
    ["(xs / 2) = (xs ./ 2)", "<>"],
    ["“” (xs ./ 2)", "“RotorRouter([1, 3, 5],[2, 4])”"],
    // A division keeps its channels, so dividing it again re-deals the same
    // Frames breadth-first (007.27c).
    ["((xs ./ 2) ./ 3) = (xs ./ 3)", "<>"],
    ["((xs ./ 2) ./ 2) = (xs ./ 2)", "<>"],
    ["([1, 2, 3] ./ 3).channels", "[[1], [2], [3]]"],
    ["((1, 2, 3) ./ 2).channels", "[[1, 3], [2]]"],
    ["7 ./ 2", "7/2"],
    ["6 / 3", "2"],
    ["ys ./ 0", "$!.division-by-zero /"],
    ["ys ./ (3 - 1)", "$!.division-domain /"],
    ["ys ./ 1.5", "$!.division-domain /"],
    ["ys ./ (1 / 2)", "$!.division-domain /"],
    ["ys ./ “two”", "$!.division-domain /"],
    ["ys ./ [2]", "$!.division-domain /"],
  ]);
});

Deno.test("dotted arithmetic operators dispatch as the bare operator", async () => {
  await answers([
    // Resolved as a name, `.*` missed the named array and was found in the
    // scope the name was read in, so `ys .* 2` refused that scope's Star.
    ["ys .* 2", "[2, 4]"],
    ["[(ys ./ 2).channels]", "[[[1], [2]]]"],
    // A class's declared operator still answers its dotted spelling.
    ["plus .+ 5", "[“plus”, 5]"],
    ["over ./ 5", "[“over”, 5]"],
    [
      "[n .+ 1, n .- 1, n .* 2, n ./ 4, n .%% 4, n .** 2]",
      "[7, 5, 12, 3/2, 2, 36]",
    ],
  ]);
});
