import { execute } from "./execute.ts";
import { Context, contextString, make_context, StringMap } from "../mod.ts";

/**
 * HistoryPair is an object representing the input-output pair of an executed command.
 *
 * @property input - The input string that was executed.
 * @property output - The output string that was produced by the execution.
 */
export type HistoryPair = { input: string; output: string };

/**
 * Creates an instance of HCLang.
 *
 * @param environment - An optional object representing the initial environment
 *                      variables for the execution context. Defaults to an empty object.
 *
 * Initializes the execution context with the provided environment and sets up
 * an empty history array to store the input-output pairs of executed commands.
 */

export class HCLang {
  /**
   * context is an object representing the execution environment.
   */
  private context: Context;

  /**
   * history is an array of objects representing the input-output pairs of executed commands.
   */
  protected history: HistoryPair[];

  /**
   * constructor creates an instance of HCLang.
   *
   * @param environment - An optional object representing the initial environment
   *                      variables for the execution context. Defaults to an empty object.
   */
  constructor(environment: StringMap = {}) {
    this.context = make_context(environment);
    this.history = []; // Array of { input, output } objects
  }

  /**
   * Returns a string representation of the current execution context.
   *
   * @returns {string} A string representation of the current execution context.
   */
  getContextString(): string {
    return contextString(this.context);
  }

  /**
   * Executes the given input string and returns the result as a string.
   *
   * @param input - The input string to be executed.
   * @returns A promise that resolves to the result of the execution as a string.
   *
   * @throws Will return an error message string if the execution fails.
   *
   * The result or error message is also stored in the history array.
   */
  async call(input: string): Promise<string> {
    try {
      const output = await execute(input, this.context);
      const result = String(output);
      this.history.push({ input, output: result }); // Store as an object
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error
        ? `Error: ${error.message}`
        : "Unknown error";
      this.history.push({ input, output: errorMsg });
      return errorMsg;
    }
  }

  /**
   * Returns the history array
   * @returns An array of objects representing the HistoryPairs of executed commands.
   *
   * Each HistoryPair has the following structure:
   * - input: The input string that was executed.
   * - output: The output string that was produced by the execution
   */
  getHistory(): HistoryPair[] {
    return this.history;
  }

  /**
   * Resets the execution state and clears the history.
   *
   * This method reinitializes the `context` to an empty object and
   * clears the `history` array, effectively resetting the state
   * of the execution environment.
   */
  reset() {
    this.context = {}; // Reset execution state
    this.history = []; // Clear history
  }
}
