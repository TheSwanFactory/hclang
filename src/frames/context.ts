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

/**
 * contextEqual compares two contexts for equality.
 * 
 * @param left 
 * @param right 
 * @returns true if the contexts are equal
 */
export function contextEqual(
  left: Context,
  right: Context,
): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  console.log(`contextEqual.keys`, keys);
  for (const key of keys) {
    const lvalue = left[key];
    const rvalue = right[key];
    console.log(`contextEqual.${key}`, lvalue, rvalue);
    if (!lvalue || !rvalue || !lvalue.isEqualTo(rvalue)) {
      return false;
    }
  }
  return true;
}

/**
 * contextString returns a string representation of the context.
 * 
 * @param context 
 * @returns a string
 */
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

/**
 * IKeyValuePair is a tuple of a string and a Frame.
 */
/**
 * Represents a key-value pair where the key is a string and the value is a Frame.
 * This interface extends ReadonlyArray with the first element being a string (key)
 * and the second element being a Frame (value).
 *
 * @interface IKeyValuePair
 * @extends {ReadonlyArray<string | Frame>}
 * @property {string} 0 - The key of the key-value pair.
 * @property {Frame} 1 - The value of the key-value pair.
 */
export interface IKeyValuePair extends ReadonlyArray<string | Frame> {
  /**
   * The key of the key-value pair.
   */
  0: string;
  /**
   * The value of the key-value pair.
   */
  1: Frame;
}
