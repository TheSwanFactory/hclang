import { execute } from "./execute.ts";
import { Context, make_context, StringMap } from "../mod.ts";

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
  protected history: { input: string; output: string }[];

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
