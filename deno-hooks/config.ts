/**
 * Configuration types and parsing for deno-hooks
 */

import { parse as parseYaml } from "@std/yaml";

/**
 * Hook configuration
 */
export interface Hook {
  /** Unique identifier for the hook */
  id: string;
  /** Display name (defaults to id) */
  name?: string;
  /** Command to run or built-in hook name */
  run: string;
  /** File pattern to match (e.g., "*.ts") */
  glob?: string;
  /** Pass matched files as arguments */
  pass_filenames?: boolean;
  /** Exclude pattern */
  exclude?: string;
  /** Allow parallel execution */
  parallel?: boolean;
}

/**
 * Complete configuration structure
 */
export interface Config {
  hooks: {
    [hookName: string]: Hook[];
  };
}

/**
 * Load configuration from deno-hooks.yml or deno.json
 */
export async function loadConfig(rootDir: string): Promise<Config> {
  // Try deno-hooks.yml first
  const yamlPath = `${rootDir}/deno-hooks.yml`;
  try {
    const yamlContent = await Deno.readTextFile(yamlPath);
    const config = parseYaml(yamlContent) as Config;
    validateConfig(config);
    return config;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse ${yamlPath}: ${message}`);
    }
  }

  // Try deno.json
  const jsonPath = `${rootDir}/deno.json`;
  try {
    const jsonContent = await Deno.readTextFile(jsonPath);
    const json = JSON.parse(jsonContent);
    if (json["deno-hooks"]) {
      const config = json["deno-hooks"] as Config;
      validateConfig(config);
      return config;
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse ${jsonPath}: ${message}`);
    }
  }

  throw new Error(
    "No configuration found. Create deno-hooks.yml or add deno-hooks config to deno.json",
  );
}

/**
 * Validate configuration structure
 */
function validateConfig(config: Config): void {
  if (!config.hooks || typeof config.hooks !== "object") {
    throw new Error("Configuration must have a 'hooks' object");
  }

  for (const [hookName, hooks] of Object.entries(config.hooks)) {
    if (!Array.isArray(hooks)) {
      throw new Error(`hooks.${hookName} must be an array`);
    }

    for (const hook of hooks) {
      if (!hook.id) {
        throw new Error(`Hook in ${hookName} missing required 'id' field`);
      }
      if (!hook.run) {
        throw new Error(`Hook '${hook.id}' missing required 'run' field`);
      }
    }
  }
}

/**
 * Get hooks for a specific git hook trigger
 */
export function getHooksForTrigger(config: Config, hookName: string): Hook[] {
  return config.hooks[hookName] || [];
}
