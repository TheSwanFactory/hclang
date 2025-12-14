/**
 * Hook execution context and result types
 */

import type { Hook } from "./config.ts";

/**
 * Context passed to hook implementations
 */
export interface HookContext {
  /** Matched files to process */
  files: string[];
  /** Current hook trigger name (e.g., "pre-commit") */
  hookName: string;
  /** Hook configuration */
  config: Hook;
  /** Git repository root directory */
  rootDir: string;
}

/**
 * Result returned by hook execution
 */
export interface HookResult {
  /** Whether the hook passed */
  success: boolean;
  /** Optional message to display */
  message?: string;
  /** Files that were modified (for auto-fixing hooks) */
  files?: string[];
}

/**
 * Hook implementation function signature
 */
export type HookFunction = (ctx: HookContext) => Promise<HookResult>;
