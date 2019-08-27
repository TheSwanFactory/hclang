import { Frame, NilContext } from "../frames";
import { HC } from "./hc-class";

export const evaluate = (input: string): Frame => {
  const hc = new HC();
  hc.evaluate(input);
  return hc;
};
