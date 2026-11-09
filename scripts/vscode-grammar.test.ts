import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

// The barrel import comes first so the frame classes finish initializing
// before the lexing pipeline reaches them.
import "../lib/mod.ts";
import { Frame } from "../lib/frames/frame.ts";
import { FrameArray } from "../lib/frames/frame-array.ts";
import { FrameGroup } from "../lib/frames/frame-group.ts";
import { FrameString } from "../lib/frames/frame-string.ts";
import { LexPipe } from "../lib/execute/lex-pipe.ts";
import { ParsePipe } from "../lib/execute/parse-pipe.ts";

import grammar from "../vscode-extension/syntaxes/hc.tmLanguage.json" with {
  type: "json",
};

const FILE_SCOPE = "variable.language.file-scope.hclang";
const HOST_SCOPE = "variable.language.host-scope.hclang";
const BAD_FORM = "invalid.illegal.dollar-form.hclang";
const BAD_SUFFIX = "invalid.illegal.dollar-suffix.hclang";
const anchorScopes = [FILE_SCOPE, HOST_SCOPE] as const;
const invalidScopes = [BAD_FORM, BAD_SUFFIX] as const;
const specialValues = grammar.repository["special-values"].patterns;

const ruleFor = (scope: string) => {
  const rule = specialValues.find((candidate) => candidate.name === scope);
  if (!rule) throw new Error(`missing TextMate rule: ${scope}`);
  return { scope, pattern: rule.match };
};

const anchorRules = anchorScopes.map(ruleFor);
const invalidRules = invalidScopes.map(ruleFor);

type AnchorMatch = {
  scope: string;
  text: string;
  index: number;
};

const matchesFor = (
  rules: ReadonlyArray<{ scope: string; pattern: string }>,
  source: string,
): AnchorMatch[] =>
  rules.flatMap(({ scope, pattern }) => {
    const match = new RegExp(pattern, "g").exec(source);
    return match ? [{ scope, text: match[0], index: match.index }] : [];
  });

const anchorMatches = (source: string): AnchorMatch[] =>
  matchesFor(anchorRules, source);

const invalidMatches = (source: string): AnchorMatch[] =>
  matchesFor(invalidRules, source);

Deno.test("named error highlighting stops before surrounding source (#467)", () => {
  const patterns = grammar.repository.identifiers.patterns;
  const literal = patterns.find((rule) =>
    rule.name === "constant.other.error.hclang"
  )!;
  const diagnostic = patterns.find((rule) =>
    rule.name === "constant.other.diagnostic.hclang"
  )!;
  for (const literalSource of ["$!!.invalid-scale", "$!.division-by-zero"]) {
    const source = `{ ${literalSource}; } : {1}`;
    expect(new RegExp(literal.match).exec(source)?.[0]).toEqual(literalSource);
    expect(new RegExp(diagnostic.match).test(source)).toBe(false);
  }
  expect(new RegExp(diagnostic.match).exec("$+pass;")?.[0]).toEqual(
    "$+pass;",
  );
  // The removed legacy note forms are not notes any more (a13/14 §2).
  for (const removed of ["$!missing;", "$>bounds;", "$<>type;"]) {
    expect(new RegExp(diagnostic.match).test(removed)).toBe(false);
  }
  for (const malformed of ["$!.", "$!.;", "$!.1bad", "$!!.", "$!!.1bad"]) {
    expect(new RegExp(literal.match).test(malformed)).toBe(false);
  }
});

