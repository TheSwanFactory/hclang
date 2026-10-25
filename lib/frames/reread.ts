// Loaded by the reduce operator only. Re-reading needs FrameArg, a subclass of
// FrameSymbol, and frame-symbol.ts itself imports frame-lazy.ts, so this cannot
// live on FrameLazy without loading the subclass before its base.
import { Frame } from "./frame.ts";
import { FrameArg } from "./frame-arg.ts";
import { FrameExpr } from "./frame-expr.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameName } from "./frame-name.ts";
import { FrameOperator, FrameSymbol } from "./frame-symbol.ts";
import { FrameWord } from "./frame-word.ts";

/**
 * The closure a walk re-reads as (#429): the inverse of `FrameLazy.elements`.
 *
 * A word becomes the atom it spells, a lookup, an operator, a parameter or a
 * name, and a `;` word ends a statement, so the body is a sequence when one was
 * walked. Every other atom is kept as it is, a nested closure or aggregate
 * included. A fold over a stream that holds a word calls this closure with the
 * receiver, which is what `{…} | (args)` means.
 */
export function closureFromAtoms(atoms: readonly Frame[]): FrameLazy {
  const statements: FrameExpr[] = [];
  let terms: Frame[] = [];
  let sequence = false;
  const close = (statement: boolean): void => {
    if (terms.length === 0 && !statement) return;
    const expr = new FrameExpr(terms);
    expr.is.statement = statement;
    statements.push(expr);
    terms = [];
  };
  for (const atom of atoms) {
    if (atom instanceof FrameWord && atom.spelling() === ";") {
      sequence = true;
      close(true);
    } else {
      terms.push(atomOf(atom));
    }
  }
  close(false);
  const body = statements.length === 1 && !sequence
    ? statements[0].asArray()
    : statements;
  const closure = new FrameLazy(body);
  if (sequence) closure.is.sequence = true;
  return closure;
}

function atomOf(atom: Frame): Frame {
  if (!(atom instanceof FrameWord)) return atom;
  const spelling = atom.spelling();
  if (atom.isAddress()) return new FrameName(spelling);
  if (/^_+$/.test(spelling)) return FrameArg.level(spelling.length);
  return FrameOperator.Accepts(spelling[0])
    ? new FrameOperator(spelling)
    : FrameSymbol.for(spelling);
}
