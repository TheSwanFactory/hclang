import { useState } from "preact/hooks";

import { evaluate } from "../../src/mod.ts";

function evaluateCode(code: string) {
  console.log(code);
  const result = evaluate(code);
  console.log(result);
  return result;
}

export default function Interpreter() {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={text}
        onChange={(e) => setText((e.target as HTMLInputElement).value)}
        className="px-4 py-2 border rounded"
        placeholder="Enter code to evaluate"
      />
      {text && (
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-bold">{evaluateCode(text)}</p>
        </div>
      )}
    </div>
  );
}
