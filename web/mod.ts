/**
 * Interactive Fresh/Preact components for the Homoiconic C playground.
 *
 * @example Register `@swanfactory/hcweb/islands/Main` with Fresh's
 * `islandSpecifiers`, then render its default export from a route.
 * @module
 */
export type { JSX } from "preact";
export type { HCLang } from "@swanfactory/hclang";

export { HCWEB_STYLES } from "./styles.ts";
export { default as Main } from "./islands/Main.tsx";
export {
  default as Executor,
  type ExecutorProps,
} from "./islands/Executor.tsx";
export {
  default as Historian,
  type HistorianProps,
} from "./islands/Historian.tsx";
export { default as Reset, type ResetProps } from "./islands/Reset.tsx";
