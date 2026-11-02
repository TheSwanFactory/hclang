import type { Frame } from "./frame.ts";

/**
 * Error kinds (spec a13/14 §3, §4).
 *
 * A kind is the namespace and reason an error renders with: `$!.reason` for a
 * system error, made by the interpreter, and `$!!.reason` for a user error,
 * raised by HC code. Every error's rendering begins with its kind, followed by
 * whatever subject it carries, so the kind is read from that prefix with the
 * reason grammar of spec 10 §6.1.
 *
 * A `$!.reason` literal written in HC source is a user error that still
 * describes the system kind it was written as. A schema that holds it matches
 * that system kind (§4), while raising it propagates the user error.
 */
const KIND = /^\$(!!?)\.([A-Za-z_][A-Za-z0-9_-]*)/;

/**
 * The kind a literal was written as, stored on the frame itself. It is an own
 * enumerable property, so `Frame.copy` (`Object.assign`) carries it to every
 * copy, and the kind survives wherever the literal's frame is copied.
 */
const WRITTEN: unique symbol = Symbol("written error kind");

type Described = Frame & { [WRITTEN]?: string };

/** The kind an error renders with, `$!.reason` or `$!!.reason`, if any. */
export const kindOf = (error: Frame): string | undefined => {
  const match = KIND.exec(error.toString());
  return match ? `$${match[1]}.${match[2]}` : undefined;
};

/** The reason within a kind, without its namespace. */
export const reasonOf = (error: Frame): string | undefined =>
  KIND.exec(error.toString())?.[2];

/** Records that a user error was written as the system kind `kind`. */
export const describeAs = (error: Frame, kind: string): Frame => {
  (error as Described)[WRITTEN] = kind;
  return error;
};

/** The kind a schema candidate names: as written, or as it renders. */
export const describedKind = (candidate: Frame): string | undefined =>
  (candidate as Described)[WRITTEN] ?? kindOf(candidate);
