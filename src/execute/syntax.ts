import * as _ from "lodash";
import * as frame from "../frames";
import { FrameSpace } from "./frame-space";
import { Lex } from "./lex";
import { terminals } from "./terminals";

export const syntax: frame.Context = _.clone(terminals);

const atomFrames: Array<any> = [
  FrameSpace,
  frame.FrameComment,
  frame.FrameDoc,
  frame.FrameName,
  frame.FrameNumber,
  frame.FrameString,
  frame.FrameSymbol,
];

_.map(atomFrames, (klass: any) => {
  const sample: frame.FrameAtom = new klass("");
  const key = sample.string_start();
  syntax[key] = new Lex(klass);
});
