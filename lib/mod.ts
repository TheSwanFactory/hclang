export { VERSION } from "./version.ts";
export { evaluate } from "./execute/evaluate.ts";
export { execute } from "./execute/execute.ts";
export { make_context } from "./execute/hc-eval.ts";
export { HCLang, type HistoryPair } from "./execute/hc-lang.ts";
export {
  type Context,
  contextEqual,
  contextString,
  type Flags,
  Frame,
  type IKeyValuePair,
  MetaFrame,
  type StringMap,
} from "./frames.ts";
