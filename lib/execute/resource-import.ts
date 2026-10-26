import {
  EvaluationScope,
  Frame,
  FrameExpr,
  FrameGroup,
  FrameLazy,
  FrameResource,
  FrameSymbol,
  hasCharacterContent,
} from "../frames.ts";
import { EvalPipe, makeSourcePipe } from "./eval-pipe.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";
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

/** Holds what the parser emits for a quoted source, evaluating nothing. */
class QuoteSink extends Frame {
  public parsed: Frame[] = [];

  public override call(value: Frame): Frame {
    // The root pipe passes its terminal, nil, after the parsed form.
    if (!value.is.immediate && value !== Frame.nil) this.parsed.push(value);
    return this;
  }
}

/**
 * A resource read as an unevaluated closure (#443): the import, stopped
 * before evaluation.
 *
 * The characters pass through the import's own front end, so a testdoc's
 * example lines are dropped and `<-` becomes an inert import, between `{` and
 * `}`. A file's lines are therefore the comma terms of one body, as its lines
 * are one comma expression at top level, and calling the closure answers what
 * running the file answers. Nothing in the file runs until it is called. The
 * closure is bound at `site`, where the read was written, as any closure
 * written there would be.
 */
export function quoteResourceSource(
  resource: Frame,
  site?: EvaluationScope,
): Frame {
  if (!(resource instanceof FrameResource)) return sourceTypeFailure(resource);
  const sink = new QuoteSink();
  const lexer = new LexPipe(
    new ParsePipe(sink, FrameGroup, {
      importSource: evaluateResourceSource,
      strictStructure: true,
    }),
  );
  let receiver: Frame = lexer;
  const scan = (character: string): Frame | undefined => {
    receiver = sigilizer.scan(receiver, FrameSymbol.for(character));
    return receiver.isFailedResult() ? receiver : undefined;
  };
  const examples = new ExampleFilter();
  const opened = scan("{");
  if (opened) return opened;
  for (const element of resource.elements()) {
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
  for (const kept of [...examples.flush(), "\n", "}"]) {
    const failure = scan(kept);
    if (failure) return failure;
  }
  receiver = sigilizer.finish(receiver, FrameSymbol.end());
  if (receiver.isFailedResult()) return receiver;
  const finished = lexer.finish(Frame.nil);
  if (finished.isFailedResult()) return finished;

  const closure = quotedClosure(sink.parsed);
  if (!closure) {
    return Frame.error(`$!.resource-quote-syntax ${resource.toString()}`);
  }
  return site ? closure.bind(site) : closure;
}

/** The one closure a quoted source parses to, through its wrappers. */
function quotedClosure(parsed: readonly Frame[]): FrameLazy | undefined {
  let found: Frame | undefined = parsed.length === 1 ? parsed[0] : undefined;
  while (
    found && !(found instanceof FrameLazy) && found.asArray().length === 1
  ) {
    found = found.asArray()[0];
  }
  return found instanceof FrameLazy ? found : undefined;
}

FrameLazy.quote = quoteResourceSource;
