import { useState } from "preact/hooks";
import Executor from "./Executor.tsx";
import Historian from "./Historian.tsx";
import Reset from "./Reset.tsx";
import { execute } from "@swanfactory/hclang";

interface HistoryItem {
  input: string;
  output: string;
}

export default function Main() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [latestOutput, setLatestOutput] = useState("");

  const handleSubmit = async (input: string) => {
    try {
      const output = await execute(input);
      const result = String(output);
      setLatestOutput(result);
      setHistory((prev) => [{ input, output: result }, ...prev]);
    } catch (error: unknown) {
      const errorMsg = `Error: ${
        error instanceof Error ? error.message : String(error)
      }`;
      setLatestOutput(errorMsg);
      setHistory((prev) => [{ input, output: errorMsg }, ...prev]);
    }
  };

  const handleReset = () => {
    setHistory([]);
    setLatestOutput("");
  };

  return (
    <div>
      <Executor onSubmit={handleSubmit} latestOutput={latestOutput} />
      <Historian history={history} />
      <Reset onReset={handleReset} />
    </div>
  );
}
