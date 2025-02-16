import { Frame } from "./frame.ts";

/**
 * StringMap is a map of strings to strings.
 */
export type StringMap = { [key: string]: string };

/**
 * Context is a map of symbols to frames.
 */
export type Context = { [key: string]: Frame };

/**
 * NilContext is an empty context.
 */
export const NilContext: Context = {};

export function contextEqual(
  left: Context,
  right: Context,
): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

export function contextString(
  context: Context,
): string {
  return Object.entries(context).map(([key, value]) => {
    if (key === Frame.kOUT) {
      return `.${key} ${value.id};`;
    } else {
      return `.${key} ${value};`;
    }
  }).join(" ");
}

export interface IKeyValuePair extends ReadonlyArray<string | Frame> {
  0: string;
  1: Frame;
}
