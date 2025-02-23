import { useState, useEffect } from "preact/hooks";
import Executor from "./Executor.tsx";
import Historian from "./Historian.tsx";
import Reset from "./Reset.tsx";
import { HCLang, type HistoryPair } from "@swanfactory/hclang";

export default function Main() {
  const [hclang] = useState(() => new HCLang());
  const [history, setHistory] = useState<HistoryPair[]>([]);
  const [latestOutput, setLatestOutput] = useState("");

  useEffect(() => {
    // Keep history in sync with HCLang
    setHistory(hclang.getHistory());
  }, [latestOutput]); // Update when output changes

  const handleSubmit = async (input: string) => {
    const result = await hclang.call(input);
    setLatestOutput(result);
  };

  const handleReset = () => {
    hclang.reset();
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
