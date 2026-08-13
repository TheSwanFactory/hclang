import { useSignal } from "@preact/signals";
import { HCLang } from "@swanfactory/hclang";
import type { JSX } from "preact";
import { HCWEB_STYLES } from "../styles.ts";
import Executor from "./Executor.tsx";
import Historian from "./Historian.tsx";
import Reset from "./Reset.tsx";

/** Owns the HC interpreter and coordinates the complete playground. */
export default function Main(): JSX.Element {
  const hclang = useSignal(new HCLang());
  const output = useSignal("");
  const error = useSignal("");
  const historyRevision = useSignal(0);

  const handleSubmit = async (input: string): Promise<void> => {
    const result = await hclang.value.call(input);
    if (result.startsWith("Error:") || result.startsWith("$!.")) {
      output.value = "";
      error.value = result;
    } else {
      output.value = result;
      error.value = "";
    }
    historyRevision.value += 1;
  };

  const handleReset = (): void => {
    hclang.value.reset();
    output.value = "";
    error.value = "";
    historyRevision.value += 1;
  };

  return (
    <>
      <style data-hcweb>{HCWEB_STYLES}</style>
      <article class="hcweb repl">
        <header class="repl__header">
          <p class="eyebrow">Homoiconic C</p>
          <h1>HC Playground</h1>
          <p>Evaluate HC directly in your browser.</p>
        </header>
        <Executor
          onSubmit={handleSubmit}
          latestOutput={output.value}
          latestError={error.value}
        />
        <Historian
          hclang={hclang.value}
          revision={historyRevision.value}
        />
        <Reset onReset={handleReset} />
      </article>
    </>
  );
}
