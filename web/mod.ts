export type { JSX } from "preact";
export type { HCLang } from "@swanfactory/hclang";

/**
 * Main component that manages HCLang state and user interactions
 * @module
 */
export { default as Main } from "./islands/Main.tsx";

/**
 * Component for executing HCLang commands
 * Provides input textarea and output display
 */
export {
  default as Executor,
  type ExecutorProps,
} from "./islands/Executor.tsx";

/**
 * Component for displaying HCLang execution history
 * Shows a table of previous input-output pairs
 */
export {
  default as Historian,
  type HistorianProps,
} from "./islands/Historian.tsx";

/**
 * Reset button component for clearing HCLang state
 */
export { default as Reset, type ResetProps } from "./islands/Reset.tsx";
