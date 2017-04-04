import * as _ from "lodash";
import * as frame from "../frames";
import { Lex } from "./lex";
import { Terminal, terminals } from "./terminals";

export class FrameSpace extends frame.FrameAtom {
  public static readonly SPACE_CHAR = " ";

  public string_start() { return FrameSpace.SPACE_CHAR; };

  public canInclude(char: string) {
    return char === FrameSpace.SPACE_CHAR;
  }

  public isVoid() {
    return true;
  }
};

const tokenFrames = [
  FrameSpace,
  frame.FrameComment,
  frame.FrameString,
];

_.map(tokenFrames, (klass: any) => {
  const sample: frame.FrameAtom = new klass("");
  const key = sample.string_start();
  terminals[key] = new Lex(klass);
});

export const syntax: frame.Context = terminals;
