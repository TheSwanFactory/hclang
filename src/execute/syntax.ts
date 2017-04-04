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

const tokens2: frame.Context = {};

_.map(tokenFrames, (klass: any) => {
  const sample: frame.FrameAtom = new klass("");
  const key = sample.string_start();
  tokens2[key] = new Lex(klass);
});

const tokens: frame.Context = {
 " ": new Lex(FrameSpace),
 "#": new Lex(frame.FrameComment),
 "“": new Lex(frame.FrameString),
};

console.log(tokens);
console.log(tokens2);

_.merge(tokens2, terminals);

export const syntax: frame.Context = tokens;
