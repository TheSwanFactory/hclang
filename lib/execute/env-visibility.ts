/**
 * Which environment variables a harness lets an HC program see.
 *
 * This is the declaration whose absence was the defect: the whole process
 * environment used to reach `$$`, so the perimeter was nameable but unbounded.
 * The dictionary bounds it, and it is deliberately neither a narrowing of
 * `Deno.env` nor an `--allow-env` scope. A curated default is the thing a
 * per-invocation flag cannot express — it is a property of the runtime, written
 * once, and it covers the variables tooling probes, which is what makes a narrow
 * grant workable rather than theoretical.
 *
 * A variable outside the dictionary is absent, not refused. An ungranted thing
 * is nonexistent from inside the program, so there is no discrimination channel:
 * `$$.SECRET` reports a missing name exactly as `$$.TYPO` does, and neither
 * answer says anything about the host.
 *
 * @module
 */
import type { StringMap } from "../frames.ts";

/**
 * Standard UNIX variables, which describe the invocation rather than the host's
 * secrets. Every one of these is already visible to anything the user runs.
 */
const UNIX_VARIABLES = [
  "HOME",
  "HOSTNAME",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "LOGNAME",
  "PATH",
  "PWD",
  "SHELL",
  "SHLVL",
  "TMPDIR",
  "TZ",
  "USER",
] as const;

/**
 * Variables open-source tooling probes.
 *
 * This group is load-bearing rather than generous: the CLI's own dependency
 * tree reads the colour-support family, and `DEBUG`/`DEBUG_ENV` are read by the
 * logger and the context builder. Omitting them would leave a dictionary that
 * looks tidy and breaks the harness that uses it.
 */
const TOOLING_VARIABLES = [
  "CI",
  "COLORTERM",
  "DEBUG",
  "DEBUG_ENV",
  "EDITOR",
  "FORCE_COLOR",
  "NO_COLOR",
  "PAGER",
  "TERM",
  "TERM_PROGRAM",
  "TERM_PROGRAM_VERSION",
] as const;

/** The curated default dictionary, which a harness may replace wholesale. */
export const VISIBLE_ENVIRONMENT: readonly string[] = Object.freeze([
  ...UNIX_VARIABLES,
  ...TOOLING_VARIABLES,
]);

/**
 * How a harness reads one variable from whatever it has.
 *
 * A function rather than an object, because the browser harness has nothing to
 * pass and the Deno one must not hand over `Deno.env` itself.
 */
export type EnvironmentReader = (name: string) => string | undefined;

/**
 * Reads only the declared variables, one name at a time.
 *
 * Never a wholesale read. Asking for the names the dictionary lists is what
 * makes the dictionary the bound: a variable it omits is never read, so it
 * cannot arrive by accident when the host grows a new one.
 *
 * A read the host refuses is absent for the same reason a read the dictionary
 * omits is absent — the harness's own permission flags must not become
 * something a program can detect.
 */
export const visibleEnvironment = (
  read: EnvironmentReader,
  visible: Iterable<string> = VISIBLE_ENVIRONMENT,
): StringMap => {
  const environment: StringMap = {};
  for (const name of visible) {
    const value = readOrAbsent(read, name);
    if (value !== undefined) environment[name] = value;
  }
  return environment;
};

const readOrAbsent = (
  read: EnvironmentReader,
  name: string,
): string | undefined => {
  try {
    return read(name);
  } catch {
    return undefined;
  }
};
