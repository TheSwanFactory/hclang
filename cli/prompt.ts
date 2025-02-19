import { VERSION } from "../lib/version.ts";
import { HCEval } from "../lib/execute/hc-eval.ts";
import chalk from "@nothing628/chalk";

export class Prompt {
  constructor(private hc_eval: HCEval) {}

  /**
   * Generates a prompt string for the given level.
   *
   * @param {number} level - The level of indentation.
   * @returns {string} The generated prompt string.
   */
  public static make_prompt(level: number): string {
    const indent = 2 * (level - 1);
    const middle = " ".repeat(indent);
    return HCEval.EXPECT + middle + HCEval.EXPECT;
  }

  /**
   * Runs a Read-Eval-Print Loop (REPL) to continuously read input, evaluate it, and print the result.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if the REPL was successful, `false` otherwise.
   */
  public async repl(): Promise<boolean> {
    console.log(chalk.green(".hc " + VERSION + ";"));
    let status = true;
    for await (const input of this.getInputStream()) {
      if (!input) {
        status = false;
        break;
      }
      this.hc_eval.call(input);
    }
    return status;
  }

  protected async *getInputStream(): AsyncGenerator<string, void, unknown> {
    const decoder = new TextDecoderStream();
    const stdinStream = Deno.stdin.readable.pipeThrough(decoder);
    const reader = stdinStream.getReader();

    while (true) {
      let prefix = HCEval.SOURCE;
      if (this.hc_eval.level() > 0) {
        prefix = Prompt.make_prompt(this.hc_eval.level());
      }

      await Deno.stdout.write(new TextEncoder().encode(chalk.grey(prefix)));

      const { value, done } = await reader.read();
      if (done) break;
      yield value.trim();
    }
  }
}
