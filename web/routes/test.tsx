import Executor from "../islands/Executor.tsx";
import Historian from "../islands/Historian.tsx";
import Reset from "../islands/Reset.tsx";
import { useState } from "preact/hooks";
import { execute } from "@swanfactory/hclang";

interface HistoryItem {
  input: string;
  output: string;
}

export default function Home() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [latestOutput, setLatestOutput] = useState("");

  const handleSubmit = async (input: string) => {
    try {
      const output = await execute(input);
      const result = String(output);
      setLatestOutput(result);
      setHistory((prev) => [{ input, output: result }, ...prev]);
    } catch (error: unknown) {
      const errorMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
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
      <header>
        <h1>Welcome to Homoiconic C!</h1>
        <p>Homoiconic C ("HC") is a universal data format for computation.</p>
        <a
          className="cheat-sheet"
          href="https://ihack.us/2024/09/19/tsm-5-homoiconic-c-hc-syntax-cheat-sheet/"
          target="_blank"
        >
          HC Cheat Sheet
        </a>
      </header>
      <main className="interpreter-wrapper">
        <h3>HCLang Interpreter</h3>
        <Executor onSubmit={handleSubmit} latestOutput={latestOutput} />
        <Historian history={history} />
        <Reset onReset={handleReset} />
      </main>
    </div>
  );
}
