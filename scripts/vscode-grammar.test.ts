import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

// The barrel import comes first so the frame classes finish initializing
// before the lexing pipeline reaches them.
import "../lib/mod.ts";
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
    const malformed = ["$$$", "$$$$", "$foo", "$$HOME", "$_x", "$1", "$$-foo"];
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
      "$!missing;",
      "$+pass;",
      "$-fail;",
      "$~todo;",
      "$=summary;",
      "$>bounds;",
      "$<>type;",
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
  const result = new FrameString(source).reduce(
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
    // Diagnostic notes, which the dollar family still owns.
    "$!missing;",
    "$+pass;",
    "$-fail;",
    "$~todo;",
    "$=summary;",
    "$>bounds;",
    "$<>type;",
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
