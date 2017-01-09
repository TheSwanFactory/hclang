import { Frame, FrameArray, FrameSymbol } from "../frames";
import { Lex, LexComment, LexSpace, LexString } from "./lex";
import * as _ from "lodash";

const router = new Frame({
  "#": new LexComment(),
  " ": new LexSpace(),
  "“": new LexString(),
});

export const pipe = (input: string): Frame => {
  const output = new FrameArray([]);
  router.set(Lex.out, output);
  const status: Frame = _.reduce(input, pipeline, router);
  if (status !== router) {
    console.log(`\n* pipe returned ${status}`);
  }
  return output;
};

const pipeline = (current: Frame, char: string): Frame => {
  const frameChar = FrameSymbol.for(char);
  console.log(`* pipeline ${current}.call(${frameChar})`);
  const next = current.call(frameChar);
  console.log(`** -> ${next}`);
  return next;
};
