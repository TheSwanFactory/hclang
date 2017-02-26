import { FrameArray } from "./frames";
import { evaluate } from "./syntax/evaluate";

export const execute = (input: string) => {
  const result = evaluate(input) as FrameArray;
  const array = result.toStringArray();
  return array.join("\n");
};
