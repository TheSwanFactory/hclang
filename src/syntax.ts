import { Frame } from "./frames";
import { framify } from "./syntax/pipeline";

export const exec = (input: string) => {
  return framify(input).toString();
};
