import { useState } from "preact/hooks";
import { evaluate } from "../../src/mod.ts";

function evaluateCode(code: string): string {
  try {
    const result = evaluate(code);
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

  const handleEvaluation = (code: string): void => {
    setError("");
    setIsLoading(true);
    try {
      const evalResult = evaluateCode(code);
      setResult(evalResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText((e.target as HTMLInputElement).value);
          handleEvaluation((e.target as HTMLInputElement).value);
        }}
        className="px-4 py-2 border rounded"
        placeholder="Enter code to evaluate"
      />
      {isLoading && <div>Evaluating...</div>}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      {result && !error && (
        <div className="p-4 bg-gray-100 rounded">
          <pre className="font-mono">{result}</pre>
        </div>
      )}
    </div>
  );
}
