import { Frame, FrameString } from "./frames";
import { pipeline } from "./syntax/pipeline";
import * as _ from "lodash";

 const framify = (input: string): Frame => {
  const start = new FrameString("");
  const output: Frame = _.reduce(input, pipeline, start);
  return output;
};

export const exec = (input: string) => {
  return framify(input).toString();
};
