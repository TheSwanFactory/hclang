import { build, emptyDir } from "jsr:@deno/dnt@0.43.2";

const ROOT_MANIFEST = "deno.json";
const OUTPUT_DIR = "dist/npm";

const rootManifest = JSON.parse(await Deno.readTextFile(ROOT_MANIFEST));
const version = Deno.args[0] ?? rootManifest.version;
if (version !== rootManifest.version) {
  throw new Error(
    `npm version ${version} does not match ${ROOT_MANIFEST} version ${rootManifest.version}`,
  );
}

await emptyDir(OUTPUT_DIR);
await build({
  entryPoints: [{
    kind: "bin",
    name: "hc",
    path: "./cli/hc.ts",
  }],
  outDir: OUTPUT_DIR,
  scriptModule: false,
  declaration: false,
  test: false,
  shims: {
    deno: true,
  },
  package: {
    name: "hclang",
    version,
    description: "Homoiconic C command-line interpreter and REPL",
    license: "MIT",
    author: "Ernest N. Prabhakar, Ph.D.",
    repository: {
      type: "git",
      url: "git+https://github.com/TheSwanFactory/hclang.git",
    },
    bugs: {
      url: "https://github.com/TheSwanFactory/hclang/issues",
    },
    homepage: "https://github.com/TheSwanFactory/hclang#readme",
    keywords: [
      "language",
      "markup",
      "programming",
      "html",
      "maml",
      "hc",
      "interpreter",
      "cli",
    ],
    engines: {
      node: ">=22",
    },
    dependencies: {
      "@deno/shim-deno": "0.19.2",
    },
    devDependencies: {
      "@types/node": "22.20.2",
    },
  },
  postBuild(): void {
    Deno.copyFileSync("LICENSE", `${OUTPUT_DIR}/LICENSE`);
    Deno.copyFileSync("README.md", `${OUTPUT_DIR}/README.md`);
  },
});
