import { Context, Frame, NilContext } from "../frames";
import { HC } from "./hc";

export const evaluate = (input: string, context = NilContext): Frame => {
  const hc = new HC(context);
  hc.evaluate(input);
  return hc;
};