describe("VS Code scope-anchor grammar", () => {
  it("highlights only complete file and host anchors", () => {
    expect(anchorMatches("$")).toEqual([
      { scope: FILE_SCOPE, text: "$", index: 0 },
    ]);
    expect(anchorMatches("$$")).toEqual([
      { scope: HOST_SCOPE, text: "$$", index: 0 },
    ]);
    expect(anchorMatches("$.name")).toEqual([
      { scope: FILE_SCOPE, text: "$", index: 0 },
    ]);
    expect(anchorMatches("$$.name")).toEqual([
      { scope: HOST_SCOPE, text: "$$", index: 0 },
    ]);
    expect(anchorMatches("($)")).toEqual([
      { scope: FILE_SCOPE, text: "$", index: 1 },
    ]);
  });

  it("does not restart inside invalid dollar or identifier runs", () => {
    const invalid = [
      "$$$",
      "$$$$",
      "$foo",
      "$foo$",
      "$foo$$",
      "$foo$$.name",
      "$$HOME",
      "name$",
      "name$$",
      "name-$$",
      "$!missing;",
      "$+pass;",
      "$<>type;",
    ];

    for (const source of invalid) {
      expect(anchorMatches(source)).toEqual([]);
    }
  });

  // Every spelling the lexer rejects with `invalid dollar form` should read as
  // an error rather than as unstyled text, so the two stay in step.
  it("flags the dollar spellings the lexer rejects", () => {
    const malformed = [
      "$$$",
      "$$$$",
      "$foo",
      "$$HOME",
      "$_x",
      "$1",
      "$$-foo",
      "$!missing;",
      "$>bounds;",
      "$<>type;",
      "$!!",
      "$!!x",
      "$!x",
      "$!.",
    ];
    for (const source of malformed) {
      expect(invalidMatches(source).map((match) => match.scope)).toContain(
        BAD_FORM,
      );
    }

    const abutting = [
      "name$",
      "name$$",
      "name-$$",
      "1$",
      "123$$",
      "0b101$",
      "0xff$$",
      "@ctl$",
      ".set$",
      "_$",
    ];
    for (const source of abutting) {
      expect(invalidMatches(source).map((match) => match.scope)).toContain(
        BAD_SUFFIX,
      );
    }
  });

  // The lexer accepts these, so the highlighter must not paint them as errors.
  it("leaves boundary-legal source unflagged", () => {
    const legal = [
      "$",
      "$$",
      "$.name",
      "$$.name",
      "($)",
      "($$)",
      "@$",
      ".$",
      ".+$",
      "_^$",
      "1 $",
      "$+pass;",
      "$-fail;",
      "$~todo;",
      "$=summary;",
      "$!.reason",
      "$!!.reason",
      "1 $! {0}",
      "x $!{0}",
      "$#",
      "$#.!",
      "name",
      ".set",
      "@ctl",
      "0b101",
    ];

    for (const source of legal) {
      expect(invalidMatches(source)).toEqual([]);
    }
  });
});

/** Lex one source and report the dollar verdict the highlighter must match. */
const lexVerdict = (source: string): "invalid" | "clean" | "other-error" => {
  const output = new FrameArray([]);
  const result = new FrameString(source).scanInto(
    new LexPipe(new ParsePipe(output, FrameGroup)),
  );

  if (!result.is.error) return "clean";
  return result.toString().includes("invalid dollar form")
    ? "invalid"
    : "other-error";
};

// The two halves of this PR are a lexer rule and a grammar rule that must state
// the same thing. Asserting them against hand-written lists lets them drift, so
// this runs both over one corpus and compares their verdicts directly.
describe("grammar and lexer agree on every dollar spelling", () => {
  const corpus = [
    // Anchors that stand at a boundary.
    "$",
    "$$",
    "$.name",
    "$$.name",
    "($)",
    "($$)",
    "[1, $]",
    "{$}",
    "1 $",
    // Sigils that end a token without continuing an identifier.
    "@$",
    ".$",
    ".+$",
    ".^$",
    "_^$",
    "+$",
    "<=$",
    // Testdoc notes, which the dollar family still owns.
    "$+pass;",
    "$-fail;",
    "$~todo;",
    "$=summary;",
    // Error literals, the catch operator and the observation anchor, and the
    // removed legacy note forms (a13/14 §2).
    "$!.reason",
    "$!!.reason",
    "1 $! {0}",
    "x $!{0}",
    "$#",
    "$#.!",
    "$#.#",
    "$!x",
    "$!-",
    "$!.",
    "$!missing;",
    "$>bounds;",
    "$<>type;",
    "$!!",
    "$!!x",
    // Malformed dollar runs.
    "$$$",
    "$$$$",
    "$foo",
    "$foo$",
    "$foo$$",
    "$$HOME",
    "$_x",
    "$1",
    "$$-foo",
    // Anchors abutting an identifier, one per word-shaped family.
    "name$",
    "name$$",
    "name-$$",
    "1$",
    "123$$",
    "0$",
    "0b101$",
    "0xff$$",
    "@ctl$",
    ".set$",
    "x.set$",
    "_$",
    "__$",
    "-$",
    "-$$",
    "--$",
    "1-$",
    "1-$$",
    "1 -$",
    ".-$",
    // Ordinary source with no dollar in it at all.
    "name",
    ".set",
    "@ctl",
    "0b101",
    "1 - 2",
  ];

  for (const source of corpus) {
    const verdict = lexVerdict(source);
    if (verdict === "other-error") continue;

    it(`${verdict === "invalid" ? "flags" : "accepts"} ${source}`, () => {
      const flagged = invalidMatches(source).length > 0;
      expect(flagged).toBe(verdict === "invalid");
    });
  }
});

const SIZE_SCOPE = "entity.name.function.setter.hclang";
const THIS_SCOPE = "variable.language.this.hclang";
const sizeRule = ruleFor(SIZE_SCOPE);

/** Every span the size-operator rule claims, left to right. */
const sizeMatches = (source: string): AnchorMatch[] =>
  [...source.matchAll(new RegExp(sizeRule.pattern, "g"))].map((match) => ({
    scope: SIZE_SCOPE,
    text: match[0],
    index: match.index,
  }));

