import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  FrameArg,
  FrameBytes,
  FrameDoc,
  FrameNumber,
  FrameString,
  FrameStringEnd,
} from "../frames.ts";
import { getSyntax, syntaxFacets } from "./syntax.ts";
import type { SyntaxFacet } from "../scan.ts";

describe("getSyntax", () => {
  it("registers every start of every family without building a value", () => {
    const syntax = getSyntax();
    const starts = syntaxFacets.flatMap((facet) => facet.SIGIL_STARTS);

    starts.forEach(({ key }) => expect(syntax[key]).toBeTruthy());
  });

  it("names each lexer from its descriptor", () => {
    const syntax = getSyntax();

    expect(syntax["\\"].toString()).toContain("FrameBytes");
    expect(syntax["“"].toString()).toContain("FrameString");
    expect(syntax["`"].toString()).toContain("FrameDoc");
  });

  it("rejects an atom start without a recognizer", () => {
    const runOnly: SyntaxFacet = {
      NAME: "RunOnly",
      SIGIL_STARTS: [{ key: "%%", mode: "atom" }],
      RUN_DELIMITER: "%",
      RUN_LABEL: "run-only",
      RUN_OPAQUE: false,
      fromRun: FrameDoc.fromRun,
    } as SyntaxFacet;

    expect(() => getSyntax([runOnly])).toThrow(
      "Atom Sigil requires recognize and finish: RunOnly",
    );
  });

  it("permits result-completed families to omit a source factory", () => {
    expect(FrameArg.SYNTAX.fromSource).toBeUndefined();
    expect(FrameBytes.SYNTAX.fromSource).toBeUndefined();
    expect(FrameStringEnd.SYNTAX.fromSource).toBeUndefined();
  });

  it("rejects a run start without run metadata", () => {
    const atomOnly: SyntaxFacet = {
      ...FrameNumber.SYNTAX,
      NAME: "AtomOnly",
      SIGIL_STARTS: [{ key: "%%", mode: "run" }],
    };

    expect(() => getSyntax([atomOnly])).toThrow(
      "Run-delimited Sigil requires",
    );
  });

  it("rejects a subclass that inherits its parent's descriptor", () => {
    expect(() => getSyntax([FrameString.SYNTAX, FrameString.SYNTAX])).toThrow(
      "Duplicate syntax registration: FrameString",
    );
  });

  it("rejects two families that claim one start", () => {
    const clash: SyntaxFacet = {
      ...FrameNumber.SYNTAX,
      NAME: "Clash",
      SIGIL_STARTS: FrameBytes.SIGIL_STARTS,
    };

    expect(() => getSyntax([FrameBytes.SYNTAX, clash])).toThrow(
      "Conflicting Sigil registration: \\",
    );
  });
});
