import { Frame, FrameString } from "../frames";
import * as _ from "lodash";

export const pipe = (input: string): Frame => {
  const start = new FrameString("");
  const output: Frame = _.reduce(input, pipeline, start);
  return output;
};

export const pipeline = (output: FrameString, char: string): Frame => {
  const frameChar = new FrameString(char);
  const result = output.call(frameChar);
  console.log(`pipeline ${result} for ${frameChar}`);
  return result;
};
