import * as _ from "lodash";
import * as frame from "../frames";
import { FrameSpace } from "./frame-space";
import { Lex } from "./lex";
import { terminals } from "./terminals";

export const syntax: frame.Context = _.clone(terminals);

const tokenFrames: Array<any> = [
  FrameSpace,
  frame.FrameComment,
  frame.FrameDoc,
  frame.FrameName,
  frame.FrameNumber,
  frame.FrameString,
  frame.FrameSymbol,
];

const add_range = (key: string, klass: any): boolean => {
  return false;
};

_.map(tokenFrames, (klass: any) => {
  const sample: frame.FrameAtom = new klass("");
  const key = sample.string_start();
  if (!add_range(key, klass)) {
    syntax[key] = new Lex(klass);
  }
});
