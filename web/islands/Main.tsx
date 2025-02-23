import { useSignal } from "@preact/signals";
import Executor from "./Executor.tsx";
import Historian from "./Historian.tsx";
import Reset from "./Reset.tsx";
import { HCLang } from "@swanfactory/hclang";

/**
 * Main component that orchestrates the HCLang REPL interface.
 * Manages the HCLang instance and output state using signals.
 * Coordinates between Executor, Historian, and Reset components.
 *
 * @returns {JSX.Element} The rendered REPL interface
 */
/**
 * Main component that manages HCLang state and user interactions
 * @returns The main application interface
 */
export default function Main(): JSX.Element {
  const hclang = useSignal(new HCLang());
  const output = useSignal("");

  const handleSubmit = async (input: string) => {
    output.value = await hclang.value.call(input);
  };

  const handleReset = () => {
    hclang.value.reset();
    output.value = "";
  };

  return (
    <div>
      <Executor onSubmit={handleSubmit} latestOutput={output.value} />
      <Historian hclang={hclang.value} />
      <Reset onReset={handleReset} />
    </div>
  );
}
