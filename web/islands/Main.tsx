import { useEffect, useState } from "preact/hooks";
import Executor from "./Executor.tsx";
import Historian from "./Historian.tsx";
import Reset from "./Reset.tsx";
import { HCLang } from "@swanfactory/hclang";

export default function Main() {
  const [hclang] = useState(() => new HCLang());
  const [history, setHistory] = useState(hclang.getHistory());
  const [latestOutput, setLatestOutput] = useState("");

  const handleSubmit = async (input: string) => {
    const result = await hclang.call(input);
    setLatestOutput(result);
    setHistory(hclang.getHistory());
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
