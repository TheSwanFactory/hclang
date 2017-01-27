import * as _ from "lodash";
import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { Lex, LexComment, LexSpace, LexString } from "./lex";

const lex_routes = {
  " ": new LexSpace(),
  "#": new LexComment(),
  "“": new LexString(),
};

const router = new Frame(lex_routes);

class PipelineEvaluator extends Frame {
  constructor(up: Frame, meta: Context = Void) {
    super(meta);
    this.up = up;
  }
}

class PipelineParser extends Frame {
  constructor(up: Frame, meta: Context = Void) {
    super(meta);
    this.up = up;
  }
}

class PipelineLexer extends Frame {
  constructor(up: Frame, meta: Context = Void) {
    super(meta);
    this.up = up;
  }
}

const piper = (input: string, context = Void): Frame => {
  const source = new FrameString(input);
  const result = new FrameArray([], context);
  const evaluator = new PipelineEvaluator(result);
  const parser = new PipelineParser(evaluator);
  const lexer = new PipelineLexer(parser, lex_routes);

  const status = source.reduce(lexer);
  if (status !== router) {
    console.error(`\n* pipe returned ${status}`);
  }
  return result;
};

export const framify = (input: string, context = Void): Frame => {
  const env = new Frame(context);
  const codify = new FrameLazy([]);
  const expr = pipe(input, codify);
  return expr.call(env);
};

const pipe = (input: string, out: Frame): Frame => {
  const output = new FrameArray([]);
  router.set(Lex.out, output);
  const status: Frame = _.reduce(input, pipeline, router);
  if (status !== router) {
    console.error(`\n* pipe returned ${status}`);
  }
  return out.call(output);
};

const pipeline = (current: Frame, char: string): Frame => {
  const frameChar = FrameSymbol.for(char);
  // console.error(`* pipeline ${current}.call(${frameChar})`);
  const next = current.call(frameChar);
  // console.error(`** -> ${next}`);
  return next;
};
