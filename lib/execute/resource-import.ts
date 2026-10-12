import {
  EvaluationScope,
  Frame,
  FrameExpr,
  FrameGroup,
  FrameResource,
  FrameSymbol,
  hasCharacterContent,
} from "../frames.ts";
import { EvalPipe } from "./eval-pipe.ts";
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

const sourceTypeFailure = (value: Frame): Frame =>
  Frame.error(`$!.resource-import-source-type ${value.toString()}`);

/** Evaluate a resource's character elements through the existing HC pipeline. */
export function evaluateResourceSource(
  resource: FrameResource,
  scope: EvaluationScope,
): Frame {
  const progress = new ImportProgress();
  const evaluator = EvalPipe.scoped(progress, scope);
  const parser = new ParsePipe(evaluator, FrameGroup, {
    importSource: evaluateResourceSource,
    emitCompletedForms: true,
    strictStructure: true,
  });
  const lexer = new LexPipe(parser);
  let receiver: Frame = lexer;
  const elements = resource.elements();

  for (const element of elements) {
    if (element.isFailedResult()) return element;
    if (!hasCharacterContent(element)) return sourceTypeFailure(element);

    for (const character of element.characterContent().split("")) {
      receiver = sigilizer.scan(receiver, FrameSymbol.for(character));
      if (receiver.isFailedResult()) return receiver;
      if (progress.firstFailure) return progress.firstFailure;
    }
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
