import { evaluate } from "./execute/evaluate";
import { FrameArray } from "./frames";

export const execute = (input: string) => {
  const result = evaluate(input) as FrameArray;
  const array = result.toStringArray();
  return array.join("\n");
};
