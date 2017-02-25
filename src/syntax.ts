// import { Frame } from "./frames";
import { evaluate } from "./syntax/evaluate";
import { framify } from "./syntax/pipeline";

export const exec = (input: string) => {
  return evaluate(input).toString();
};
