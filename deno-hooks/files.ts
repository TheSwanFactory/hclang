/**
 * File utilities for getting and filtering files
 */

import { globToRegExp } from "@std/path/glob-to-regexp";

/**
 * Get the git repository root directory
 */
export async function getGitRoot(): Promise<string> {
  const command = new Deno.Command("git", {
    args: ["rev-parse", "--show-toplevel"],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to get git root: ${error}`);
  }

  return new TextDecoder().decode(stdout).trim();
}

/**
 * Get staged files for pre-commit hook
 */
export async function getStagedFiles(): Promise<string[]> {
  const command = new Deno.Command("git", {
    args: ["diff", "--cached", "--name-only", "--diff-filter=ACM"],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to get staged files: ${error}`);
  }

  const output = new TextDecoder().decode(stdout);
  return output.trim().split("\n").filter((f) => f.length > 0);
}

/**
 * Get modified files (staged + unstaged)
 */
export async function getModifiedFiles(): Promise<string[]> {
  const command = new Deno.Command("git", {
    args: ["diff", "--name-only", "--diff-filter=ACM"],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to get modified files: ${error}`);
  }

  const output = new TextDecoder().decode(stdout);
  const unstaged = output.trim().split("\n").filter((f) => f.length > 0);
  const staged = await getStagedFiles();

  return [...new Set([...staged, ...unstaged])];
}

/**
 * Get all tracked files in repository
 */
export async function getAllFiles(): Promise<string[]> {
  const command = new Deno.Command("git", {
    args: ["ls-files"],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to get all files: ${error}`);
  }

  const output = new TextDecoder().decode(stdout);
  return output.trim().split("\n").filter((f) => f.length > 0);
}

/**
 * Filter files by glob pattern
 */
export function filterFiles(files: string[], pattern: string): string[] {
  // Handle multiple patterns separated by comma (e.g., "*.{ts,js}")
  const patterns = expandGlobPattern(pattern);
  const regexps = patterns.map((p) => globToRegExp(p));

  return files.filter((file) => {
    return regexps.some((regexp) => regexp.test(file));
  });
}

/**
 * Expand glob patterns like "*.{ts,js}" into ["*.ts", "*.js"]
 */
function expandGlobPattern(pattern: string): string[] {
  // Simple brace expansion for patterns like "*.{ts,js,json}"
  const braceMatch = pattern.match(/^(.+)\{([^}]+)\}(.*)$/);
  if (braceMatch) {
    const [, prefix, options, suffix] = braceMatch;
    return options.split(",").map((opt) => `${prefix}${opt.trim()}${suffix}`);
  }
  return [pattern];
}

/**
 * Check if file matches any exclude pattern
 */
export function isExcluded(file: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;

  const regexps = patterns.flatMap((pattern) => {
    const expanded = expandGlobPattern(pattern);
    return expanded.map((p) => globToRegExp(p));
  });

  return regexps.some((regexp) => regexp.test(file));
}
