import { FrameArray } from "./frames";
import { evaluate } from "./syntax/evaluate";
import { framify } from "./syntax/pipeline";

export const exec = (input: string) => {
  const result = evaluate(input) as FrameArray;
  const array = result.toStringArray();
  return array.join("\n");
};
