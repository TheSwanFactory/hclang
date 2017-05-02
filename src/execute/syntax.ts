import * as _ from "lodash";
import * as frame from "../frames";
import { FrameSpace } from "./frame-space";
import { Lex } from "./lex";
import { Terminal, terminals } from "./terminals";

const tokenFrames: Array<any> = [
  FrameSpace,
  frame.FrameComment,
  frame.FrameDoc,
  frame.FrameName,
  frame.FrameNumber,
  frame.FrameString,
  frame.FrameSymbol,
];

_.map(tokenFrames, (klass: any) => {
  const sample: frame.FrameAtom = new klass("");
  const key = sample.string_start();
  terminals[key] = new Lex(klass);
});

export const syntax: frame.Context = terminals;
