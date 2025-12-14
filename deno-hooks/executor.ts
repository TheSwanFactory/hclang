/**
 * Hook executor - runs hook commands and built-in hooks
 */

import type { HookContext, HookResult } from "./hook.ts";

/**
 * Execute a hook
 */
export async function executeHook(ctx: HookContext): Promise<HookResult> {
  const { config } = ctx;

  // Check if it's a built-in hook
  const builtIn = getBuiltInHook(config.run);
  if (builtIn) {
    return await builtIn(ctx);
  }

  // Execute as shell command
  return await executeCommand(ctx);
}

/**
 * Get built-in hook implementation
 */
function getBuiltInHook(name: string): ((ctx: HookContext) => Promise<HookResult>) | null {
  const builtIns: Record<string, (ctx: HookContext) => Promise<HookResult>> = {
    "deno-fmt": denoFmt,
    "deno-lint": denoLint,
    "deno-test": denoTest,
  };

  return builtIns[name] || null;
}

/**
 * Execute a shell command
 */
async function executeCommand(ctx: HookContext): Promise<HookResult> {
  const { config, files, rootDir } = ctx;

  // Parse command (simple split on spaces - no shell expansion for security)
  const parts = config.run.split(" ");
  const cmd = parts[0];
  let args = parts.slice(1);

  // Add files if requested
  if (config.pass_filenames && files.length > 0) {
    args = [...args, ...files];
  }

  const command = new Deno.Command(cmd, {
    args,
    cwd: rootDir,
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    return { success: false, message: error.trim() };
  }

  const output = new TextDecoder().decode(stdout);
  return { success: true, message: output.trim() || undefined };
}

/**
 * Built-in: deno fmt
 */
async function denoFmt(ctx: HookContext): Promise<HookResult> {
  const { files, rootDir } = ctx;

  if (files.length === 0) {
    return { success: true, message: "no files to format" };
  }

  const command = new Deno.Command("deno", {
    args: ["fmt", "--check", ...files],
    cwd: rootDir,
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stderr } = await command.output();

  if (!success) {
    // Files need formatting - try to fix them
    const fixCommand = new Deno.Command("deno", {
      args: ["fmt", ...files],
      cwd: rootDir,
      stdout: "piped",
      stderr: "piped",
    });

    await fixCommand.output();

    const error = new TextDecoder().decode(stderr);
    return {
      success: false,
      message: `Formatted ${files.length} file(s). Re-stage and commit.\n${error}`,
      files,
    };
  }

  return { success: true, message: `${files.length} file(s) formatted` };
}

/**
 * Built-in: deno lint
 */
async function denoLint(ctx: HookContext): Promise<HookResult> {
  const { files, rootDir } = ctx;

  if (files.length === 0) {
    return { success: true, message: "no files to lint" };
  }

  const command = new Deno.Command("deno", {
    args: ["lint", ...files],
    cwd: rootDir,
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    const output = new TextDecoder().decode(stdout);
    return {
      success: false,
      message: error || output,
    };
  }

  return { success: true, message: `${files.length} file(s) linted` };
}

/**
 * Built-in: deno test
 */
async function denoTest(ctx: HookContext): Promise<HookResult> {
  const { rootDir } = ctx;

  const command = new Deno.Command("deno", {
    args: ["test", "-A"],
    cwd: rootDir,
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    const output = new TextDecoder().decode(stdout);
    return {
      success: false,
      message: error || output,
    };
  }

  const output = new TextDecoder().decode(stdout);
  return { success: true, message: output.trim() || "tests passed" };
}
