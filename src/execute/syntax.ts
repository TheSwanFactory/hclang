import * as _ from "lodash";
import * as frame from "../frames";
import { Lex } from "./lex";
import { Terminal, terminals } from "./terminals";

export class FrameSpace extends frame.Frame {
  public canInclude(char: string) {
    return char === "";
  }
  public isVoid() {
    return true;
  }
};

export class LexSpace extends Lex {
  public constructor() {
    super(frame.Frame.nil);
  }

  protected isEnd(char: string) {
    this.pass_on = true;
    return char !== " ";
  }
};

const tokens: frame.Context = {
 " ": new Lex(FrameSpace),
 "#": new Lex(frame.FrameComment),
 "“": new Lex(frame.FrameString, {isQuote: true}),
};

_.merge(tokens, terminals);

export const syntax: frame.Context = tokens;
