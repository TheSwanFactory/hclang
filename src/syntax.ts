import { Frame } from "./frames";
import { pipe } from "./syntax/pipeline";

const framify = (input: string): Frame => {
  return pipe(input);
};

export const exec = (input: string) => {
  return framify(input).toString();
};
