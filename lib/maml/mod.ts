/**
 * MAML, the Multipurpose Abstract Markup Language, renders HC frames as HTML.
 *
 * ```ts
 * import { evaluate } from "@swanfactory/hclang";
 * import { maml } from "@swanfactory/hclang/maml";
 *
 * console.log(maml.call(evaluate('"Hello, MAML!"').at(0)).toString());
 * ```
 *
 * @module
 */
export { maml } from "./maml.ts";
export { tag } from "./tag.ts";
