import { Context, Frame, FrameArray, FrameString, NilContext } from "../frames";
import { EvalPipe } from "./eval-pipe";
import { GroupPipe } from "./group-pipe";
import { HC } from "./hc";
import { LexPipe } from "./lex-pipe";
import { ParsePipe } from "./parse-pipe";

export const evaluate = (input: string, context = NilContext): Frame => {
  const hc = new HC(context);
  const result = hc.evaluate(input);
  return result;
};
