import { pipeline } from "./syntax/pipeline";
import * as _ from "lodash";

export const exec = (input: string) => {
  const output = "";
  return _.reduce(input, pipeline, output);
};
