import { Frame, NilContext } from "../frames";
import { HCLang } from "./hc-lang";

export const evaluate = (input: string): Frame => {
  const hc = new HCLang();
  hc.evaluate(input);
  return hc;
};
