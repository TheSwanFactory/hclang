import { Frame, FrameArray, FrameSymbol } from "../frames";
import { Lex, LexComment, LexString } from "./lex";
import * as _ from "lodash";

const router = new Frame({
  "“": new LexString(),
  "#": new LexComment(),
});

export const pipe = (input: string): Frame => {
  const output = new FrameArray([]);
  router.set(Lex.out, output);
  const status: Frame = _.reduce(input, pipeline, router);
  return output;
};

const pipeline = (current: Frame, char: string): Frame => {
  const frameChar = FrameSymbol.for(char);
  console.log(`* pipeline ${current}.call(${frameChar})`);
  const next = current.call(frameChar);
  console.log(`** -> ${next}`);
  return next;
};
