import { evaluate } from "./evaluate.ts";
import type { FrameArray } from "../frames.ts";

const stripLastCommas = (array: Array<string>) => {
  const result = array.map((item) => {
    const n = item.length - 1;
    if (item[n] === ",") {
      return item.substring(0, n);
    }
    return item;
  });
  return result;
};

export const execute = (input: string): string => {
  const result = evaluate(input) as FrameArray;
  const array = result.toStringArray();
  const stripped = stripLastCommas(array);
  return stripped.join("\n");
};
