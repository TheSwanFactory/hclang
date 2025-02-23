/**
 * Main component that manages HCLang state and user interactions
 * @module
 */
export { default as Main } from "./islands/Main.tsx";

/**
 * Component for executing HCLang commands
 * Provides input textarea and output display
 */
export { default as Executor } from "./islands/Executor.tsx";
import ExecutorProps from "./islands/Executor.tsx";
export type { ExecutorProps };

/**
 * Component for displaying HCLang execution history
 * Shows a table of previous input-output pairs
 */
export { default as Historian } from "./islands/Historian.tsx";
import HistorianProps from "./islands/Historian.tsx";
export type { HistorianProps };

/**
 * Reset button component for clearing HCLang state
 */
export { default as Reset } from "./islands/Reset.tsx";
import ResetProps from "./islands/Reset.tsx";
export type { ResetProps };
