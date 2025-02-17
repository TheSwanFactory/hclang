import { useState } from "preact/hooks";

export default function UppercaseConverter() {
  const [text, setText] = useState("");
  
  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={text}
        onChange={(e) => setText((e.target as HTMLInputElement).value)}
        className="px-4 py-2 border rounded"
        placeholder="Enter text to convert"
      />
      {text && (
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-bold">{text.toUpperCase()}</p>
        </div>
      )}
    </div>
  );
}
