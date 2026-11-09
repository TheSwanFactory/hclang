/**
 * Prints the 007.41 experiment report.
 *
 * ```sh
 * deno task experiment:observer-algebras
 * ```
 *
 * @module
 */
import { runExperiment } from "./experiment.ts";

if (import.meta.main) {
  console.log(runExperiment().join("\n"));
}
