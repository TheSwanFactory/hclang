import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeAll, describe, it } from "jsr:@std/testing@^1.0.10/bdd";
// Every non-test module under lib/ must load when it is the first module
// imported, so an import cycle that bites only a direct import cannot return.
// Each module is imported alone in its own module Worker, which has a fresh
// module graph, like a fresh `deno` process. A Worker inherits this test's
// permissions. `deno task test:load-order` grants read, to list and import the
// modules, and env, which execute/hc-log.ts reads while it loads; the rest of
// `deno task test:lib` runs with no permissions.

/** How many Workers load at once. */
const CONCURRENCY = 8;
/** How long a module may take to load before it counts as a hang. */
const TIMEOUT_MS = 10_000;
const LIB = new URL("./", import.meta.url);
/**
 * Each Worker's whole program: import the module URL it is sent, then report.
 * The URL comes as a message, not as a literal, because Deno type-checks a
 * Worker's static graph, a literal `import()` included: checking every
 * module's graph took about 13 s, and loading them all takes under 0.5 s.
 */
const BOOTSTRAP = `data:text/javascript,${
  encodeURIComponent(`self.onmessage = (event) =>
  import(event.data).then(
    () => postMessage(null),
    (error) => postMessage(String(error)),
  );`)
}`;

/**
 * Lists the non-test modules under a directory.
 *
 * @param dir The directory to walk.
 * @param prefix The directory's path relative to lib/.
 * @returns Each `.ts` file that is not a `.test.ts`, relative to lib/.
 */
async function modulesUnder(dir: URL, prefix = ""): Promise<string[]> {
  const modules: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const path = prefix + entry.name;
    if (entry.isDirectory) {
      const subdir = new URL(`${entry.name}/`, dir);
      modules.push(...await modulesUnder(subdir, `${path}/`));
    } else if (path.endsWith(".ts") && !path.endsWith(".test.ts")) {
      modules.push(path);
    }
  }
  return modules.sort();
}

/**
 * Imports one module first, in a fresh module Worker.
 *
 * @param module The module's path relative to lib/.
 * @returns `null` once it loads, else the first line of its error.
 */
async function loadFirst(module: string): Promise<string | null> {
  const worker = new Worker(BOOTSTRAP, { type: "module" });
  let timer: number | undefined;
  try {
    const error = await new Promise<string | null>((resolve) => {
      timer = setTimeout(
        () => resolve(`timed out after ${TIMEOUT_MS} ms`),
        TIMEOUT_MS,
      );
      worker.onmessage = (event: MessageEvent<string | null>) =>
        resolve(event.data);
      worker.onerror = (event) => {
        event.preventDefault();
        resolve(event.message);
      };
      worker.postMessage(new URL(module, LIB).href);
    });
    return error === null ? null : error.split("\n")[0];
  } finally {
    clearTimeout(timer);
    worker.terminate();
  }
}

/**
 * Imports each module first, a bounded number at a time.
 *
 * @param modules The modules' paths relative to lib/.
 * @returns Each module's {@link loadFirst} result.
 */
async function loadEachFirst(
  modules: string[],
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  const queue = [...modules];
  const work = async (): Promise<void> => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      results.set(next, await loadFirst(next));
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, work));
  return results;
}

describe("importing a lib/ module first", () => {
  let results: Map<string, string | null>;
  beforeAll(async () => {
    results = await loadEachFirst(await modulesUnder(LIB));
  });
  it("loads every module when imported first", () => {
    const failing = [...results]
      .filter(([, error]) => error !== null)
      .map(([module, error]) => `${module}: ${error}`)
      .sort();
    const summary =
      `${failing.length} of ${results.size} lib/ modules fail to load first`;
    expect(failing, summary).toEqual([]);
  });
});
