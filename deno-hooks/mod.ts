/**
 * Deno Hooks - A zero-dependency git hooks framework for Deno
 *
 * @module
 */

export { install } from "./install.ts";
export { run } from "./run.ts";
export type { Config, Hook } from "./config.ts";
export type { HookContext, HookResult } from "./hook.ts";
