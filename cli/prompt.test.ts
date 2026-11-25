import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { HCEval } from "../lib/execute/hc-eval.ts";
import { FrameArray } from "../lib/frames.ts";
import { VERSION } from "../lib/version.ts";
import { Prompt } from "./prompt.ts";

/** The `hc` task's flags, so the REPL runs under the grant a user gets. */
const FLAGS = [
  "--allow-read",
  "--allow-write",
  "--allow-env",
  "--deny-run",
  "--deny-ffi",
];

/**
 * An `hc` REPL in a child process, driven one line at a time.
 *
 * `Prompt` hands each `read()` chunk of stdin to the evaluator as one input, so
 * every line is written only after the prompt for it has arrived. The child
 * inherits `DENO_COVERAGE_DIR`, so a coverage run counts what it executes.
 */
class Repl {
  readonly #child: Deno.ChildProcess;
  readonly #stdin: WritableStreamDefaultWriter<Uint8Array>;
  readonly #stdout: ReadableStreamDefaultReader<string>;
  readonly #stderr: Promise<string>;
  #output = "";
  #seen = 0;

  constructor(...args: string[]) {
    this.#child = new Deno.Command(Deno.execPath(), {
      args: ["run", ...FLAGS, "hc.ts", ...args],
      cwd: new URL(".", import.meta.url),
      env: { NO_COLOR: "1" },
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    this.#stdin = this.#child.stdin.getWriter();
    this.#stdout = this.#child.stdout.pipeThrough(new TextDecoderStream())
      .getReader();
    this.#stderr = new Response(this.#child.stderr).text();
  }

  /** Reads until the output ends with `prompt`; answers what arrived since the last call. */
  async until(prompt: string): Promise<string> {
    while (!this.#output.slice(this.#seen).endsWith(prompt)) {
      const { value, done } = await this.#stdout.read();
      if (done) {
        throw new Error(
          `hc exited before printing ${JSON.stringify(prompt)}:\n` +
            this.#output + (await this.#stderr),
        );
      }
      this.#output += value;
    }
    return this.#take();
  }

  async write(line: string): Promise<void> {
    await this.#stdin.write(new TextEncoder().encode(line));
  }

  /** Closes stdin, then answers the exit code, the rest of stdout and stderr. */
  async end(): Promise<{ code: number; rest: string; stderr: string }> {
    await this.#stdin.close();
    while (true) {
      const { value, done } = await this.#stdout.read();
      if (done) break;
      this.#output += value;
    }
    const { code } = await this.#child.status;
    return { code, rest: this.#take(), stderr: await this.#stderr };
  }

  #take(): string {
    const text = this.#output.slice(this.#seen);
    this.#seen = this.#output.length;
    return text;
  }
}

describe("the hc REPL", () => {
  it("greets, answers each line and prompts again for an unclosed form", async () => {
    const repl = new Repl();
    expect(await repl.until("; ")).toEqual(`.hc ${VERSION};\n; `);
    await repl.write("1 + 2\n");
    expect(await repl.until("; ")).toEqual("# 3\n; ");
    await repl.write("(3\n");
    expect(await repl.until("# # ")).toEqual("# # ");
    await repl.write(")\n");
    expect(await repl.until("; ")).toEqual("# 3\n; ");
    // A blank line ends the REPL before end of input.
    await repl.write("\n");
    expect(await repl.end()).toEqual({ code: 0, rest: "", stderr: "" });
  });

  it("ends at end of input", async () => {
    const repl = new Repl();
    expect(await repl.until("; ")).toEqual(`.hc ${VERSION};\n; `);
    await repl.write("1 + 2\n");
    expect(await repl.until("; ")).toEqual("# 3\n; ");
    expect(await repl.end()).toEqual({ code: 0, rest: "", stderr: "" });
  });

  it("starts after an evaluated source unit when asked to", async () => {
    const repl = new Repl("--evaluate=1 + 2", "--interactive");
    expect(await repl.until("; ")).toEqual(`3\n.hc ${VERSION};\n; `);
    expect(await repl.end()).toEqual({ code: 0, rest: "", stderr: "" });
  });
});

describe("Prompt.repl", () => {
  // `main` discards what `repl` answers (`cli/hc.ts:171`), so the exit code
  // above cannot show it. A stubbed input stream does.
  class Scripted extends Prompt {
    constructor(private readonly inputs: string[]) {
      super(new HCEval(new FrameArray([])));
    }
    protected override async *getInputStream(): AsyncGenerator<string> {
      yield* this.inputs;
    }
  }
  const quietly = async (run: () => Promise<boolean>): Promise<boolean> => {
    const log = console.log;
    console.log = () => {};
    try {
      return await run();
    } finally {
      console.log = log;
    }
  };

  it("answers false when a blank line ends it", async () => {
    const prompt = new Scripted(["1 + 2", ""]);
    expect(await quietly(() => prompt.repl())).toBe(false);
  });

  it("answers true when the input ends", async () => {
    const prompt = new Scripted(["1 + 2"]);
    expect(await quietly(() => prompt.repl())).toBe(true);
  });
});
