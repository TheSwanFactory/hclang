import * as _ from "lodash";
import * as frame from "../frames";
import { FrameSpace } from "./frame-space";
import { Lex } from "./lex";
import { terminals } from "./terminals";

export const syntax: frame.Context = _.clone(terminals);

const atomClasses: Array<any> = [
  FrameSpace,
  // frame.FrameArg,
  frame.FrameComment,
  frame.FrameDoc,
  frame.FrameName,
  // frame.FrameNote,
  frame.FrameNumber,
  frame.FrameString,
  frame.FrameSymbol,
];

const listClasses: Array<any> = [
];

_.map(atomClasses, (klass: any) => {
  const sample: frame.FrameAtom = new klass("");
  const key = sample.string_start();
  syntax[key] = new Lex(klass);
});