const size = (text: string, index: number): AnchorMatch => ({
  scope: SIZE_SCOPE,
  text,
  index,
});

// `#` joins a dotted name only to spell exactly `.#`, `.##` or `.###` (#411,
// occurrence/figure 010.04), so these
// mirror the size-operator cases in lib/execute/lex.test.ts. They check the
// rule's own matches, so they cannot show that a comment opening first, as in
// `x #.## …#`, still wins by TextMate's earliest-match order.
describe("VS Code size-operator grammar (#411)", () => {
  it("highlights .#, .##, .### and .#### as the dotted names they lex as", () => {
    expect(sizeMatches("x.#")).toEqual([size(".#", 1)]);
    expect(sizeMatches("x.##")).toEqual([size(".##", 1)]);
    expect(sizeMatches("5.#")).toEqual([size(".#", 1)]);
    expect(sizeMatches("x.#a")).toEqual([size(".#", 1)]);
    expect(sizeMatches("x.##.#")).toEqual([size(".##", 1), size(".#", 4)]);
    expect(sizeMatches("x.###")).toEqual([size(".###", 1)]);
    expect(sizeMatches("x.###.#")).toEqual([size(".###", 1), size(".#", 5)]);
    expect(sizeMatches("x.####")).toEqual([size(".####", 1)]);
    // Inside a name `#` is an operator character, so the run is never split.
    expect(sizeMatches("x.#####")).toEqual([size(".#####", 1)]);
    expect(sizeMatches("x.#+1")).toEqual([size(".#+", 1)]);
  });
  it("highlights the Count binding and the geometric observers whole (007.41b)", () => {
    expect(sizeMatches("x.#%")).toEqual([size(".#%", 1)]);
    for (const observer of Frame.GEOMETRIC_OBSERVERS.map((k) => `.${k}`)) {
      expect(sizeMatches(`x${observer}`)).toEqual([size(observer, 1)]);
      expect(sizeMatches(`x${observer}.#`))
        .toEqual([size(observer, 1), size(".#", observer.length + 1)]);
    }
    // Spaced, `%%` is still the modulo operator.
    expect(sizeMatches("x.## %% 2")).toEqual([size(".##", 1)]);
    // An unbound spelling is still one name, as the lexer reads it.
    expect(sizeMatches("x.##%%%%")).toEqual([size(".##%%%%", 1)]);
    expect(sizeMatches("x.#%%")).toEqual([size(".#%%", 1)]);
  });

  it("leaves every other # to the comment rule", () => {
    for (const source of ["#c#", ".foo#bar#", "..#"]) {
      expect(sizeMatches(source)).toEqual([]);
    }
  });

  // The standalone-dot rule matches the dot of `x.#` too, and TextMate breaks
  // a tie at one start index by rule order.
  it("precedes the standalone-dot rule", () => {
    const thisRule = new RegExp(ruleFor(THIS_SCOPE).pattern);
    const order = specialValues.map((rule) => rule.name);

    expect(thisRule.exec("x.#")?.index).toBe(1);
    expect(order.indexOf(SIZE_SCOPE)).toBeLessThan(order.indexOf(THIS_SCOPE));
  });
});

Deno.test("the catch operator and observation anchor have their own scopes (a13/14)", () => {
  const catchRule = ruleFor("keyword.operator.catch.hclang");
  const observationRule = ruleFor("variable.language.observation.hclang");
  const first = (pattern: string, source: string): string | undefined =>
    new RegExp(pattern).exec(source)?.[0];
  expect(first(catchRule.pattern, "1 / 0 $! {0}")).toEqual("$!");
  expect(first(catchRule.pattern, "x $!{0}")).toEqual("$!");
  for (const other of ["$!.reason", "$!!.reason", "$!x", "$", "$$"]) {
    expect(first(catchRule.pattern, other), other).toBeUndefined();
  }
  expect(first(observationRule.pattern, "$#.!")).toEqual("$#");
  expect(anchorMatches("$#")).toEqual([]);
});

Deno.test("the effect arrow -> is one operator scope (006.17)", () => {
  const operators = grammar.repository.operators.patterns;
  const arrow = operators.find((rule) =>
    rule.name === "keyword.operator.effect.hclang"
  )!;
  const first = (source: string): string | undefined =>
    new RegExp(arrow.match).exec(source)?.[0];
  expect(first("owner_ -> {log_.tick_ ()}")).toEqual("->");
  expect(operators.indexOf(arrow)).toBeLessThan(
    operators.findIndex((rule) =>
      rule.name === "keyword.operator.arithmetic.hclang"
    ),
  );
  for (const other of ["a - b", "a > b", "a --> b"]) {
    expect(first(other), other).toBeUndefined();
  }
});
