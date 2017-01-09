import { Frame, FrameArray, FrameLazy, FrameSymbol, Void } from "../frames";
import { Lex, LexComment, LexSpace, LexString } from "./lex";
import * as _ from "lodash";

const router = new Frame({
  "#": new LexComment(),
  " ": new LexSpace(),
  "“": new LexString(),
});

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
    console.log(`\n* pipe returned ${status}`);
  }
  return out.call(output);
};

const pipeline = (current: Frame, char: string): Frame => {
  const frameChar = FrameSymbol.for(char);
  console.log(`* pipeline ${current}.call(${frameChar})`);
  const next = current.call(frameChar);
  console.log(`** -> ${next}`);
  return next;
};
