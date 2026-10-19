import {
  EvaluationScope,
  Frame,
  FrameExpr,
  FrameResource,
  FrameSymbol,
  hasCharacterContent,
} from "../frames.ts";
import { EvalPipe, makeSourcePipe } from "./eval-pipe.ts";
import { sigilizer } from "./sigilizer.ts";

/** Private output state for one imported source evaluation. */
class ImportProgress extends Frame {
  public lastResult: Frame = Frame.nil;
  public firstFailure?: Frame;

  public override collect(value: Frame): Frame {
    const answer = FrameExpr.answeredValue(value);
    if (this.firstFailure === undefined) {
      if (answer.isFailedResult()) {
        this.firstFailure = answer;
      } else {
        this.lastResult = answer;
      }
    }
    return value;
  }
}

/** The prefix of a testdoc example line, `HCEval.SOURCE`. */
const EXAMPLE = "; ";

/**
 * Drops a testdoc's example lines from imported source, so importing a file
 * runs its code and not its examples.
 *
 * A line is an example when it begins with `; ` outside prose, the same test
 * `HCEval.checkInput` applies when the file runs as a testdoc. Every example is
 * one line, and its expectation line (`# …`) is already a comment, so dropping
 * the line up to its newline leaves the rest of the source as written.
 */
class ExampleFilter {
  private head = "";
  private atLineStart = true;
  private skipping = false;

  /**
   * Answers the characters to scan for one character of source.
   *
   * @param character The next character of the source.
   * @param prose Whether the lexer is inside a document, where `; ` is text.
   * @returns The characters to scan now, possibly none.
   */
  public filter(character: string, prose: boolean): string[] {
    if (this.skipping) {
      if (character !== "\n") return [];
      this.skipping = false;
      this.atLineStart = true;
      return [character];
    }
    if (!this.atLineStart || prose) {
      this.atLineStart = character === "\n";
      return [character];
    }
    this.head += character;
    if (this.head === EXAMPLE) {
      this.head = "";
      this.atLineStart = false;
      this.skipping = true;
      return [];
    }
    if (EXAMPLE.startsWith(this.head)) return [];
    const kept = this.head.split("");
    this.head = "";
    this.atLineStart = character === "\n";
    return kept;
  }

  /** Answers any characters still held when the source ends. */
  public flush(): string[] {
    const kept = this.head.split("");
    this.head = "";
    return kept;
  }
}

type ActiveImport = {
  readonly hostNamespace: Frame;
  readonly resource: string;
};

const sourceTypeFailure = (value: Frame): Frame =>
  Frame.error(`$!.resource-import-source-type ${value.toString()}`);

/** Evaluate a resource's character elements through the existing HC pipeline. */
export function evaluateResourceSource(
  resource: FrameResource,
  scope: EvaluationScope,
): Frame {
  return evaluateResourceSourceWithChain(resource, scope, []);
}

function evaluateResourceSourceWithChain(
  resource: FrameResource,
  scope: EvaluationScope,
  activeImports: readonly ActiveImport[],
): Frame {
  const spelling = resource.toString();
  if (
    activeImports.some((active) =>
      active.hostNamespace === scope.hostNamespace &&
      active.resource === spelling
    )
  ) {
    return Frame.error(`$!.resource-import-cycle ${spelling}`);
  }

  const nextActiveImports = [
    ...activeImports,
    { hostNamespace: scope.hostNamespace, resource: spelling },
  ];
  const progress = new ImportProgress();
  const lexer = makeSourcePipe(EvalPipe.scoped(progress, scope), {
    importSource: (nestedResource, nestedScope) =>
      evaluateResourceSourceWithChain(
        nestedResource,
        nestedScope,
        nextActiveImports,
      ),
    emitCompletedForms: true,
    strictStructure: true,
  });
  let receiver: Frame = lexer;
  const scan = (character: string): Frame | undefined => {
    receiver = sigilizer.scan(receiver, FrameSymbol.for(character));
    if (receiver.isFailedResult()) return receiver;
    return progress.firstFailure;
  };
  const examples = new ExampleFilter();
  const elements = resource.elements();

  for (const element of elements) {
    if (element.isFailedResult()) return element;
    if (!hasCharacterContent(element)) return sourceTypeFailure(element);

    for (const character of element.characterContent().split("")) {
      const prose = receiver.is.document === true;
      for (const kept of examples.filter(character, prose)) {
        const failure = scan(kept);
        if (failure) return failure;
      }
    }
  }
  for (const kept of examples.flush()) {
    const failure = scan(kept);
    if (failure) return failure;
  }

  if (receiver !== lexer) {
    receiver = sigilizer.finish(receiver, FrameSymbol.end());
    if (receiver.isFailedResult()) return receiver;
    if (progress.firstFailure) return progress.firstFailure;
  }

  const finished = lexer.finish(Frame.nil);
  if (finished.isFailedResult()) return finished;
  return progress.firstFailure ?? progress.lastResult;
}
