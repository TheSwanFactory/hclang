/**
 * MAML, the Multipurpose Abstract Markup Language, renders HC frames as HTML.
 *
 * ```ts
 * import { evaluate } from "@swanfactory/hclang";
 * import { maml } from "@swanfactory/hclang/maml";
 *
 * const page = maml.call(evaluate('"Hello, MAML!"').at(0));
 * console.log(page.toString());
 * // "“<!DOCTYPE html><html><head></head><body>Hello, MAML!</body></html>”"
 * ```
 *
 * @module
 */
export { maml } from "./maml.ts";
export { tag } from "./tag.ts";
