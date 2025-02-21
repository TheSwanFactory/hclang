import { useEffect, useState } from "preact/hooks";
import { execute } from "@swanfactory/hclang";
import { History, HistoryItem } from "./History.tsx";

function evaluateCode(code: string): string {
  console.log(`Evaluating code: ${code}`);
  try {
    const result = execute(code);
    console.log(`Result: ${result}`);
    return result.toString();
  } catch (error: unknown) {
    console.error(error);
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export default function Interpreter() {
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("hc-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleEvaluation = (code: string): void => {
    setError("");
    setIsLoading(true);
    try {
      const context = history.map((item) => item.code).reverse().join("\n");
      const fullCode = context ? `${context}\n${code}` : code;
      const evalResult = evaluateCode(fullCode);
      setResult(evalResult);

      const newHistoryItem: HistoryItem = {
        code,
        result: evalResult,
        timestamp: Date.now(),
      };

      const updatedHistory = [newHistoryItem, ...history].slice(0, 50);
      setHistory(updatedHistory);
      localStorage.setItem("hc-history", JSON.stringify(updatedHistory));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryClick = (historyItem: HistoryItem) => {
    setText((prev) => `${prev}\n${historyItem.code}`);
  };

  const clearHistory = () => {
    setHistory([]);
    setText("");
    setResult("");
    setError("");
    localStorage.removeItem("hc-history");
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText((e.target as HTMLTextAreaElement).value)}
        placeholder="Enter code to evaluate"
        rows={10}
        cols={50}
      />
      <br />
      <button
        type="submit"
        onClick={() => handleEvaluation(text)}
        disabled={isLoading}
      >
        Evaluate
      </button>
      <div>
        {isLoading && <div>Evaluating...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {result && !error && (
          <div>
            <pre>{result}</pre>
          </div>
        )}
      </div>
      <History
        history={history}
        onHistoryClick={handleHistoryClick}
        onClearHistory={clearHistory}
      />
    </div>
  );
}
