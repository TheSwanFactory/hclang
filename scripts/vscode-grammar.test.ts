import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import grammar from "../vscode-extension/syntaxes/hc.tmLanguage.json" with {
  type: "json",
};

const FILE_SCOPE = "variable.language.file-scope.hclang";
const HOST_SCOPE = "variable.language.host-scope.hclang";
const anchorScopes = [FILE_SCOPE, HOST_SCOPE] as const;
const specialValues = grammar.repository["special-values"].patterns;

const anchorRules = anchorScopes.map((scope) => {
  const rule = specialValues.find((candidate) => candidate.name === scope);
  if (!rule) throw new Error(`missing TextMate rule: ${scope}`);
  return { scope, pattern: rule.match };
});

type AnchorMatch = {
  scope: string;
  text: string;
  index: number;
};

const anchorMatches = (source: string): AnchorMatch[] =>
  anchorRules.flatMap(({ scope, pattern }) => {
    const match = new RegExp(pattern, "g").exec(source);
    return match ? [{ scope, text: match[0], index: match.index }] : [];
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
});
