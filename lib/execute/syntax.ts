/**
 * Generates HC's character-to-parser dispatch context.
 *
 * Every registered family supplies an immutable static `SYNTAX` descriptor with
 * its `SIGIL_STARTS` metadata. During reduction, a source character becomes a
 * `FrameSymbol`; looking that symbol up in `LexPipe` selects its lexical
 * receiver. Sigilizer then routes the receiver's `scan()` decisions until it
 * emits one completed atom to `ParsePipe`.
 *
 * This table performs only initial character dispatch. Registration reads
 * class-side metadata and never constructs a runtime value. Lexical boundaries
 * and transitions belong to the descriptor, while `ParsePipe` is responsible
 * only for aggregating completed frames.
 *
 * @module
 */
import * as frame from "../frames.ts";
import { Lex } from "./lex.ts";
import { LexRun } from "./lex-run.ts";
import { terminals } from "./terminals.ts";
import type { AtomSyntax, RunSyntax, SyntaxFacet } from "../scan.ts";

export const syntaxFacets: Array<SyntaxFacet> = [
  frame.FrameAlias.SYNTAX,
  frame.FrameArg.SYNTAX,
  frame.FrameBlob.SYNTAX,
  frame.FrameBytes.SYNTAX,
  frame.FrameComment.SYNTAX,
  frame.FrameDoc.SYNTAX,
  frame.FrameName.SYNTAX,
  frame.FrameNote.SYNTAX,
  frame.FrameNumber.SYNTAX,
  frame.FrameOperator.SYNTAX,
  frame.FrameString.SYNTAX,
  frame.FrameStringEnd.SYNTAX,
  frame.FrameSymbol.SYNTAX,
  frame.FrameURI.SYNTAX,
];

type LexFactory = (facet: SyntaxFacet) => frame.Frame;

const lexicalModes: Record<"atom" | "run", LexFactory> = {
  atom: (facet) => new Lex(asAtomSyntax(facet)),
  run: (facet) => new LexRun(asRunSyntax(facet)),
};

function asAtomSyntax(facet: SyntaxFacet): AtomSyntax {
  const candidate = facet as Partial<AtomSyntax> & SyntaxFacet;
  if (
    typeof candidate.recognize !== "function" ||
    typeof candidate.finish !== "function" ||
    typeof candidate.fromSource !== "function"
  ) {
    throw new Error(
      `Atom Sigil requires recognize, finish, and fromSource: ${facet.NAME}`,
    );
  }
  return candidate as AtomSyntax;
}

function asRunSyntax(facet: SyntaxFacet): RunSyntax {
  const candidate = facet as Partial<RunSyntax> & SyntaxFacet;
  if (
    typeof candidate.RUN_DELIMITER !== "string" ||
    typeof candidate.RUN_LABEL !== "string" ||
    typeof candidate.RUN_OPAQUE !== "boolean" ||
    typeof candidate.fromRun !== "function"
  ) {
    throw new Error(
      `Run-delimited Sigil requires RUN_DELIMITER, RUN_LABEL, RUN_OPAQUE, and fromRun: ${facet.NAME}`,
    );
  }
  return candidate as RunSyntax;
}

export function getSyntax(
  facets: Array<SyntaxFacet> = syntaxFacets,
): frame.Context {
  const syntax: frame.Context = { ...terminals };
  const names = new Set<string>();

  for (const facet of facets) {
    // A subclass that forgets to override SYNTAX registers its parent's.
    if (names.has(facet.NAME)) {
      throw new Error(`Duplicate syntax registration: ${facet.NAME}`);
    }
    names.add(facet.NAME);

    for (const { key, mode } of facet.SIGIL_STARTS) {
      if (mode === "push" || mode === "pop") {
        throw new Error(`Atom registered a structural Sigil mode: ${key}`);
      }
      if (syntax[key] !== undefined) {
        throw new Error(`Conflicting Sigil registration: ${key}`);
      }
      syntax[key] = lexicalModes[mode](facet);
    }
  }

  return syntax;
}
