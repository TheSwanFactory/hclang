import * as _ from "lodash";
import * as frame from "../frames";
import { Lex } from "./lex";
import { Terminal, terminals } from "./terminals";

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
 " ": new LexSpace(),
 "#": new Lex(frame.FrameComment),
 "“": new Lex(frame.FrameString, {isQuote: true}),
};

_.merge(tokens, terminals);

export const syntax: frame.Context = tokens;
