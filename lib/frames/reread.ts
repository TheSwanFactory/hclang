// Loaded by the reduce operator only. Re-reading needs FrameArg, a subclass of
// FrameSymbol, and frame-symbol.ts itself imports frame-lazy.ts, so this cannot
// live on FrameLazy without loading the subclass before its base.
import { Frame } from "./frame.ts";
import { FrameArg } from "./frame-arg.ts";
import { FrameExpr, FrameScoped } from "./frame-expr.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameName } from "./frame-name.ts";
import { FrameOperator, FrameSymbol } from "./frame-symbol.ts";
import { FrameWord } from "./frame-word.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";

/**
 * The closure a walk resumes as (#429, spec a17): the inverse of
 * `FrameLazy.elements`, bound where the fold is written.
 *
 * A walk is evaluation stopped before each term's last step, so this finishes
 * it. A word becomes the atom it spells, a lookup, an operator, a parameter or
 * a name, and a `;` word ends a statement, so the body is a sequence when one
 * was walked. Every other atom is kept as it is, a nested closure or aggregate
 * included. A lookup or compound atom the walk held with its closure's scope
 * resolves there, after the resumption's own frame and the receiver; anything
 * else resolves at `site`, as a name written there would. A fold over a
 * stream that holds a word calls this closure with the receiver, which is what
 * `{…} | (args)` means.
 */
export function closureFromAtoms(
  atoms: readonly Frame[],
  site?: EvaluationScope,
): FrameLazy {
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
    } else if (atom instanceof FrameWord && atom.spelling() === ",") {
      close(false);
    } else {
      terms.push(atomOf(atom, site));
    }
  }
  close(false);
  const body = statements.length === 1 && !sequence
    ? statements[0].asArray()
    : statements;
  const closure = new FrameLazy(body);
  if (sequence) closure.is.sequence = true;
  return site ? closure.bind(site) : closure;
}

function atomOf(atom: Frame, site?: EvaluationScope): Frame {
  if (atom instanceof FrameScoped) {
    return new Resumed(atom.term, atom.scope, site);
  }
  if (!(atom instanceof FrameWord)) return atom;
  const spelling = atom.spelling();
  if (atom.isAddress()) return new FrameName(spelling);
  if (/^_+$/.test(spelling)) return FrameArg.level(spelling.length);
  if (FrameOperator.Accepts(spelling[0])) return new FrameOperator(spelling);
  const symbol = FrameSymbol.for(spelling);
  return atom.scope ? new Resumed(symbol, atom.scope, site) : symbol;
}

/**
 * A term of a resumed body that finishes evaluating where its closure was
 * bound: the resumption's own layers first, then `scope`, read-only, and
 * never the fold's site in between (spec a17).
 */
class Resumed extends Frame {
  constructor(
    private readonly term: Frame,
    private readonly scope: EvaluationScope,
    private readonly site?: EvaluationScope,
  ) {
    super();
  }

  public override in(input: EvaluationInput = []): Frame {
    return this.term.in(
      EvaluationScope.from(input).resumedIn(this.site, this.scope),
    );
  }

  public override toString(): string {
    return this.term.toString();
  }
}
