import { Frame, FrameString } from "../frames";
import * as _ from "lodash";

export class Router extends Frame {

};

export const pipe = (input: string): Frame => {
  const start = new FrameString("");
  const output: Frame = _.reduce(input, pipeline, start);
  return output;
};

export const pipeline = (current: Frame, char: string): Frame => {
  const frameChar = new FrameString(char);
  const next = current.call(frameChar);
  console.log(`pipeline ${next} for ${frameChar}`);
  return next;
};
