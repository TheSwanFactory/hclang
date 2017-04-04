import * as _ from "lodash";
import * as frame from "../frames";
import { Lex } from "./lex";
import { Terminal, terminals } from "./terminals";

type LexMap = { [key: string]: Lex; };

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

const tokens2: LexMap = {};

_.map(tokenFrames, (klass: any) => {
  const sample: frame.FrameAtom = new klass("");
  const key = sample.string_prefix();
  tokens2[key] = new Lex(klass);
});

const tokens: frame.Context = {
 " ": new Lex(FrameSpace),
 "#": new Lex(frame.FrameComment),
 "“": new Lex(frame.FrameString),
};

_.merge(tokens, terminals);

export const syntax: frame.Context = tokens;
