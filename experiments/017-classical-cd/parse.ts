/**
 * Reads the `[“record”, …]` observations an HC run printed. Serialization
 * only: no mathematics happens here.
 *
 * A record has no nested brackets (every field is an integer, a string, or a
 * duration), so a record is found wherever it sits on a line, including inside
 * a list of records that one HC statement answered.
 *
 * @module
 */

/** One field: an HC integer, the text of an HC string, or a raw token. */
export type Field = number | string;

/** One HC observation: its tag and the fields after it. */
export interface HcRecord {
  tag: string;
  fields: Field[];
}

const RECORD = /\[“record”, ([^\[\]]*?)\]/g;

/** Parses one field token. Strings lose their quotes; integers become numbers. */
export function parseField(token: string): Field {
  const t = token.trim();
  if (t.startsWith("“") && t.endsWith("”")) return t.slice(1, -1);
  if (/^-?\d+$/.test(t)) return Number(t);
  return t;
}

/** Every record in the text, in order. */
export function parseRecords(text: string): HcRecord[] {
  const out: HcRecord[] = [];
  for (const m of text.matchAll(RECORD)) {
    const parts = m[1].split(", ").map(parseField);
    const [tag, ...fields] = parts;
    out.push({ tag: String(tag), fields });
  }
  return out;
}

/** Lines that show the runtime reported an error instead of a value. */
export function errorLines(text: string): string[] {
  return text.split("\n").filter((l) =>
    l.includes("$!") || l.includes("ParsePipe") ||
    l.includes("allocation failure") ||
    l.includes("heap out of memory") || l.includes("Uncaught")
  );
}

/** Splits an HC list field joined with “/” (a trailing “/” is dropped). */
export function splitList(field: Field): string[] {
  return String(field).split("/").filter((s) => s.length > 0);
}
