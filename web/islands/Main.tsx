import { useSignal } from "@preact/signals";
import Executor from "./Executor.tsx";
import Historian from "./Historian.tsx";
import Reset from "./Reset.tsx";
import { HCLang } from "@swanfactory/hclang";

export default function Main() {
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
